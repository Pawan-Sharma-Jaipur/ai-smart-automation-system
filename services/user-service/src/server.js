const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('../../shared/database');
const { optionalAuth } = require('../../shared/authMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

app.get('/users', optionalAuth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

app.get('/users/:id', optionalAuth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

app.put('/users/:id', optionalAuth, async (req, res) => {
  try {
    const { role, status } = req.body;
    const updates = [];
    const values = [];
    
    if (role) { updates.push('role = ?'); values.push(role); }
    if (status) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id);
    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [users] = await db.execute(
      'SELECT id, username, email, role, status FROM users WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'User updated', user: users[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

app.delete('/users/:id', optionalAuth, async (req, res) => {
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

app.get('/users/:id/stats', optionalAuth, async (req, res) => {
  try {
    const [predictions] = await db.execute(
      'SELECT COUNT(*) as total, AVG(confidence) as avg_confidence FROM predictions WHERE user_id = ?',
      [req.params.id]
    );
    const [logs] = await db.execute(
      'SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?',
      [req.params.id]
    );
    res.json({ 
      success: true, 
      stats: { 
        predictions: predictions[0].total,
        avgConfidence: predictions[0].avg_confidence,
        auditLogs: logs[0].total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});
