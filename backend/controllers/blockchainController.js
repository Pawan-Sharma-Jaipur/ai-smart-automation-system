const { Web3 } = require('web3');
const { pool } = require('../config/database');
require('dotenv').config();

const web3 = new Web3(process.env.BLOCKCHAIN_URL);

const contractABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_userRole", "type": "string"},
      {"internalType": "string", "name": "_action", "type": "string"}
    ],
    "name": "logAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "logs",
    "outputs": [
      {"internalType": "string", "name": "userRole", "type": "string"},
      {"internalType": "string", "name": "action", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLogCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const logToBlockchain = async (req, res) => {
  try {
    const { action } = req.body;
    const userRole = req.user.role;

    if (!process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_AFTER_DEPLOYMENT') {
      return res.status(400).json({ error: 'Blockchain contract not deployed. Deploy contract first.' });
    }

    const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
    const accounts = await web3.eth.getAccounts();

    const receipt = await contract.methods.logAction(userRole, action).send({
      from: accounts[0],
      gas: 3000000
    });

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, blockchain_tx) VALUES (?, ?, ?)',
      [req.user.id, action, receipt.transactionHash]
    );

    res.json({
      message: 'Action logged to blockchain',
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error('Blockchain logging error:', error);
    res.status(500).json({ error: 'Blockchain logging failed' });
  }
};

const getBlockchainLogs = async (req, res) => {
  try {
    if (!process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_AFTER_DEPLOYMENT') {
      return res.status(400).json({ error: 'Blockchain contract not deployed' });
    }

    const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
    const logCount = await contract.methods.getLogCount().call();

    const logs = [];
    for (let i = 0; i < logCount; i++) {
      const log = await contract.methods.logs(i).call();
      logs.push({
        userRole: log.userRole,
        action: log.action,
        timestamp: new Date(Number(log.timestamp) * 1000).toISOString()
      });
    }

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blockchain logs' });
  }
};

module.exports = { logToBlockchain, getBlockchainLogs };
