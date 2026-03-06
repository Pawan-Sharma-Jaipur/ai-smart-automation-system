const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');

const config = require('./config/environment');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupPassport } = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const auditMiddleware = require('./middleware/audit');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const adminRoutes = require('./routes/admin');

class AuthService {
  constructor() {
    this.app = express();
    this.server = null;
    this.redisClient = null;
  }

  async initialize() {
    try {
      // Connect to databases
      await connectDB();
      this.redisClient = await connectRedis();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup authentication strategies
      setupPassport();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('Auth service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize auth service:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    }));

    // Compression and logging
    this.app.use(compression());
    this.app.use(morgan('combined', { 
      stream: { write: message => logger.info(message.trim()) } 
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      }
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session management
    this.app.use(session({
      store: new RedisStore({ client: this.redisClient }),
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      name: 'enterprise.sid',
      cookie: {
        secure: config.env === 'production',
        httpOnly: true,
        maxAge: config.session.maxAge,
        sameSite: 'strict'
      }
    }));

    // Passport initialization
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // Audit logging
    this.app.use(auditMiddleware);
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'auth-service',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: config.env
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/roles', roleRoutes);
    this.app.use('/api/admin', adminRoutes);

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        service: 'Enterprise Authentication Service',
        version: '1.0.0',
        endpoints: {
          authentication: '/api/auth/*',
          users: '/api/users/*',
          roles: '/api/roles/*',
          admin: '/api/admin/*'
        },
        documentation: 'https://docs.enterprise.com/auth-service'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  async start() {
    const port = config.port;
    
    this.server = this.app.listen(port, () => {
      logger.info(`🔐 Enterprise Auth Service running on port ${port}`);
      logger.info(`🌐 Environment: ${config.env}`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      logger.info(`📚 API Docs: http://localhost:${port}/api/docs`);
    });

    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  }

  async shutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections
        if (this.redisClient) {
          this.redisClient.quit();
        }
        
        logger.info('Auth service shutdown complete');
        process.exit(0);
      });
    }
  }
}

// Initialize and start the service
const authService = new AuthService();

async function main() {
  try {
    await authService.initialize();
    await authService.start();
  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AuthService;