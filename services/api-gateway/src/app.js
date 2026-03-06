const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { createProxyMiddleware } = require('http-proxy-middleware');
const CircuitBreaker = require('opossum');
const prometheus = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const statusMonitor = require('express-status-monitor');

const config = require('./config/environment');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');
const serviceRegistry = require('./services/serviceRegistry');
const loadBalancer = require('./services/loadBalancer');
const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');
const metricsCollector = require('./utils/metricsCollector');
const healthChecker = require('./services/healthChecker');
const errorHandler = require('./middleware/errorHandler');

class EnterpriseAPIGateway {
  constructor() {
    this.app = express();
    this.server = null;
    this.redisClient = null;
    this.circuitBreakers = new Map();
    this.serviceInstances = new Map();
    this.metrics = {};
  }

  async initialize() {
    try {
      // Connect to Redis for caching and session management
      this.redisClient = await connectRedis();
      
      // Initialize service registry
      await serviceRegistry.initialize();
      
      // Setup Prometheus metrics
      this.setupMetrics();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup service discovery and routing
      await this.setupServiceRouting();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('Enterprise API Gateway initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize API Gateway:', error);
      process.exit(1);
    }
  }

  setupMetrics() {
    // Create Prometheus metrics
    this.metrics = {
      // Request metrics
      httpRequests: new prometheus.Counter({
        name: 'gateway_http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'service', 'status_code']
      }),

      httpDuration: new prometheus.Histogram({
        name: 'gateway_http_duration_seconds',
        help: 'Duration of HTTP requests',
        labelNames: ['method', 'route', 'service'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
      }),

      // Service metrics
      serviceHealth: new prometheus.Gauge({
        name: 'gateway_service_health',
        help: 'Health status of backend services',
        labelNames: ['service', 'instance']
      }),

      activeConnections: new prometheus.Gauge({
        name: 'gateway_active_connections',
        help: 'Number of active connections'
      }),

      // Circuit breaker metrics
      circuitBreakerState: new prometheus.Gauge({
        name: 'gateway_circuit_breaker_state',
        help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
        labelNames: ['service']
      }),

      // Rate limiting metrics
      rateLimitHits: new prometheus.Counter({
        name: 'gateway_rate_limit_hits_total',
        help: 'Total number of rate limit hits',
        labelNames: ['service', 'limit_type']
      }),

      // Load balancer metrics
      loadBalancerRequests: new prometheus.Counter({
        name: 'gateway_load_balancer_requests_total',
        help: 'Total requests per backend instance',
        labelNames: ['service', 'instance', 'algorithm']
      })
    };

    // Register metrics
    Object.values(this.metrics).forEach(metric => {
      prometheus.register.registerMetric(metric);
    });

    // Collect default metrics
    prometheus.collectDefaultMetrics({ prefix: 'gateway_' });

    logger.info('Prometheus metrics initialized');
  }

  setupMiddleware() {
    // Status monitoring dashboard
    this.app.use(statusMonitor({
      title: 'Enterprise API Gateway',
      path: '/status',
      spans: [
        { interval: 1, retention: 60 },
        { interval: 5, retention: 60 },
        { interval: 15, retention: 60 }
      ],
      chartVisibility: {
        cpu: true,
        mem: true,
        load: true,
        responseTime: true,
        rps: true,
        statusCodes: true
      }
    }));

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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-Forwarded-For'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-Response-Time']
    }));

    // Compression and logging
    this.app.use(compression());
    this.app.use(morgan('combined', { 
      stream: { write: message => logger.info(message.trim()) } 
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return req.path === '/health' || req.path === '/metrics' || req.path === '/status';
      },
      onLimitReached: (req) => {
        this.metrics.rateLimitHits.inc({ service: 'global', limit_type: 'requests' });
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      }
    });

    this.app.use(globalLimiter);

    // Slow down middleware for additional protection
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // allow 50 requests per 15 minutes at full speed
      delayMs: 500, // slow down subsequent requests by 500ms per request
      maxDelayMs: 20000, // maximum delay of 20 seconds
      skipFailedRequests: false,
      skipSuccessfulRequests: false
    });

    this.app.use('/api/', speedLimiter);

    // Request tracking middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      req.requestId = require('uuid').v4();
      
      res.setHeader('X-Request-ID', req.requestId);
      res.setHeader('X-Gateway-Version', '1.0.0');
      
      // Track active connections
      this.metrics.activeConnections.inc();
      
      res.on('finish', () => {
        const duration = (Date.now() - req.startTime) / 1000;
        
        // Record metrics
        this.metrics.httpRequests.inc({
          method: req.method,
          route: req.route?.path || req.path,
          service: req.targetService || 'unknown',
          status_code: res.statusCode
        });

        this.metrics.httpDuration.observe({
          method: req.method,
          route: req.route?.path || req.path,
          service: req.targetService || 'unknown'
        }, duration);

        this.metrics.activeConnections.dec();
        
        res.setHeader('X-Response-Time', `${duration}s`);
      });
      
      next();
    });
  }

  async setupServiceRouting() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'api-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: serviceRegistry.getHealthyServices()
      });
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', (req, res) => {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(prometheus.register.metrics());
    });

    // Service discovery endpoint
    this.app.get('/services', authMiddleware, (req, res) => {
      res.json({
        services: serviceRegistry.getAllServices(),
        loadBalancerStats: loadBalancer.getStats(),
        circuitBreakerStats: this.getCircuitBreakerStats()
      });
    });

    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({
      openapi: '3.0.0',
      info: {
        title: 'Enterprise API Gateway',
        version: '1.0.0',
        description: 'Centralized API Gateway for Microservices'
      },
      servers: [
        { url: `http://localhost:${config.port}`, description: 'Development' },
        { url: 'https://api.enterprise.com', description: 'Production' }
      ]
    }));

    // Setup service proxies with circuit breakers
    await this.setupServiceProxies();
  }

  async setupServiceProxies() {
    const services = [
      {
        name: 'auth-service',
        path: '/api/auth',
        target: config.services.authService.url,
        timeout: config.services.authService.timeout,
        retries: 3
      },
      {
        name: 'ai-service',
        path: '/api/ai',
        target: config.services.aiService.url,
        timeout: config.services.aiService.timeout,
        retries: 2
      },
      {
        name: 'user-service',
        path: '/api/users',
        target: config.services.userService.url,
        timeout: config.services.userService.timeout,
        retries: 3
      },
      {
        name: 'blockchain-service',
        path: '/api/blockchain',
        target: config.services.blockchainService.url,
        timeout: config.services.blockchainService.timeout,
        retries: 2
      },
      {
        name: 'notification-service',
        path: '/api/notifications',
        target: config.services.notificationService.url,
        timeout: config.services.notificationService.timeout,
        retries: 3
      }
    ];

    for (const service of services) {
      await this.createServiceProxy(service);
    }
  }

  async createServiceProxy(serviceConfig) {
    const { name, path, target, timeout, retries } = serviceConfig;

    // Create circuit breaker for the service
    const circuitBreakerOptions = {
      timeout: timeout || 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: `${name}-circuit-breaker`,
      group: name
    };

    const circuitBreaker = new CircuitBreaker(this.proxyRequest.bind(this), circuitBreakerOptions);
    
    // Circuit breaker event handlers
    circuitBreaker.on('open', () => {
      logger.warn(`Circuit breaker opened for ${name}`);
      this.metrics.circuitBreakerState.set({ service: name }, 1);
    });

    circuitBreaker.on('halfOpen', () => {
      logger.info(`Circuit breaker half-open for ${name}`);
      this.metrics.circuitBreakerState.set({ service: name }, 2);
    });

    circuitBreaker.on('close', () => {
      logger.info(`Circuit breaker closed for ${name}`);
      this.metrics.circuitBreakerState.set({ service: name }, 0);
    });

    this.circuitBreakers.set(name, circuitBreaker);

    // Create proxy middleware with load balancing
    const proxyMiddleware = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: ''
      },
      timeout,
      retries,
      
      // Custom router for load balancing
      router: async (req) => {
        const instances = await serviceRegistry.getHealthyInstances(name);
        if (instances.length === 0) {
          throw new Error(`No healthy instances available for ${name}`);
        }
        
        const selectedInstance = loadBalancer.selectInstance(name, instances, req);
        req.targetService = name;
        req.targetInstance = selectedInstance.id;
        
        this.metrics.loadBalancerRequests.inc({
          service: name,
          instance: selectedInstance.id,
          algorithm: loadBalancer.getAlgorithm(name)
        });
        
        return selectedInstance.url;
      },

      // Request interceptor
      onProxyReq: (proxyReq, req, res) => {
        // Add gateway headers
        proxyReq.setHeader('X-Gateway-Request-ID', req.requestId);
        proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
        proxyReq.setHeader('X-Forwarded-For', req.ip);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
        
        logger.debug(`Proxying ${req.method} ${req.path} to ${name}`);
      },

      // Response interceptor
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['X-Service-Name'] = name;
        proxyRes.headers['X-Service-Version'] = '1.0.0';
        
        // Log response
        logger.debug(`Response from ${name}: ${proxyRes.statusCode}`);
      },

      // Error handler
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${name}:`, err);
        
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service Unavailable',
            message: `${name} is currently unavailable`,
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Apply service-specific middleware
    const serviceMiddleware = [
      // Service-specific rate limiting
      rateLimitMiddleware.createServiceLimiter(name),
      
      // Authentication middleware (except for auth service)
      ...(name !== 'auth-service' ? [authMiddleware] : []),
      
      // Circuit breaker middleware
      async (req, res, next) => {
        try {
          req.circuitBreaker = circuitBreaker;
          await circuitBreaker.fire(req, res, next);
        } catch (error) {
          if (error.code === 'EOPENBREAKER') {
            res.status(503).json({
              error: 'Service Circuit Breaker Open',
              message: `${name} is currently unavailable due to repeated failures`,
              requestId: req.requestId,
              retryAfter: 30
            });
          } else {
            next(error);
          }
        }
      },
      
      // Proxy middleware
      proxyMiddleware
    ];

    // Register the route
    this.app.use(path, ...serviceMiddleware);
    
    logger.info(`Service proxy created: ${path} -> ${target}`);
  }

  async proxyRequest(req, res, next) {
    // This method is used by the circuit breaker
    // The actual proxying is handled by http-proxy-middleware
    return new Promise((resolve, reject) => {
      const originalEnd = res.end;
      const originalSend = res.send;
      
      res.end = function(...args) {
        if (res.statusCode >= 500) {
          reject(new Error(`Service error: ${res.statusCode}`));
        } else {
          resolve();
        }
        originalEnd.apply(this, args);
      };
      
      res.send = function(...args) {
        if (res.statusCode >= 500) {
          reject(new Error(`Service error: ${res.statusCode}`));
        } else {
          resolve();
        }
        originalSend.apply(this, args);
      };
      
      next();
    });
  }

  setupHealthMonitoring() {
    // Start health checking for all services
    healthChecker.startMonitoring(this.serviceInstances);
    
    // Update service registry based on health checks
    healthChecker.on('serviceDown', (serviceName, instanceId) => {
      serviceRegistry.markInstanceUnhealthy(serviceName, instanceId);
      this.metrics.serviceHealth.set({ service: serviceName, instance: instanceId }, 0);
      logger.warn(`Service instance marked unhealthy: ${serviceName}/${instanceId}`);
    });

    healthChecker.on('serviceUp', (serviceName, instanceId) => {
      serviceRegistry.markInstanceHealthy(serviceName, instanceId);
      this.metrics.serviceHealth.set({ service: serviceName, instance: instanceId }, 1);
      logger.info(`Service instance marked healthy: ${serviceName}/${instanceId}`);
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint was not found',
        path: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
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

  getCircuitBreakerStats() {
    const stats = {};
    
    for (const [serviceName, breaker] of this.circuitBreakers.entries()) {
      stats[serviceName] = {
        state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
        failures: breaker.stats.failures,
        successes: breaker.stats.successes,
        requests: breaker.stats.requests,
        errorRate: breaker.stats.errorRate
      };
    }
    
    return stats;
  }

  async start() {
    const port = config.port;
    
    this.server = this.app.listen(port, () => {
      logger.info(`🚪 Enterprise API Gateway running on port ${port}`);
      logger.info(`🌐 Environment: ${config.env}`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      logger.info(`📊 Metrics: http://localhost:${port}/metrics`);
      logger.info(`📈 Status Monitor: http://localhost:${port}/status`);
      logger.info(`📚 API Docs: http://localhost:${port}/api-docs`);
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
    
    try {
      // Stop health monitoring
      healthChecker.stopMonitoring();
      
      // Close circuit breakers
      for (const breaker of this.circuitBreakers.values()) {
        breaker.shutdown();
      }

      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          
          // Close Redis connection
          if (this.redisClient) {
            this.redisClient.quit();
          }
          
          logger.info('API Gateway shutdown complete');
          process.exit(0);
        });
      }
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Initialize and start the API Gateway
const apiGateway = new EnterpriseAPIGateway();

async function main() {
  try {
    await apiGateway.initialize();
    await apiGateway.start();
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnterpriseAPIGateway;