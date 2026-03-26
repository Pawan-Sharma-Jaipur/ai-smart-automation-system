const express = require('express');
const cors = require('cors');
const authRoutes = require('./shared/authRoutes');

const app = express();
const PORT = 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Auth routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-standalone' });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`📍 Face Register: http://localhost:${PORT}/api/auth/register-face`);
  console.log(`📍 Face Login: http://localhost:${PORT}/api/auth/face-login`);
});
