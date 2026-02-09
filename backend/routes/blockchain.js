const express = require('express');
const { logToBlockchain, getBlockchainLogs } = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/log', authMiddleware, logToBlockchain);
router.get('/logs', authMiddleware, getBlockchainLogs);

module.exports = router;
