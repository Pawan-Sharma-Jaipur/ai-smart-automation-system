const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const modelService = require('../services/modelService');
const cacheService = require('../services/cacheService');
const analyticsService = require('../services/analyticsService');
const { validatePredictionInput } = require('../utils/validators');

class PredictionController {
  /**
   * Real-time Single Prediction with Enterprise Features
   */
  async predict(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        hour,
        dayOfWeek,
        usageCount,
        context,
        batteryLevel,
        avgUsageLastWeek,
        locationChanges,
        notificationCount,
        screenTime,
        modelId = 'default',
        useEnsemble = false,
        enableExplanation = true,
        cacheResults = true
      } = req.body;

      const userId = req.user?.userId;
      const sessionId = req.user?.sessionId;

      // Create feature object
      const features = {
        hour: parseInt(hour),
        dayOfWeek: parseInt(dayOfWeek) || new Date().getDay(),
        usageCount: parseInt(usageCount),
        context: parseInt(context),
        batteryLevel: parseFloat(batteryLevel) || 75,
        avgUsageLastWeek: parseFloat(avgUsageLastWeek) || 15,
        locationChanges: parseInt(locationChanges) || 2,
        notificationCount: parseInt(notificationCount) || 5,
        screenTime: parseFloat(screenTime) || 4
      };

      // Check cache first
      let prediction;
      const cacheKey = `prediction:${JSON.stringify(features)}:${modelId}`;
      
      if (cacheResults) {
        prediction = await cacheService.get(cacheKey);
        if (prediction) {
          logger.debug('Prediction served from cache');
          
          // Update analytics
          await analyticsService.recordPrediction({
            userId,
            sessionId,
            modelId,
            features,
            prediction,
            source: 'cache',
            timestamp: new Date()
          });

          return res.json({
            ...prediction,
            cached: true,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Make prediction
      const startTime = Date.now();
      
      if (useEnsemble) {
        // Use ensemble of multiple models
        const ensembleModels = await this.getEnsembleModels();
        prediction = await modelService.ensemblePredict(ensembleModels, features, {
          userId,
          sessionId,
          enableExplanation
        });
      } else {
        // Use single model
        prediction = await modelService.predict(modelId, features, {
          userId,
          sessionId,
          enableExplanation
        });
      }

      const processingTime = Date.now() - startTime;

      // Cache result
      if (cacheResults && prediction.confidence > 0.7) {
        await cacheService.set(cacheKey, prediction, 300); // 5 minutes
      }

      // Record analytics
      await analyticsService.recordPrediction({
        userId,
        sessionId,
        modelId: useEnsemble ? 'ensemble' : modelId,
        features,
        prediction,
        processingTime,
        source: 'model',
        timestamp: new Date()
      });

      // Enhanced response
      const response = {
        success: true,
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        processingTime,
        modelInfo: {
          modelId: useEnsemble ? 'ensemble' : modelId,
          version: prediction.modelVersion,
          type: useEnsemble ? 'ensemble' : 'single'
        },
        metadata: {
          features,
          timestamp: new Date().toISOString(),
          requestId: uuidv4()
        }
      };

      // Add explanation if requested
      if (enableExplanation && prediction.explanation) {
        response.explanation = prediction.explanation;
      }

      // Add ensemble details if applicable
      if (useEnsemble && prediction.individualPredictions) {
        response.ensembleDetails = {
          modelCount: prediction.modelCount,
          method: prediction.ensembleMethod,
          individualPredictions: prediction.individualPredictions.map(p => ({
            model: p.modelVersion,
            prediction: p.prediction,
            confidence: p.confidence
          }))
        };
      }

      logger.info(`Prediction completed: ${prediction.prediction} (${Math.round(prediction.confidence * 100)}%) in ${processingTime}ms`);

      res.json(response);

    } catch (error) {
      logger.error('Prediction error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Prediction failed',
        message: 'An error occurred while making the prediction',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Batch Prediction for Multiple Inputs
   */
  async batchPredict(req, res) {
    try {
      const { predictions, modelId = 'default', options = {} } = req.body;
      const userId = req.user?.userId;

      if (!Array.isArray(predictions) || predictions.length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Predictions array is required and must not be empty'
        });
      }

      if (predictions.length > 1000) {
        return res.status(400).json({
          error: 'Batch size too large',
          message: 'Maximum 1000 predictions per batch'
        });
      }

      const startTime = Date.now();
      const results = [];
      const errors = [];

      // Process predictions in parallel (with concurrency limit)
      const concurrencyLimit = 10;
      const chunks = this.chunkArray(predictions, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (features, index) => {
          try {
            const prediction = await modelService.predict(modelId, features, {
              userId,
              enableExplanation: options.enableExplanation || false
            });

            return {
              index: results.length + index,
              success: true,
              ...prediction
            };
          } catch (error) {
            logger.error(`Batch prediction error for item ${index}:`, error);
            return {
              index: results.length + index,
              success: false,
              error: error.message
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults.filter(r => r.success));
        errors.push(...chunkResults.filter(r => !r.success));
      }

      const processingTime = Date.now() - startTime;

      // Record batch analytics
      await analyticsService.recordBatchPrediction({
        userId,
        modelId,
        batchSize: predictions.length,
        successCount: results.length,
        errorCount: errors.length,
        processingTime,
        timestamp: new Date()
      });

      logger.info(`Batch prediction completed: ${results.length}/${predictions.length} successful in ${processingTime}ms`);

      res.json({
        success: true,
        results,
        errors,
        summary: {
          total: predictions.length,
          successful: results.length,
          failed: errors.length,
          processingTime,
          averageTimePerPrediction: Math.round(processingTime / predictions.length)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Batch prediction error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Batch prediction failed',
        message: 'An error occurred while processing batch predictions'
      });
    }
  }

  /**
   * A/B Test Prediction
   */
  async abTest(req, res) {
    try {
      const {
        hour,
        usageCount,
        context,
        batteryLevel,
        modelA = 'model_a',
        modelB = 'model_b'
      } = req.body;

      const userId = req.user?.userId;
      const features = { hour, usageCount, context, batteryLevel };

      const prediction = await modelService.abTestPrediction(modelA, modelB, features, {
        userId,
        enableExplanation: true
      });

      // Record A/B test analytics
      await analyticsService.recordABTest({
        userId,
        modelA,
        modelB,
        selectedModel: prediction.abTest.selectedModel,
        features,
        prediction,
        timestamp: new Date()
      });

      res.json({
        success: true,
        ...prediction,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('A/B test prediction error:', error);
      
      res.status(500).json({
        success: false,
        error: 'A/B test failed',
        message: 'An error occurred during A/B testing'
      });
    }
  }

  /**
   * Get Prediction History
   */
  async getHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const {
        limit = 50,
        offset = 0,
        modelId,
        startDate,
        endDate
      } = req.query;

      const history = await analyticsService.getPredictionHistory({
        userId,
        modelId,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: history.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting prediction history:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get prediction history'
      });
    }
  }

  /**
   * Get Model Performance Metrics
   */
  async getModelMetrics(req, res) {
    try {
      const { modelId = 'default' } = req.params;
      const userId = req.user?.userId;

      const metrics = await analyticsService.getModelMetrics(modelId, userId);

      res.json({
        success: true,
        modelId,
        metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting model metrics:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get model metrics'
      });
    }
  }

  /**
   * Feedback on Prediction Quality
   */
  async feedback(req, res) {
    try {
      const {
        predictionId,
        actualOutcome,
        rating,
        comments
      } = req.body;

      const userId = req.user?.userId;

      if (!predictionId || !actualOutcome) {
        return res.status(400).json({
          error: 'Prediction ID and actual outcome are required'
        });
      }

      await analyticsService.recordFeedback({
        predictionId,
        userId,
        actualOutcome,
        rating: parseInt(rating),
        comments,
        timestamp: new Date()
      });

      logger.info(`Feedback recorded for prediction: ${predictionId}`);

      res.json({
        success: true,
        message: 'Feedback recorded successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error recording feedback:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback'
      });
    }
  }

  /**
   * Real-time Model Comparison
   */
  async compareModels(req, res) {
    try {
      const { features, modelIds } = req.body;
      const userId = req.user?.userId;

      if (!Array.isArray(modelIds) || modelIds.length < 2) {
        return res.status(400).json({
          error: 'At least 2 model IDs are required for comparison'
        });
      }

      const startTime = Date.now();
      const comparisons = [];

      for (const modelId of modelIds) {
        try {
          const prediction = await modelService.predict(modelId, features, {
            userId,
            enableExplanation: true
          });

          comparisons.push({
            modelId,
            prediction: prediction.prediction,
            confidence: prediction.confidence,
            probabilities: prediction.probabilities,
            explanation: prediction.explanation?.summary
          });
        } catch (error) {
          logger.error(`Error comparing model ${modelId}:`, error);
          comparisons.push({
            modelId,
            error: error.message
          });
        }
      }

      const processingTime = Date.now() - startTime;

      // Analyze differences
      const analysis = this.analyzeModelComparison(comparisons);

      res.json({
        success: true,
        features,
        comparisons,
        analysis,
        processingTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error comparing models:', error);
      
      res.status(500).json({
        success: false,
        error: 'Model comparison failed'
      });
    }
  }

  /**
   * Helper Methods
   */
  async getEnsembleModels() {
    // Return list of models to use in ensemble
    // This could be configured based on performance metrics
    return ['model_v1', 'model_v2', 'model_v3'];
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  analyzeModelComparison(comparisons) {
    const validComparisons = comparisons.filter(c => !c.error);
    
    if (validComparisons.length === 0) {
      return { error: 'No valid predictions to compare' };
    }

    // Find consensus and disagreements
    const predictions = validComparisons.map(c => c.prediction);
    const uniquePredictions = [...new Set(predictions)];
    
    const consensus = uniquePredictions.length === 1;
    const mostConfident = validComparisons.reduce((max, current) => 
      current.confidence > max.confidence ? current : max
    );

    return {
      consensus,
      uniquePredictions: uniquePredictions.length,
      mostConfidentModel: mostConfident.modelId,
      highestConfidence: mostConfident.confidence,
      averageConfidence: validComparisons.reduce((sum, c) => sum + c.confidence, 0) / validComparisons.length,
      agreement: consensus ? 'Full agreement' : 'Models disagree'
    };
  }
}

module.exports = new PredictionController();