const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testRBAC() {
  console.log('🧪 Testing RBAC Permissions\n');
  
  const tests = [
    {
      name: 'AI Prediction (should work for all)',
      method: 'POST',
      url: '/api/ai/predict',
      data: { hour: 14, usageCount: 25, context: 'work' }
    },
    {
      name: 'Health Check (public)',
      method: 'GET',
      url: '/health'
    },
    {
      name: 'AI Stats',
      method: 'GET',
      url: '/api/ai/stats'
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${API_URL}${test.url}`,
        data: test.data
      });
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

testRBAC();
