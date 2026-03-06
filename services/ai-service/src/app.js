const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const prometheus = require('prom-client');
const cron = require('node-cron');
const Bull = require('bull');

const config = require('./config/environment');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./utils/errorHandler');
const metricsCollector = require('./utils/metricsCollector');

// Route imports
const predictionRoutes = require('./routes/predictions');
const modelRoutes = require('./routes/models');
const trainingRoutes = require('./routes/training');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

class AIService {
  constructor() {
    this.app = express();
    this.server = null;
    this.redisClient = null;
    this.trainingQueue = null;
    this.predictionQueue = null;
    this.metrics = {};
    this.modelCache = new Map();
  }

  async initialize() {
    try {
      // Connect to databases
      await connectDB();
      this.redisClient = await connectRedis();
      
      // Initialize job queues
      this.setupQueues();
      
      // Setup Prometheus metrics
      this.setupMetrics();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup background jobs
      this.setupBackgroundJobs();
      
      // Initialize ML models
      await this.initializeModels();
      
      logger.info('AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
      process.exit(1);
    }
  }

  setupQueues() {
    // Training queue for model training jobs
    this.trainingQueue = new Bull('model training', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Prediction queue for batch predictions
    this.predictionQueue = new Bull('batch predictions', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50
      }
    });

    // Queue processors
    this.trainingQueue.process('train-model', require('./services/trainingProcessor'));
    this.predictionQueue.process('batch-predict', require('./services/predictionProcessor'));

    logger.info('Job queues initialized');
  }

  setupMetrics() {
    // Create Prometheus metrics
    this.metrics = {
      // Prediction metrics
      predictionRequests: new prometheus.Counter({
        name: 'ai_prediction_requests_total',
        help: 'Total number of prediction requests',
        labelNames: ['model', 'status', 'user_id']
      }),
      
      predictionDuration: new prometheus.Histogram({
        name: 'ai_prediction_duration_seconds',
        help: 'Duration of prediction requests',
        labelNames: ['model'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
      }),

      predictionAccuracy: new prometheus.Gauge({
        name: 'ai_model_accuracy',
        help: 'Current model accuracy',
        labelNames: ['model', 'version']
      }),

      // Model metrics
      modelLoads: new prometheus.Counter({
        name: 'ai_model_loads_total',
        help: 'Total number of model loads',
        labelNames: ['model', 'version']
      }),

      activeModels: new prometheus.Gauge({
        name: 'ai_active_models',
        help: 'Number of active models in memory'
      }),

      // Training metrics
      trainingJobs: new prometheus.Counter({
        name: 'ai_training_jobs_total',
        help: 'Total number of training jobs',
        labelNames: ['status']
      }),

      trainingDuration: new prometheus.Histogram({
        name: 'ai_training_duration_seconds',
        help: 'Duration of training jobs',
        buckets: [60, 300, 600, 1800, 3600, 7200]
      }),

      // System metrics
      memoryUsage: new prometheus.Gauge({
        name: 'ai_memory_usage_bytes',
        help: 'Memory usage of AI service'
      }),

      cacheHitRate: new prometheus.Gauge({
        name: 'ai_cache_hit_rate',
        help: 'Cache hit rate for predictions'
      })
    };

    // Register metrics
    prometheus.register.registerMetric(this.metrics.predictionRequests);
    prometheus.register.registerMetric(this.metrics.predictionDuration);
    prometheus.register.registerMetric(this.metrics.predictionAccuracy);
    prometheus.register.registerMetric(this.metrics.modelLoads);
    prometheus.register.registerMetric(this.metrics.activeModels);
    prometheus.register.registerMetric(this.metrics.trainingJobs);
    prometheus.register.registerMetric(this.metrics.trainingDuration);
    prometheus.register.registerMetric(this.metrics.memoryUsage);
    prometheus.register.registerMetric(this.metrics.cacheHitRate);

    // Collect default metrics
    prometheus.collectDefaultMetrics({ prefix: 'ai_service_' });

    logger.info('Prometheus metrics initialized');
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
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

    // Rate limiting for AI endpoints
    const aiLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: config.rateLimit.aiRequests || 100,
      message: {
        error: 'Too many AI requests',
        retryAfter: 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path === '/metrics'
    });

    this.app.use('/api/ai/', aiLimiter);

    // Body parsing with larger limits for ML data
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Metrics collection middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        
        if (req.path.startsWith('/api/ai/predict')) {
          this.metrics.predictionDuration.observe(
            { model: req.body?.model || 'unknown' },
            duration
          );
        }
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.use('/health', healthRoutes);
    
    // Metrics endpoint for Prometheus
    this.app.get('/metrics', (req, res) => {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(prometheus.register.metrics());
    });

    // API routes
    this.app.use('/api/ai/predict', predictionRoutes);
    this.app.use('/api/ai/models', modelRoutes);
    this.app.use('/api/ai/training', trainingRoutes);
    this.app.use('/api/ai/analytics', analyticsRoutes);

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        service: 'Enterprise AI/ML Service',
        version: '1.0.0',
        capabilities: [
          'Real-time predictions',
          'Batch processing',
          'Model training & deployment',
          'A/B testing',
          'Performance monitoring',
          'Auto-scaling'
        ],
        endpoints: {
          predictions: '/api/ai/predict/*',
          models: '/api/ai/models/*',
          training: '/api/ai/training/*',
          analytics: '/api/ai/analytics/*'
        },
        documentation: 'https://docs.enterprise.com/ai-service'
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

  setupBackgroundJobs() {
    // Model performance monitoring (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.updateModelMetrics();
      } catch (error) {
        logger.error('Error updating model metrics:', error);
      }
    });

    // Memory cleanup (every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.cleanupMemory();
      } catch (error) {
        logger.error('Error cleaning up memory:', error);
      }
    });

    // Model retraining check (every hour)
    cron.schedule('0 * * * *', async () => {
      try {
        await this.checkModelRetraining();
      } catch (error) {
        logger.error('Error checking model retraining:', error);
      }
    });

    logger.info('Background jobs scheduled');
  }

  async initializeModels() {
    try {
      const modelService = require('./services/modelService');
      
      // Load active models into memory
      const activeModels = await modelService.getActiveModels();
      
      for (const model of activeModels) {
        await modelService.loadModel(model.id);
        this.metrics.modelLoads.inc({ 
          model: model.name, 
          version: model.version 
        });
      }

      this.metrics.activeModels.set(activeModels.length);
      
      logger.info(`Initialized ${activeModels.length} ML models`);
    } catch (error) {
      logger.error('Error initializing models:', error);
      throw error;
    }
  }

  async updateModelMetrics() {
    try {
      const modelService = require('./services/modelService');
      const models = await modelService.getActiveModels();

      for (const model of models) {
        const metrics = await modelService.getModelMetrics(model.id);
        
        this.metrics.predictionAccuracy.set(
          { model: model.name, version: model.version },
          metrics.accuracy || 0
        );
      }

      // Update system metrics
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage.set(memUsage.heapUsed);

    } catch (error) {
      logger.error('Error updating model metrics:', error);
    }
  }

  async cleanupMemory() {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear unused models from cache
      const modelService = require('./services/modelService');
      await modelService.cleanupUnusedModels();

      logger.debug('Memory cleanup completed');
    } catch (error) {
      logger.error('Error during memory cleanup:', error);
    }
  }

  async checkModelRetraining() {
    try {
      const modelService = require('./services/modelService');
      const modelsNeedingRetraining = await modelService.getModelsNeedingRetraining();

      for (const model of modelsNeedingRetraining) {
        // Queue retraining job
        await this.trainingQueue.add('train-model', {
          modelId: model.id,
          type: 'retrain',
          priority: model.priority || 'normal'
        }, {
          priority: model.priority === 'high' ? 1 : 5
        });

        logger.info(`Queued retraining for model: ${model.name}`);
      }

    } catch (error) {
      logger.error('Error checking model retraining:', error);
    }
  }

  async start() {
    const port = config.port;
    
    this.server = this.app.listen(port, () => {
      logger.info(`🤖 Enterprise AI Service running on port ${port}`);
      logger.info(`🌐 Environment: ${config.env}`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      logger.info(`📊 Metrics: http://localhost:${port}/metrics`);
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
    
    try {
      // Close job queues
      if (this.trainingQueue) {
        await this.trainingQueue.close();
      }
      if (this.predictionQueue) {
        await this.predictionQueue.close();
      }

      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          
          // Close database connections
          if (this.redisClient) {
            this.redisClient.quit();
          }
          
          logger.info('AI service shutdown complete');
          process.exit(0);
        });
      }
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Initialize and start the service
const aiService = new AIService();

async function main() {
  try {
    await aiService.initialize();
    await aiService.start();
  } catch (error) {
    logger.error('Failed to start AI service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AIService;