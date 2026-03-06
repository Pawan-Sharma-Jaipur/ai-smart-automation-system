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

// Enhanced security headers
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(cors({ 
  origin: process.env.CORS_ORIGINS?.split(',') || true,
  credentials: true 
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Advanced rate limiting
const createRateLimiter = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests', retryAfter: Math.ceil(windowMs / 1000) },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', createRateLimiter(15 * 60 * 1000, 5)); // 5 login attempts per 15 min
app.use('/api/auth/register', createRateLimiter(60 * 60 * 1000, 3)); // 3 registrations per hour
app.use('/api/', createRateLimiter(15 * 60 * 1000, 1000)); // 1000 API calls per 15 min

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    https: req.secure,
    services: {
      ai: 'http://localhost:3002',
      user: 'http://localhost:3003',
      blockchain: 'http://localhost:3004'
    }
  });
});

// Metrics endpoint for monitoring
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
  changeOrigin: true
}));

app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true
}));

app.use('/api/blockchain', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
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
    console.log(`✅ SSL/TLS Enabled`);
  });
} catch (error) {
  console.log('⚠️  HTTPS not available (SSL certificates not found)');
  console.log('   Run: npm run generate-cert to create self-signed certificates');
}

module.exports = app;
