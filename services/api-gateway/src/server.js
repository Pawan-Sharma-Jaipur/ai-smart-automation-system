const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const authRoutes = require('../../shared/authRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: false }));

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Smart Automation - API Gateway',
    version: '1.0.0',
    routes: ['/api/auth', '/api/ai', '/api/users', '/api/blockchain', '/health']
  });
});

// Auth routes (direct, no proxy)
app.use('/api/auth', authRoutes);

// Health Check
app.get('/health', async (req, res) => {
  const services = {
    ai: { url: process.env.AI_SERVICE_URL || 'http://localhost:3002', status: 'unknown' },
    user: { url: process.env.USER_SERVICE_URL || 'http://localhost:3003', status: 'unknown' },
    blockchain: { url: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004', status: 'unknown' }
  };

  // Check service health
  for (const [name, config] of Object.entries(services)) {
    try {
      const response = await fetch(`${config.url}/health`, { signal: AbortSignal.timeout(2000) });
      services[name].status = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      services[name].status = 'offline';
    }
  }

  res.json({
    status: 'healthy',
    gateway: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services
  });
});

// Service Routes with Proxy
const proxyServices = {
  ai: { url: process.env.AI_SERVICE_URL || 'http://localhost:3002', path: '/api/ai' },
  user: { url: process.env.USER_SERVICE_URL || 'http://localhost:3003', path: '/api/users' },
  blockchain: { url: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004', path: '/api/blockchain' }
};

Object.entries(proxyServices).forEach(([name, config]) => {
  app.use(config.path, createProxyMiddleware({
    target: config.url,
    changeOrigin: true,
    pathRewrite: { [`^${config.path}`]: '' },
    timeout: 30000,
    onError: (err, req, res) => {
      console.error(`[${name.toUpperCase()}] Proxy Error:`, err.message);
      res.status(503).json({ 
        success: false,
        error: `${name} service unavailable`, 
        message: err.message,
        service: name
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[${name.toUpperCase()}] ${req.method} ${req.path}`);
      // Forward auth headers
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
    }
  }));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found', 
    path: req.path,
    availableRoutes: ['/api/auth', '/api/ai', '/api/users', '/api/blockchain', '/health']
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(err.status || 500).json({ 
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful Shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🤖 AI: http://localhost:${PORT}/api/ai`);
  console.log(`👤 Users: http://localhost:${PORT}/api/users`);
  console.log(`⛓️  Blockchain: http://localhost:${PORT}/api/blockchain`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

module.exports = app;
