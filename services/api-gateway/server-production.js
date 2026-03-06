const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const authRoutes = require('../../shared/authRoutes');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json());

// Advanced rate limiting
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    https: req.secure,
    services: {
      ai: 'http://localhost:3002',
      user: 'http://localhost:3003',
      blockchain: 'http://localhost:3004'
    }
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Service proxies
app.use('/api/ai', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/ai': '/api/ai' }
}));

app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));

app.use('/api/blockchain', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/blockchain': '/api/blockchain' }
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start HTTP server
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP Server running on port ${HTTP_PORT}`);
});

// Start HTTPS server (if certificates exist)
try {
  const httpsOptions = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.cert')
  };
  
  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
  });
} catch (error) {
  console.log('⚠️  HTTPS not available (run: generate-ssl.bat)');
}

module.exports = app;
