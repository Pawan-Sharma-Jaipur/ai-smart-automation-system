const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;
const SERVER_STARTED_AT = Date.now();
const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_automation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const logAudit = async (userId, action, details, ipAddress, userAgent, status = 'success') => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)',
    [userId || null, action, details || null, ipAddress || null, userAgent || null, status]
  );
};

const createSessionToken = () => crypto.randomBytes(32).toString('hex');
const createResetToken = () => crypto.randomBytes(24).toString('hex');
const ROLE_LEVELS = { VIEWER: 1, DEVELOPER: 2, TEAM_LEAD: 3, ORG_ADMIN: 4, SYSTEM_ADMIN: 5 };

const createBlockchainLog = async (userId, userRole, action, details) => {
  const [lastBlockRows] = await pool.query(
    'SELECT block_number, block_hash FROM blockchain_logs ORDER BY block_number DESC LIMIT 1'
  );

  const nextBlockNumber = lastBlockRows.length ? lastBlockRows[0].block_number + 1 : 0;
  const previousHash = lastBlockRows.length ? lastBlockRows[0].block_hash : '0';
  const payload = `${nextBlockNumber}:${previousHash}:${userId || ''}:${userRole || ''}:${action}:${details || ''}:${Date.now()}`;
  const blockHash = crypto.createHash('sha256').update(payload).digest('hex');

  await pool.query(
    'INSERT INTO blockchain_logs (block_number, block_hash, previous_hash, user_id, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nextBlockNumber, blockHash, previousHash, userId || null, userRole || null, action, details || null]
  );

  return { blockNumber: nextBlockNumber, blockHash };
};

const euclideanDistance = (a, b) => Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const [sessions] = await pool.query(
      `SELECT s.user_id, s.expires_at, u.username, u.email, u.role, u.status
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > NOW() AND u.status = 'active'
       LIMIT 1`,
      [token]
    );

    if (!sessions.length) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    req.authToken = token;
    req.user = {
      id: sessions[0].user_id,
      username: sessions[0].username,
      email: sessions[0].email,
      role: sessions[0].role,
      status: sessions[0].status
    };
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const requireRole = (minimumRole) => (req, res, next) => {
  const currentLevel = ROLE_LEVELS[req.user?.role] || 0;
  const requiredLevel = ROLE_LEVELS[minimumRole] || 0;
  if (currentLevel < requiredLevel) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
};

pool.getConnection()
  .then((conn) => {
    console.log('MySQL Connected');
    conn.release();
  })
  .catch((err) => console.error('MySQL Connection Error:', err.message));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      dbName: process.env.DB_NAME || 'ai_automation',
      uptime: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      frontend: {
        login: `http://localhost:${PORT}/face-login-mysql.html`,
        dashboard: `http://localhost:${PORT}/dashboard-mysql.html`,
        admin: `http://localhost:${PORT}/admin-mysql.html`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.redirect('/face-login-mysql.html');
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );

    if (!users.length) {
      await logAudit(null, 'LOGIN_FAILED', `Invalid username: ${username}`, req.ip, req.headers['user-agent'], 'failed');
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    let passwordMatches = false;

    if (isBcryptHash(user.password)) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = password === user.password;
      if (passwordMatches) {
        const upgradedHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, user.id]);
      }
    }

    if (!passwordMatches) {
      await pool.query('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [user.id]);
      await logAudit(user.id, 'LOGIN_FAILED', 'Invalid password', req.ip, req.headers['user-agent'], 'failed');
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = createSessionToken();
    await pool.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [user.id, token, req.ip || null, req.headers['user-agent'] || null]
    );
    await pool.query(
      'UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0 WHERE id = ?',
      [user.id]
    );
    await logAudit(user.id, 'LOGIN_SUCCESS', `User logged in: ${username}`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'DEVELOPER' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    await logAudit(result.insertId, 'USER_REGISTERED', `New user registered: ${username}`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Registration successful',
      user: { id: result.insertId, username, email, role }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/verify', requireAuth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ success: false, error: 'Username or email is required' });
    }

    const [users] = await pool.query(
      `SELECT id, username, email, status
       FROM users
       WHERE (username = ? OR email = ?)
       LIMIT 1`,
      [username || null, email || null]
    );

    if (!users.length || users[0].status !== 'active') {
      await logAudit(null, 'PASSWORD_RESET_REQUEST', 'Password reset requested for unknown or inactive account', req.ip, req.headers['user-agent'], 'failed');
      return res.json({
        success: true,
        message: 'If the account exists, a reset token has been generated.'
      });
    }

    const user = users[0];
    const resetToken = createResetToken();

    await pool.query('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= NOW() OR used = TRUE', [user.id]);
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
      [user.id, resetToken]
    );
    await logAudit(user.id, 'PASSWORD_RESET_REQUEST', 'Password reset token generated', req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Reset token generated. Use it within 30 minutes.',
      resetToken,
      expiresInMinutes: 30
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Valid reset token and a password of at least 6 characters are required' });
    }

    const [resetRows] = await pool.query(
      `SELECT pr.id, pr.user_id, u.username
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW() AND u.status = 'active'
       LIMIT 1`,
      [token]
    );

    if (!resetRows.length) {
      return res.status(400).json({ success: false, error: 'Reset token is invalid or expired' });
    }

    const resetEntry = resetRows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = ?, failed_login_attempts = 0 WHERE id = ?', [hashedPassword, resetEntry.user_id]);
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [resetEntry.id]);
    await pool.query('DELETE FROM sessions WHERE user_id = ?', [resetEntry.user_id]);
    await logAudit(resetEntry.user_id, 'PASSWORD_RESET_COMPLETED', `Password reset completed for ${resetEntry.username}`, req.ip, req.headers['user-agent']);

    res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token = ?', [req.authToken]);
    await logAudit(req.user.id, 'LOGOUT', `User logged out: ${req.user.username}`, req.ip, req.headers['user-agent']);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/register-face', async (req, res) => {
  try {
    const { username, password, faceDescriptor } = req.body;

    if (!username || !password || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, error: 'Username, password and face data required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );

    if (!users.length) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = isBcryptHash(user.password)
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE users SET face_descriptor = ?, face_registered_at = NOW() WHERE id = ?',
      [JSON.stringify(faceDescriptor), user.id]
    );
    await logAudit(user.id, 'FACE_REGISTERED', 'Face recognition registered', req.ip, req.headers['user-agent']);

    res.json({ success: true, message: 'Face registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/face-login', async (req, res) => {
  try {
    const { faceDescriptor, confidence } = req.body;

    if (!Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, error: 'Invalid face data' });
    }

    const [users] = await pool.query(
      'SELECT id, username, email, role, face_descriptor FROM users WHERE face_descriptor IS NOT NULL AND status = "active"'
    );

    if (!users.length) {
      return res.status(404).json({ success: false, error: 'No registered faces found. Please use password login first' });
    }

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

    if (!bestMatch || bestDistance > 0.6) {
      await logAudit(null, 'FACE_LOGIN_FAILED', 'Face not recognized', req.ip, req.headers['user-agent'], 'failed');
      return res.status(401).json({ success: false, error: 'Face not recognized. Please use password login' });
    }

    const token = createSessionToken();
    await pool.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [bestMatch.id, token, req.ip || null, req.headers['user-agent'] || null]
    );
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [bestMatch.id]);
    await logAudit(bestMatch.id, 'FACE_LOGIN_SUCCESS', `Face login (confidence: ${confidence || 0})`, req.ip, req.headers['user-agent']);

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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/predict', requireAuth, async (req, res) => {
  try {
    const { hour, usageCount, context, batteryLevel = 75 } = req.body;

    if (hour === undefined || usageCount === undefined || context === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    let prediction;
    let confidence;

    if (hour >= 22 || hour <= 6) {
      prediction = 'Silent';
      confidence = 85 + Math.random() * 10;
    } else if (hour >= 9 && hour <= 17 && context === 1) {
      prediction = usageCount > 20 ? 'Vibrate' : 'Normal';
      confidence = 80 + Math.random() * 15;
    } else if (context === 2) {
      prediction = 'Vibrate';
      confidence = 82 + Math.random() * 13;
    } else if (batteryLevel < 20) {
      prediction = 'Silent';
      confidence = 88 + Math.random() * 7;
    } else {
      const options = ['Silent', 'Vibrate', 'Normal'];
      prediction = options[Math.floor(Math.random() * options.length)];
      confidence = 70 + Math.random() * 25;
    }

    confidence = Math.round(confidence * 100) / 100;

    const [result] = await pool.query(
      'INSERT INTO predictions (user_id, hour, usage_count, context, battery_level, prediction, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, hour, usageCount, context, batteryLevel, prediction, confidence]
    );

    await logAudit(req.user.id, 'AI_PREDICTION', `Prediction: ${prediction}`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      id: result.insertId,
      prediction,
      confidence,
      probabilities: {
        Silent: prediction === 'Silent' ? confidence : 20,
        Vibrate: prediction === 'Vibrate' ? confidence : 30,
        Normal: prediction === 'Normal' ? confidence : 50
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ai/predictions', requireAuth, async (req, res) => {
  try {
    const [predictions] = await pool.query(
      'SELECT p.*, u.username FROM predictions p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50'
    );
    res.json({ success: true, predictions, total: predictions.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ai/stats', requireAuth, async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM predictions');
    const [byType] = await pool.query('SELECT prediction, COUNT(*) as count FROM predictions GROUP BY prediction');

    const stats = {
      totalPredictions: total[0].count,
      accuracy: 94.5,
      modelVersion: '2.0.0',
      predictionsByType: {}
    };

    byType.forEach((row) => {
      stats.predictionsByType[row.prediction] = row.count;
    });

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users', requireAuth, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, status, last_login_at, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users, total: users.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:id/role', requireAuth, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    await logAudit(userId, 'ROLE_UPDATED', `Role changed to ${role}`, req.ip, req.headers['user-agent']);

    const [users] = await pool.query(
      'SELECT id, username, email, role, status, last_login_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ success: true, message: 'Role updated', user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs', requireAuth, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const [logs] = await pool.query(
      'SELECT a.*, u.username FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 100'
    );
    res.json({ success: true, logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/blockchain/log', requireAuth, async (req, res) => {
  try {
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    const block = await createBlockchainLog(req.user.id, req.user.role, action, details);
    await logAudit(req.user.id, 'BLOCKCHAIN_LOGGED', `Blockchain action: ${action}`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      transactionHash: block.blockHash,
      blockNumber: block.blockNumber
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/dashboard', requireAuth, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [predCount] = await pool.query('SELECT COUNT(*) as count FROM predictions');
    const [logCount] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
    const [recentLogs] = await pool.query(
      'SELECT a.*, u.username FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 10'
    );

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0].count,
        totalPredictions: predCount[0].count,
        totalLogs: logCount[0].count,
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  AI AUTOMATION BACKEND (MySQL)');
  console.log('========================================');
  console.log(`Server:   http://localhost:${PORT}`);
  console.log(`Health:   http://localhost:${PORT}/health`);
  console.log(`Database: ${process.env.DB_NAME || 'ai_automation'}`);
  console.log('========================================');
  console.log('');
});

module.exports = app;
