const { pool } = require('../config/database');

const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const validRoles = ['Admin', 'User', 'Guest', 'Child', 'Employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Role assignment failed' });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT al.*, u.username, u.role 
      FROM activity_logs al 
      JOIN users u ON al.user_id = u.id 
      ORDER BY al.timestamp DESC
    `);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, role, created_at FROM users');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

module.exports = { assignRole, getAllLogs, getAllUsers };
