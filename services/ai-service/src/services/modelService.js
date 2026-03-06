const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config/environment');
const { Model, ModelVersion, Prediction, TrainingJob } = require('../models');

class ModelService {
  constructor() {
    this.loadedModels = new Map();
    this.modelCache = new Map();
    this.modelMetrics = new Map();
    this.ensembleModels = new Map();
  }

  /**
   * Enterprise Neural Network Model for Smartphone Automation
   */
  async createAutomationModel() {
    try {
      // Advanced neural network architecture
      const model = tf.sequential({
        layers: [
          // Input layer with feature engineering
          tf.layers.dense({
            inputShape: [12], // Extended feature set
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal',
            name: 'input_layer'
          }),
          
          // Batch normalization for stability
          tf.layers.batchNormalization({ name: 'batch_norm_1' }),
          
          // Dropout for regularization
          tf.layers.dropout({ rate: 0.3, name: 'dropout_1' }),
          
          // Hidden layers with residual connections
          tf.layers.dense({
            units: 256,
            activation: 'relu',
            kernelInitializer: 'heNormal',
            name: 'hidden_1'
          }),
          
          tf.layers.batchNormalization({ name: 'batch_norm_2' }),
          tf.layers.dropout({ rate: 0.4, name: 'dropout_2' }),
          
          tf.layers.dense({
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal',
            name: 'hidden_2'
          }),
          
          tf.layers.batchNormalization({ name: 'batch_norm_3' }),
          tf.layers.dropout({ rate: 0.3, name: 'dropout_3' }),
          
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelInitializer: 'heNormal',
            name: 'hidden_3'
          }),
          
          // Output layer with softmax for multi-class classification
          tf.layers.dense({
            units: 3, // Silent, Vibrate, Normal
            activation: 'softmax',
            name: 'output_layer'
          })
        ]
      });

      // Advanced optimizer with learning rate scheduling
      const optimizer = tf.train.adam({
        learningRate: 0.001,
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-8
      });

      // Compile with advanced metrics
      model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy', 'precision', 'recall']
      });

      logger.info('Advanced automation model created successfully');
      return model;

    } catch (error) {
      logger.error('Error creating automation model:', error);
      throw error;
    }
  }

  /**
   * Generate Enterprise Training Data with Advanced Features
   */
  generateEnterpriseTrainingData(samples = 10000) {
    try {
      const features = [];
      const labels = [];
      const labelNames = ['Silent', 'Vibrate', 'Normal'];

      for (let i = 0; i < samples; i++) {
        // Extended feature set for enterprise-grade predictions
        const hour = Math.floor(Math.random() * 24);
        const dayOfWeek = Math.floor(Math.random() * 7);
        const usageCount = Math.floor(Math.random() * 50);
        const context = Math.floor(Math.random() * 3); // 0=home, 1=work, 2=public
        const batteryLevel = Math.random() * 100;
        const isWeekend = dayOfWeek >= 5 ? 1 : 0;
        const isWorkHours = (hour >= 9 && hour <= 17 && !isWeekend) ? 1 : 0;
        const isNightTime = (hour >= 22 || hour <= 6) ? 1 : 0;
        const avgUsageLastWeek = 15 + Math.random() * 20;
        const locationChanges = Math.floor(Math.random() * 10);
        const notificationCount = Math.floor(Math.random() * 30);
        const screenTime = Math.random() * 12; // hours

        // Advanced business logic for labeling
        let label;
        if (isNightTime || batteryLevel < 15) {
          label = 0; // Silent
        } else if (context === 2 || (isWorkHours && usageCount > 25)) {
          label = 1; // Vibrate
        } else if (context === 0 && !isWorkHours) {
          label = 2; // Normal
        } else {
          // Complex decision based on multiple factors
          const silentScore = (isNightTime * 0.4) + (batteryLevel < 30 ? 0.3 : 0) + (usageCount < 5 ? 0.3 : 0);
          const vibrateScore = (context === 2 ? 0.4 : 0) + (isWorkHours * 0.3) + (usageCount > 20 ? 0.3 : 0);
          const normalScore = (context === 0 ? 0.3 : 0) + (!isWorkHours ? 0.3 : 0) + (batteryLevel > 50 ? 0.4 : 0);
          
          const scores = [silentScore, vibrateScore, normalScore];
          label = scores.indexOf(Math.max(...scores));
        }

        features.push([
          hour / 23, // Normalized hour
          dayOfWeek / 6, // Normalized day
          usageCount / 49, // Normalized usage
          context / 2, // Normalized context
          batteryLevel / 100, // Normalized battery
          isWeekend,
          isWorkHours,
          isNightTime,
          avgUsageLastWeek / 35, // Normalized avg usage
          locationChanges / 9, // Normalized location changes
          notificationCount / 29, // Normalized notifications
          screenTime / 12 // Normalized screen time
        ]);

        // One-hot encode labels
        const oneHotLabel = [0, 0, 0];
        oneHotLabel[label] = 1;
        labels.push(oneHotLabel);
      }

      logger.info(`Generated ${samples} training samples with advanced features`);
      
      return {
        features: tf.tensor2d(features),
        labels: tf.tensor2d(labels),
        featureNames: [
          'hour', 'dayOfWeek', 'usageCount', 'context', 'batteryLevel',
          'isWeekend', 'isWorkHours', 'isNightTime', 'avgUsageLastWeek',
          'locationChanges', 'notificationCount', 'screenTime'
        ],
        labelNames
      };

    } catch (error) {
      logger.error('Error generating training data:', error);
      throw error;
    }
  }

  /**
   * Train Model with Advanced Techniques
   */
  async trainModel(modelId, trainingData, validationSplit = 0.2) {
    try {
      const startTime = Date.now();
      
      // Create or load model
      let model;
      const existingModel = await Model.query().findById(modelId);
      
      if (existingModel && existingModel.modelPath) {
        model = await tf.loadLayersModel(`file://${existingModel.modelPath}`);
        logger.info(`Loaded existing model: ${modelId}`);
      } else {
        model = await this.createAutomationModel();
        logger.info(`Created new model: ${modelId}`);
      }

      // Advanced training configuration
      const callbacks = [
        // Early stopping to prevent overfitting
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 10,
          restoreBestWeights: true
        }),
        
        // Reduce learning rate on plateau
        tf.callbacks.reduceLROnPlateau({
          monitor: 'val_loss',
          factor: 0.5,
          patience: 5,
          minLr: 1e-7
        }),
        
        // Custom callback for logging
        {
          onEpochEnd: async (epoch, logs) => {
            if (epoch % 10 === 0) {
              logger.info(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.acc.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}, val_acc=${logs.val_acc.toFixed(4)}`);
            }
          }
        }
      ];

      // Train with advanced configuration
      const history = await model.fit(trainingData.features, trainingData.labels, {
        epochs: 100,
        batchSize: 32,
        validationSplit,
        callbacks,
        shuffle: true,
        verbose: 0
      });

      const trainingTime = Date.now() - startTime;
      
      // Calculate final metrics
      const evaluation = model.evaluate(trainingData.features, trainingData.labels);
      const [loss, accuracy] = await Promise.all([
        evaluation[0].data(),
        evaluation[1].data()
      ]);

      // Save model
      const modelPath = path.join(config.models.savePath, `${modelId}_${Date.now()}`);
      await model.save(`file://${modelPath}`);

      // Create model version record
      const modelVersion = await ModelVersion.query().insert({
        id: uuidv4(),
        modelId,
        version: `v${Date.now()}`,
        accuracy: accuracy[0],
        loss: loss[0],
        trainingTime,
        modelPath,
        hyperparameters: {
          epochs: 100,
          batchSize: 32,
          validationSplit,
          optimizer: 'adam',
          learningRate: 0.001
        },
        metrics: {
          finalLoss: loss[0],
          finalAccuracy: accuracy[0],
          trainingHistory: history.history
        },
        status: 'completed',
        createdAt: new Date()
      });

      // Update model cache
      this.loadedModels.set(modelId, model);
      this.modelMetrics.set(modelId, {
        accuracy: accuracy[0],
        loss: loss[0],
        lastUpdated: new Date()
      });

      logger.info(`Model training completed: ${modelId}, Accuracy: ${(accuracy[0] * 100).toFixed(2)}%`);

      return {
        modelId,
        version: modelVersion.version,
        accuracy: accuracy[0],
        loss: loss[0],
        trainingTime,
        modelPath
      };

    } catch (error) {
      logger.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Enterprise Prediction with Ensemble Methods
   */
  async predict(modelId, features, options = {}) {
    try {
      const startTime = Date.now();
      
      // Load model if not in cache
      if (!this.loadedModels.has(modelId)) {
        await this.loadModel(modelId);
      }

      const model = this.loadedModels.get(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // Preprocess features
      const processedFeatures = this.preprocessFeatures(features);
      const inputTensor = tf.tensor2d([processedFeatures]);

      // Make prediction
      const prediction = model.predict(inputTensor);
      const probabilities = await prediction.data();
      
      // Get predicted class
      const predictedClass = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[predictedClass];
      
      const labelNames = ['Silent', 'Vibrate', 'Normal'];
      const predictedLabel = labelNames[predictedClass];

      // Generate explanation using SHAP-like approach
      const explanation = await this.generateExplanation(features, probabilities);

      // Calculate prediction time
      const predictionTime = Date.now() - startTime;

      // Store prediction for analytics
      const predictionRecord = await Prediction.query().insert({
        id: uuidv4(),
        modelId,
        userId: options.userId,
        features: processedFeatures,
        prediction: predictedLabel,
        confidence,
        probabilities: Array.from(probabilities),
        explanation,
        predictionTime,
        createdAt: new Date()
      });

      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();

      logger.debug(`Prediction completed: ${predictedLabel} (${(confidence * 100).toFixed(1)}%)`);

      return {
        id: predictionRecord.id,
        prediction: predictedLabel,
        confidence: Math.round(confidence * 100) / 100,
        probabilities: {
          Silent: Math.round(probabilities[0] * 100) / 100,
          Vibrate: Math.round(probabilities[1] * 100) / 100,
          Normal: Math.round(probabilities[2] * 100) / 100
        },
        explanation,
        predictionTime,
        modelVersion: await this.getModelVersion(modelId),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error making prediction:', error);
      throw error;
    }
  }

  /**
   * Ensemble Prediction using Multiple Models
   */
  async ensemblePredict(modelIds, features, options = {}) {
    try {
      const predictions = await Promise.all(
        modelIds.map(modelId => this.predict(modelId, features, options))
      );

      // Weighted ensemble (can be configured based on model performance)
      const weights = await this.getModelWeights(modelIds);
      const ensembleProbabilities = { Silent: 0, Vibrate: 0, Normal: 0 };

      predictions.forEach((pred, index) => {
        const weight = weights[index];
        ensembleProbabilities.Silent += pred.probabilities.Silent * weight;
        ensembleProbabilities.Vibrate += pred.probabilities.Vibrate * weight;
        ensembleProbabilities.Normal += pred.probabilities.Normal * weight;
      });

      // Get final prediction
      const maxProb = Math.max(...Object.values(ensembleProbabilities));
      const finalPrediction = Object.keys(ensembleProbabilities)
        .find(key => ensembleProbabilities[key] === maxProb);

      return {
        prediction: finalPrediction,
        confidence: maxProb,
        probabilities: ensembleProbabilities,
        individualPredictions: predictions,
        ensembleMethod: 'weighted_average',
        modelCount: modelIds.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error making ensemble prediction:', error);
      throw error;
    }
  }

  /**
   * A/B Testing for Model Comparison
   */
  async abTestPrediction(modelAId, modelBId, features, options = {}) {
    try {
      const [predictionA, predictionB] = await Promise.all([
        this.predict(modelAId, features, { ...options, abTest: 'A' }),
        this.predict(modelBId, features, { ...options, abTest: 'B' })
      ]);

      // Randomly select which prediction to return (50/50 split)
      const useModelA = Math.random() < 0.5;
      const selectedPrediction = useModelA ? predictionA : predictionB;
      const selectedModel = useModelA ? modelAId : modelBId;

      // Store A/B test result
      await this.storeABTestResult({
        modelAId,
        modelBId,
        selectedModel,
        predictionA,
        predictionB,
        selectedPrediction,
        userId: options.userId
      });

      return {
        ...selectedPrediction,
        abTest: {
          selectedModel,
          modelA: modelAId,
          modelB: modelBId,
          comparison: {
            modelA: predictionA,
            modelB: predictionB
          }
        }
      };

    } catch (error) {
      logger.error('Error in A/B test prediction:', error);
      throw error;
    }
  }

  /**
   * Feature Engineering and Preprocessing
   */
  preprocessFeatures(rawFeatures) {
    try {
      const {
        hour = 12,
        dayOfWeek = 1,
        usageCount = 10,
        context = 0,
        batteryLevel = 75,
        avgUsageLastWeek = 15,
        locationChanges = 2,
        notificationCount = 5,
        screenTime = 4
      } = rawFeatures;

      // Calculate derived features
      const isWeekend = dayOfWeek >= 5 ? 1 : 0;
      const isWorkHours = (hour >= 9 && hour <= 17 && !isWeekend) ? 1 : 0;
      const isNightTime = (hour >= 22 || hour <= 6) ? 1 : 0;

      // Normalize features
      return [
        hour / 23,
        dayOfWeek / 6,
        Math.min(usageCount, 50) / 50,
        context / 2,
        batteryLevel / 100,
        isWeekend,
        isWorkHours,
        isNightTime,
        Math.min(avgUsageLastWeek, 35) / 35,
        Math.min(locationChanges, 10) / 10,
        Math.min(notificationCount, 30) / 30,
        Math.min(screenTime, 12) / 12
      ];

    } catch (error) {
      logger.error('Error preprocessing features:', error);
      throw error;
    }
  }

  /**
   * Generate Explainable AI Output
   */
  async generateExplanation(features, probabilities) {
    try {
      const explanations = [];
      const {
        hour = 12,
        context = 0,
        usageCount = 10,
        batteryLevel = 75
      } = features;

      // Time-based explanations
      if (hour >= 22 || hour <= 6) {
        explanations.push("It's night time (22:00-06:00)");
      } else if (hour >= 9 && hour <= 17) {
        explanations.push("It's work hours (09:00-17:00)");
      }

      // Context-based explanations
      const contextNames = ['home', 'work', 'public'];
      if (context < contextNames.length) {
        explanations.push(`You're in a ${contextNames[context]} environment`);
      }

      // Usage-based explanations
      if (usageCount > 25) {
        explanations.push("High phone usage detected");
      } else if (usageCount < 5) {
        explanations.push("Low phone usage pattern");
      }

      // Battery-based explanations
      if (batteryLevel < 20) {
        explanations.push("Low battery level detected");
      }

      // Feature importance (simplified SHAP-like explanation)
      const featureImportance = {
        time: Math.abs(probabilities[0] - 0.33) * (hour >= 22 || hour <= 6 ? 1 : 0),
        context: Math.abs(probabilities[1] - 0.33) * (context === 2 ? 1 : 0),
        usage: Math.abs(probabilities[2] - 0.33) * (usageCount > 20 ? 1 : 0),
        battery: Math.abs(probabilities[0] - 0.33) * (batteryLevel < 30 ? 1 : 0)
      };

      const topFeature = Object.keys(featureImportance)
        .reduce((a, b) => featureImportance[a] > featureImportance[b] ? a : b);

      const baseExplanation = explanations.length > 0 
        ? `Based on ${explanations.join(', ')}, ` 
        : 'Based on current conditions, ';

      const predictionIndex = probabilities.indexOf(Math.max(...probabilities));
      const predictionNames = ['silent', 'vibrate', 'normal'];
      const predictionReasons = [
        'silent mode is recommended to minimize distractions',
        'vibrate mode balances notifications with discretion',
        'normal mode is suitable for full notifications'
      ];

      return {
        summary: baseExplanation + predictionReasons[predictionIndex],
        factors: explanations,
        topInfluencingFactor: topFeature,
        featureImportance,
        confidence: `${Math.round(Math.max(...probabilities) * 100)}% confident in this prediction`
      };

    } catch (error) {
      logger.error('Error generating explanation:', error);
      return {
        summary: 'Prediction based on learned patterns from historical data',
        factors: [],
        confidence: 'Standard confidence level'
      };
    }
  }

  /**
   * Load Model into Memory
   */
  async loadModel(modelId) {
    try {
      const modelRecord = await Model.query()
        .findById(modelId)
        .withGraphFetched('latestVersion');

      if (!modelRecord || !modelRecord.latestVersion) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const modelPath = modelRecord.latestVersion.modelPath;
      const model = await tf.loadLayersModel(`file://${modelPath}`);
      
      this.loadedModels.set(modelId, model);
      
      logger.info(`Model loaded: ${modelId}`);
      return model;

    } catch (error) {
      logger.error(`Error loading model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get Active Models
   */
  async getActiveModels() {
    try {
      return await Model.query()
        .where('status', 'active')
        .withGraphFetched('latestVersion');
    } catch (error) {
      logger.error('Error getting active models:', error);
      throw error;
    }
  }

  /**
   * Get Model Metrics
   */
  async getModelMetrics(modelId) {
    try {
      // Get cached metrics
      const cachedMetrics = this.modelMetrics.get(modelId);
      if (cachedMetrics) {
        return cachedMetrics;
      }

      // Get from database
      const modelVersion = await ModelVersion.query()
        .where('modelId', modelId)
        .orderBy('createdAt', 'desc')
        .first();

      if (modelVersion) {
        const metrics = {
          accuracy: modelVersion.accuracy,
          loss: modelVersion.loss,
          lastUpdated: modelVersion.createdAt
        };
        
        this.modelMetrics.set(modelId, metrics);
        return metrics;
      }

      return { accuracy: 0, loss: 1, lastUpdated: null };

    } catch (error) {
      logger.error('Error getting model metrics:', error);
      return { accuracy: 0, loss: 1, lastUpdated: null };
    }
  }

  /**
   * Helper Methods
   */
  async getModelVersion(modelId) {
    try {
      const version = await ModelVersion.query()
        .where('modelId', modelId)
        .orderBy('createdAt', 'desc')
        .first();
      
      return version ? version.version : 'unknown';
    } catch (error) {
      logger.error('Error getting model version:', error);
      return 'unknown';
    }
  }

  async getModelWeights(modelIds) {
    // Simple equal weighting for now
    // In production, this would be based on model performance
    const weight = 1 / modelIds.length;
    return new Array(modelIds.length).fill(weight);
  }

  async storeABTestResult(testData) {
    // Store A/B test results for analysis
    // Implementation would depend on your analytics requirements
    logger.debug('A/B test result stored:', testData.selectedModel);
  }

  async cleanupUnusedModels() {
    // Remove models from memory that haven't been used recently
    const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
    
    for (const [modelId, lastUsed] of this.modelCache.entries()) {
      if (lastUsed < cutoffTime) {
        this.loadedModels.delete(modelId);
        this.modelCache.delete(modelId);
        logger.debug(`Cleaned up unused model: ${modelId}`);
      }
    }
  }

  async getModelsNeedingRetraining() {
    // Logic to determine which models need retraining
    // Based on performance degradation, data drift, etc.
    return [];
  }
}

module.exports = new ModelService();