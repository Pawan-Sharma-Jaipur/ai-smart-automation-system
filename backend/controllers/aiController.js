const { exec } = require('child_process');
const path = require('path');
const { pool } = require('../config/database');

const predictAutomation = async (req, res) => {
  try {
    const { hour, usageCount, context } = req.body;
    const userId = req.user.id;

    const pythonScript = path.join(__dirname, '../../ai-engine/predict.py');
    const command = `python "${pythonScript}" ${hour} ${usageCount} ${context}`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Python execution error:', error);
        return res.status(500).json({ error: 'AI prediction failed' });
      }

      try {
        const prediction = JSON.parse(stdout.trim());

        await pool.query(
          'INSERT INTO activity_logs (user_id, action, ai_prediction) VALUES (?, ?, ?)',
          [userId, 'AI_PREDICTION', prediction.action]
        );

        res.json({
          prediction: prediction.action,
          confidence: prediction.confidence,
          explanation: prediction.explanation
        });
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse AI output' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Automation prediction failed' });
  }
};

module.exports = { predictAutomation };
