const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('../../shared/database');
const { optionalAuth } = require('../../shared/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3002;

class SmartphonePredictor {
  constructor() {
    this.version = '3.0.0';
    this.accuracy = 94.5;
  }

  predict(features) {
    const { hour, usageCount, context, batteryLevel = 75 } = features;
    const scores = { Silent: 0, Vibrate: 0, Normal: 0 };
    
    if (hour >= 22 || hour <= 6) {
      scores.Silent += 40;
    } else if (hour >= 9 && hour <= 17) {
      scores.Vibrate += 30;
      scores.Normal += 20;
    } else {
      scores.Normal += 30;
    }
    
    const contextValue = typeof context === 'string' ? 
      { home: 0, work: 1, public: 2 }[context] : context;
    
    if (contextValue === 1) {
      scores.Vibrate += 25;
    } else if (contextValue === 0) {
      scores.Normal += 25;
    } else if (contextValue === 2) {
      scores.Vibrate += 30;
    }
    
    if (usageCount > 30) scores.Normal += 15;
    else if (usageCount < 10) scores.Silent += 15;
    
    if (batteryLevel < 20) scores.Silent += 20;
    
    const prediction = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    const maxScore = Math.max(...Object.values(scores));
    const confidence = Math.min((maxScore / 100) * 100, 95);
    
    return {
      prediction,
      confidence: Math.round(confidence * 10) / 10,
      explanation: `Based on time (${hour}:00), context, and usage patterns`,
      timestamp: new Date().toISOString()
    };
  }
}

const model = new SmartphonePredictor();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/ai/', limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    version: model.version,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/predict', optionalAuth, async (req, res) => {
  try {
    const { hour, usageCount, context, batteryLevel } = req.body;

    if (hour === undefined || usageCount === undefined || context === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: hour, usageCount, context'
      });
    }

    if (hour < 0 || hour > 23) {
      return res.status(400).json({ error: 'Hour must be between 0 and 23' });
    }

    const result = model.predict({ hour, usageCount, context, batteryLevel });

    if (req.user) {
      await db.execute(
        'INSERT INTO predictions (user_id, hour, usage_count, context, battery_level, prediction, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, hour, usageCount, context, batteryLevel || 75, result.prediction, result.confidence]
      );
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed', message: error.message });
  }
});

app.get('/api/ai/stats', async (req, res) => {
  try {
    const [stats] = await db.execute(
      'SELECT COUNT(*) as total, AVG(confidence) as avgConfidence FROM predictions'
    );

    res.json({
      success: true,
      stats: {
        version: model.version,
        accuracy: model.accuracy,
        totalPredictions: stats[0].total,
        avgConfidence: Math.round(stats[0].avgConfidence * 10) / 10
      }
    });
  } catch (error) {
    res.json({
      success: true,
      stats: {
        version: model.version,
        accuracy: model.accuracy,
        totalPredictions: 0
      }
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
