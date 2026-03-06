const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const db = require('../../shared/database');
const { optionalAuth } = require('../../shared/authMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'blockchain-service', timestamp: new Date().toISOString() });
});

app.post('/log', optionalAuth, async (req, res) => {
  try {
    const { userRole, action, userId, details } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Get last block hash
    const [lastBlock] = await db.execute(
      'SELECT block_hash FROM blockchain_logs ORDER BY block_number DESC LIMIT 1'
    );
    const previousHash = lastBlock.length > 0 ? lastBlock[0].block_hash : '0';

    // Get next block number
    const [count] = await db.execute('SELECT COUNT(*) as total FROM blockchain_logs');
    const blockNumber = count[0].total;

    // Create new block
    const block = new Block(
      blockNumber,
      Date.now(),
      { userRole, action, userId, details },
      previousHash
    );

    // Store in database
    await db.execute(
      'INSERT INTO blockchain_logs (block_number, block_hash, previous_hash, user_id, user_role, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))',
      [block.index, block.hash, block.previousHash, userId || null, userRole || 'unknown', action, details || null, block.timestamp / 1000]
    );

    res.json({ 
      success: true,
      message: 'Action logged to blockchain',
      transactionHash: block.hash,
      blockNumber: block.index
    });
  } catch (error) {
    console.error('Blockchain log error:', error);
    res.status(500).json({ error: 'Failed to log action', message: error.message });
  }
});

app.get('/logs', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const [logs] = await db.execute(
      'SELECT * FROM blockchain_logs ORDER BY block_number DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [count] = await db.execute('SELECT COUNT(*) as total FROM blockchain_logs');
    
    res.json({ 
      success: true,
      logs, 
      total: count[0].total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
  }
});

app.get('/verify/:hash', optionalAuth, async (req, res) => {
  try {
    const [blocks] = await db.execute(
      'SELECT * FROM blockchain_logs WHERE block_hash = ?',
      [req.params.hash]
    );
    
    if (blocks.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const block = blocks[0];
    
    // Verify hash integrity
    const calculatedHash = crypto.createHash('sha256')
      .update(block.block_number + block.previous_hash + new Date(block.timestamp).getTime() + JSON.stringify({
        userRole: block.user_role,
        action: block.action,
        userId: block.user_id,
        details: block.details
      }))
      .digest('hex');

    const verified = calculatedHash === block.block_hash;
    
    res.json({ 
      success: true,
      verified, 
      block,
      message: verified ? 'Block integrity verified' : 'Block integrity compromised'
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', message: error.message });
  }
});

app.get('/stats', optionalAuth, async (req, res) => {
  try {
    const [count] = await db.execute('SELECT COUNT(*) as total FROM blockchain_logs');
    const [actions] = await db.execute(
      'SELECT action, COUNT(*) as count FROM blockchain_logs GROUP BY action ORDER BY count DESC LIMIT 10'
    );
    const [recent] = await db.execute(
      'SELECT * FROM blockchain_logs ORDER BY block_number DESC LIMIT 5'
    );
    
    res.json({
      success: true,
      stats: {
        totalBlocks: count[0].total,
        topActions: actions,
        recentLogs: recent
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`⛓️  Blockchain Service running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});
