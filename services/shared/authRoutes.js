const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'DEVELOPER' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    // Log to audit
    await db.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [result.insertId, 'USER_REGISTERED', `New user: ${username}`, req.ip]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [user.id, token]
    );

    // Log to audit
    await db.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'USER_LOGIN', `User logged in: ${username}`, req.ip]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed', message: error.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const [sessions] = await db.execute(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await db.execute('DELETE FROM sessions WHERE token = ?', [token]);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (users.length > 0) {
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      await db.execute(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
        [users[0].id, token]
      );
      console.log(`Password reset token for ${email}: ${token}`);
      console.log(`Reset URL: http://localhost:3000/reset-password?token=${token}`);
    }
    
    res.json({ success: true, message: 'If email exists, reset link sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Request failed' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const [resets] = await db.execute(
      'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = 0',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resets[0].user_id]);
    await db.execute('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

    // Log to audit
    await db.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [resets[0].user_id, 'PASSWORD_RESET', 'Password reset successful', req.ip]
    );

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
});

// Face Recognition Login
router.post('/face-login', async (req, res) => {
  try {
    const { faceDescriptor, confidence } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, error: 'Invalid face data' });
    }

    if (confidence < 70) {
      return res.status(400).json({ success: false, error: 'Face detection confidence too low. Try again' });
    }

    // Get all users with face data
    const [users] = await db.execute(
      'SELECT id, username, email, role, face_descriptor FROM users WHERE face_descriptor IS NOT NULL AND status = "active"'
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No registered faces found. Please use password login first' 
      });
    }

    // Find matching face (simple Euclidean distance)
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const user of users) {
      const storedDescriptor = JSON.parse(user.face_descriptor);
      const distance = euclideanDistance(faceDescriptor, storedDescriptor);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    }

    // Threshold: 0.6 (lower = more similar)
    if (bestDistance > 0.6) {
      return res.status(401).json({ 
        success: false, 
        error: 'Face not recognized. Please use password login' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: bestMatch.id, username: bestMatch.username, role: bestMatch.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [bestMatch.id, token]
    );

    // Log to audit
    await db.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [bestMatch.id, 'FACE_LOGIN', `Face recognition login (confidence: ${confidence}%, match: ${(1 - bestDistance) * 100}%)`, req.ip]
    );

    res.json({
      success: true,
      token,
      user: {
        id: bestMatch.id,
        username: bestMatch.username,
        email: bestMatch.email,
        role: bestMatch.role
      },
      matchConfidence: Math.round((1 - bestDistance) * 100)
    });
  } catch (error) {
    console.error('Face login error:', error);
    res.status(500).json({ success: false, error: 'Face login failed', message: error.message });
  }
});

// Register face for existing user
router.post('/register-face', async (req, res) => {
  try {
    const { username, password, faceDescriptor } = req.body;

    if (!username || !password || !faceDescriptor) {
      return res.status(400).json({ success: false, error: 'Username, password and face data required' });
    }

    // Verify user credentials
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Store face descriptor
    await db.execute(
      'UPDATE users SET face_descriptor = ? WHERE id = ?',
      [JSON.stringify(faceDescriptor), user.id]
    );

    // Log to audit
    await db.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'FACE_REGISTERED', 'Face recognition registered', req.ip]
    );

    res.json({ 
      success: true, 
      message: 'Face registered successfully. You can now use face login' 
    });
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ success: false, error: 'Face registration failed' });
  }
});

// Helper function: Euclidean distance
function euclideanDistance(a, b) {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

module.exports = router;
