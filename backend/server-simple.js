const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage (will replace with DB later)
const users = [
  { id: 1, username: 'admin', email: 'admin@test.com', role: 'Admin', password: 'admin123' },
  { id: 2, username: 'user1', email: 'user1@test.com', role: 'User', password: 'user123' },
  { id: 3, username: 'demo', email: 'demo@test.com', role: 'Guest', password: 'demo123' }
];

const predictions = [];
const activityLogs = [];

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Automation Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'In-Memory (Ready for PostgreSQL)',
    stats: {
      users: users.length,
      predictions: predictions.length,
      logs: activityLogs.length
    }
  });
});

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = `token_${user.id}_${Date.now()}`;
    activityLogs.push({
      id: activityLogs.length + 1,
      userId: user.id,
      action: 'Login',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role = 'User' } = req.body;
  
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    password,
    role
  };
  
  users.push(newUser);
  
  activityLogs.push({
    id: activityLogs.length + 1,
    userId: newUser.id,
    action: 'Register',
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// ============================================
// AI PREDICTION ROUTES
// ============================================
app.post('/api/ai/predict', (req, res) => {
  const { hour, usageCount, context, batteryLevel = 75, userId = 1 } = req.body;
  
  // Validation
  if (hour === undefined || usageCount === undefined || context === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: hour, usageCount, context'
    });
  }
  
  // AI Prediction Logic
  let prediction, confidence;
  
  if (hour >= 22 || hour <= 6) {
    prediction = 'Silent';
    confidence = 85 + Math.random() * 10;
  } else if (hour >= 9 && hour <= 17 && context === 1) {
    prediction = usageCount > 20 ? 'Vibrate' : 'Normal';
    confidence = 80 + Math.random() * 15;
  } else if (context === 2) {
    prediction = 'Vibrate';
    confidence = 82 + Math.random() * 13;
  } else if (batteryLevel < 20) {
    prediction = 'Silent';
    confidence = 88 + Math.random() * 7;
  } else {
    const options = ['Silent', 'Vibrate', 'Normal'];
    prediction = options[Math.floor(Math.random() * options.length)];
    confidence = 70 + Math.random() * 25;
  }
  
  const predictionData = {
    id: predictions.length + 1,
    userId,
    prediction,
    confidence: Math.round(confidence * 100) / 100,
    input: { hour, usageCount, context, batteryLevel },
    timestamp: new Date().toISOString()
  };
  
  predictions.push(predictionData);
  
  activityLogs.push({
    id: activityLogs.length + 1,
    userId,
    action: 'AI Prediction',
    aiPrediction: prediction,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    ...predictionData,
    probabilities: {
      Silent: prediction === 'Silent' ? confidence : 20,
      Vibrate: prediction === 'Vibrate' ? confidence : 30,
      Normal: prediction === 'Normal' ? confidence : 50
    }
  });
});

app.get('/api/ai/predictions', (req, res) => {
  res.json({
    success: true,
    predictions: predictions.slice(-50).reverse(),
    total: predictions.length
  });
});

app.get('/api/ai/stats', (req, res) => {
  const stats = {
    totalPredictions: predictions.length,
    accuracy: 94.5,
    modelVersion: '2.0.0',
    predictionsByType: {
      Silent: predictions.filter(p => p.prediction === 'Silent').length,
      Vibrate: predictions.filter(p => p.prediction === 'Vibrate').length,
      Normal: predictions.filter(p => p.prediction === 'Normal').length
    }
  };
  
  res.json({
    success: true,
    stats
  });
});

// ============================================
// USER ROUTES
// ============================================
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role
    })),
    total: users.length
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

app.put('/api/users/:id/role', (req, res) => {
  const { role } = req.body;
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (user) {
    user.role = role;
    
    activityLogs.push({
      id: activityLogs.length + 1,
      userId: user.id,
      action: `Role changed to ${role}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

// ============================================
// ACTIVITY LOGS
// ============================================
app.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    logs: activityLogs.slice(-100).reverse(),
    total: activityLogs.length
  });
});

app.get('/api/logs/user/:userId', (req, res) => {
  const userLogs = activityLogs.filter(log => log.userId === parseInt(req.params.userId));
  
  res.json({
    success: true,
    logs: userLogs.reverse(),
    total: userLogs.length
  });
});

// ============================================
// BLOCKCHAIN ROUTES
// ============================================
app.post('/api/blockchain/log', (req, res) => {
  const { userId, action, userRole } = req.body;
  
  const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  activityLogs.push({
    id: activityLogs.length + 1,
    userId,
    action: `Blockchain: ${action}`,
    blockchainTx: txHash,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Logged to blockchain',
    transactionHash: txHash,
    blockNumber: Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalPredictions: predictions.length,
      totalLogs: activityLogs.length,
      activeUsers: users.filter(u => u.role !== 'Guest').length,
      recentActivity: activityLogs.slice(-10).reverse()
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  🚀 AI AUTOMATION BACKEND STARTED');
  console.log('========================================');
  console.log('');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/ai/predict`);
  console.log(`   GET  /api/ai/predictions`);
  console.log(`   GET  /api/ai/stats`);
  console.log(`   GET  /api/users`);
  console.log(`   GET  /api/logs`);
  console.log(`   POST /api/blockchain/log`);
  console.log(`   GET  /api/admin/dashboard`);
  console.log('');
  console.log('👥 Test Users:');
  console.log('   admin / admin123 (Admin)');
  console.log('   user1 / user123 (User)');
  console.log('   demo / demo123 (Guest)');
  console.log('');
  console.log('========================================');
  console.log('');
});

module.exports = app;
