const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const logger = require('../shared/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/requestLogger');
const { sanitizeInput } = require('./src/middleware/sanitize');
const { checkPermission, checkRole } = require('./src/middleware/rbac');
const CircuitBreaker = require('./src/middleware/circuitBreaker');

const app = express();
const PORT = process.env.PORT || 3000;

// Circuit breakers for each service
const circuitBreakers = {
  ai: new CircuitBreaker('ai-service', 5, 60000),
  user: new CircuitBreaker('user-service', 5, 60000),
  blockchain: new CircuitBreaker('blockchain-service', 5, 60000)
};

// Security middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      ai: process.env.AI_SERVICE_URL || 'http://localhost:3002',
      user: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004'
    },
    circuitBreakers: {
      ai: circuitBreakers.ai.getState(),
      user: circuitBreakers.user.getState(),
      blockchain: circuitBreakers.blockchain.getState()
    }
  };
  res.json(health);
});

// Service proxy with circuit breaker
const createResilientProxy = (serviceName, targetUrl) => {
  return async (req, res, next) => {
    try {
      await circuitBreakers[serviceName].execute(async () => {
        return new Promise((resolve, reject) => {
          const proxy = createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: { [`^/api/${serviceName}`]: '' },
            onError: (err, req, res) => {
              logger.error(`${serviceName} proxy error`, { error: err.message });
              reject(err);
            },
            onProxyRes: (proxyRes, req, res) => {
              if (proxyRes.statusCode >= 500) {
                reject(new Error(`${serviceName} returned ${proxyRes.statusCode}`));
              } else {
                resolve();
              }
            }
          });
          proxy(req, res, next);
        });
      });
    } catch (error) {
      next(error);
    }
  };
};

// Service routes
app.use('/api/ai', createResilientProxy('ai', process.env.AI_SERVICE_URL || 'http://localhost:3002'));
app.use('/api/users', createResilientProxy('user', process.env.USER_SERVICE_URL || 'http://localhost:3003'));
app.use('/api/blockchain', createResilientProxy('blockchain', process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004'));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`API Gateway started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    services: {
      ai: process.env.AI_SERVICE_URL || 'http://localhost:3002',
      user: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004'
    }
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;
