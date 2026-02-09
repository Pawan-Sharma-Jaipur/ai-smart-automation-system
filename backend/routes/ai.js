const express = require('express');
const { predictAutomation } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/predict', authMiddleware, predictAutomation);

module.exports = router;
