const express = require('express');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const predictionController = require('../controllers/predictionController');
const authMiddleware = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const metricsMiddleware = require('../middleware/metrics');

const router = express.Router();

// Rate limiting for prediction endpoints
const predictionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 predictions per minute per user
  message: {
    error: 'Too many prediction requests',
    limit: 60,
    windowMs: 60000,
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 batch requests per 5 minutes
  message: {
    error: 'Too many batch prediction requests',
    limit: 10,
    windowMs: 300000
  }
});

// Validation schemas
const predictionValidation = [
  body('hour')
    .isInt({ min: 0, max: 23 })
    .withMessage('Hour must be between 0 and 23'),
  
  body('usageCount')
    .isInt({ min: 0, max: 100 })
    .withMessage('Usage count must be between 0 and 100'),
  
  body('context')
    .isInt({ min: 0, max: 2 })
    .withMessage('Context must be 0 (home), 1 (work), or 2 (public)'),
  
  body('batteryLevel')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Battery level must be between 0 and 100'),
  
  body('dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 and 6'),
  
  body('avgUsageLastWeek')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Average usage must be between 0 and 50'),
  
  body('locationChanges')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Location changes must be between 0 and 20'),
  
  body('notificationCount')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Notification count must be between 0 and 100'),
  
  body('screenTime')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Screen time must be between 0 and 24 hours'),
  
  body('modelId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model ID must be a valid string'),
  
  body('useEnsemble')
    .optional()
    .isBoolean()
    .withMessage('Use ensemble must be a boolean'),
  
  body('enableExplanation')
    .optional()
    .isBoolean()
    .withMessage('Enable explanation must be a boolean'),
  
  body('cacheResults')
    .optional()
    .isBoolean()
    .withMessage('Cache results must be a boolean')
];

const batchValidation = [
  body('predictions')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Predictions must be an array with 1-1000 items'),
  
  body('predictions.*.hour')
    .isInt({ min: 0, max: 23 })
    .withMessage('Each prediction hour must be between 0 and 23'),
  
  body('predictions.*.usageCount')
    .isInt({ min: 0, max: 100 })
    .withMessage('Each prediction usage count must be between 0 and 100'),
  
  body('predictions.*.context')
    .isInt({ min: 0, max: 2 })
    .withMessage('Each prediction context must be 0, 1, or 2'),
  
  body('modelId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model ID must be a valid string')
];

const abTestValidation = [
  body('hour')
    .isInt({ min: 0, max: 23 })
    .withMessage('Hour must be between 0 and 23'),
  
  body('usageCount')
    .isInt({ min: 0, max: 100 })
    .withMessage('Usage count must be between 0 and 100'),
  
  body('context')
    .isInt({ min: 0, max: 2 })
    .withMessage('Context must be 0, 1, or 2'),
  
  body('modelA')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model A ID is required'),
  
  body('modelB')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model B ID is required')
];

const feedbackValidation = [
  body('predictionId')
    .isUUID()
    .withMessage('Prediction ID must be a valid UUID'),
  
  body('actualOutcome')
    .isIn(['Silent', 'Vibrate', 'Normal'])
    .withMessage('Actual outcome must be Silent, Vibrate, or Normal'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

const historyValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  
  query('modelId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model ID must be a valid string'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const compareValidation = [
  body('features')
    .isObject()
    .withMessage('Features must be an object'),
  
  body('features.hour')
    .isInt({ min: 0, max: 23 })
    .withMessage('Hour must be between 0 and 23'),
  
  body('features.usageCount')
    .isInt({ min: 0, max: 100 })
    .withMessage('Usage count must be between 0 and 100'),
  
  body('features.context')
    .isInt({ min: 0, max: 2 })
    .withMessage('Context must be 0, 1, or 2'),
  
  body('modelIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Model IDs must be an array with 2-10 items'),
  
  body('modelIds.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each model ID must be a valid string')
];

// Routes

/**
 * @route   POST /api/ai/predict
 * @desc    Make a single prediction
 * @access  Protected
 */
router.post('/',
  authMiddleware,
  predictionLimiter,
  predictionValidation,
  validateRequest,
  metricsMiddleware('prediction_single'),
  predictionController.predict
);

/**
 * @route   POST /api/ai/predict/batch
 * @desc    Make batch predictions
 * @access  Protected
 */
router.post('/batch',
  authMiddleware,
  batchLimiter,
  batchValidation,
  validateRequest,
  metricsMiddleware('prediction_batch'),
  predictionController.batchPredict
);

/**
 * @route   POST /api/ai/predict/ab-test
 * @desc    A/B test prediction between two models
 * @access  Protected
 */
router.post('/ab-test',
  authMiddleware,
  predictionLimiter,
  abTestValidation,
  validateRequest,
  metricsMiddleware('prediction_ab_test'),
  predictionController.abTest
);

/**
 * @route   POST /api/ai/predict/compare
 * @desc    Compare predictions from multiple models
 * @access  Protected
 */
router.post('/compare',
  authMiddleware,
  predictionLimiter,
  compareValidation,
  validateRequest,
  metricsMiddleware('prediction_compare'),
  predictionController.compareModels
);

/**
 * @route   GET /api/ai/predict/history
 * @desc    Get prediction history for user
 * @access  Protected
 */
router.get('/history',
  authMiddleware,
  historyValidation,
  validateRequest,
  metricsMiddleware('prediction_history'),
  predictionController.getHistory
);

/**
 * @route   GET /api/ai/predict/metrics/:modelId
 * @desc    Get model performance metrics
 * @access  Protected
 */
router.get('/metrics/:modelId',
  authMiddleware,
  param('modelId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model ID must be a valid string'),
  validateRequest,
  metricsMiddleware('prediction_metrics'),
  predictionController.getModelMetrics
);

/**
 * @route   POST /api/ai/predict/feedback
 * @desc    Provide feedback on prediction quality
 * @access  Protected
 */
router.post('/feedback',
  authMiddleware,
  feedbackValidation,
  validateRequest,
  metricsMiddleware('prediction_feedback'),
  predictionController.feedback
);

module.exports = router;