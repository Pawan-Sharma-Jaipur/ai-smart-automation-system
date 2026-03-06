const axios = require('axios');

const API_URL = 'http://localhost:3000';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async run() {
    console.log('🧪 Running Automated Tests\n');
    console.log('='.repeat(50));
    
    await this.testHealthChecks();
    await this.testAIPredictions();
    await this.testUserService();
    await this.testErrorHandling();
    
    console.log('='.repeat(50));
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`);
  }

  async testHealthChecks() {
    console.log('\n📋 Health Check Tests');
    
    await this.test('Gateway health check', async () => {
      const res = await axios.get(`${API_URL}/health`);
      if (res.data.status !== 'healthy') throw new Error('Gateway not healthy');
    });

    await this.test('AI service health check', async () => {
      const res = await axios.get(`${API_URL}/api/ai/stats`);
      if (!res.data.success) throw new Error('AI service not responding');
    });
  }

  async testAIPredictions() {
    console.log('\n🤖 AI Prediction Tests');
    
    await this.test('Valid prediction request', async () => {
      const res = await axios.post(`${API_URL}/api/ai/predict`, {
        hour: 14,
        usageCount: 25,
        context: 'work'
      });
      if (!res.data.prediction) throw new Error('No prediction returned');
      if (!res.data.confidence) throw new Error('No confidence score');
    });

    await this.test('Prediction with battery level', async () => {
      const res = await axios.post(`${API_URL}/api/ai/predict`, {
        hour: 23,
        usageCount: 5,
        context: 'home',
        batteryLevel: 15
      });
      if (res.data.prediction !== 'Silent') throw new Error('Expected Silent mode for low battery');
    });

    await this.test('Night time prediction', async () => {
      const res = await axios.post(`${API_URL}/api/ai/predict`, {
        hour: 2,
        usageCount: 10,
        context: 'home'
      });
      if (res.data.prediction !== 'Silent') throw new Error('Expected Silent mode at night');
    });

    await this.test('Work hours prediction', async () => {
      const res = await axios.post(`${API_URL}/api/ai/predict`, {
        hour: 14,
        usageCount: 30,
        context: 'work'
      });
      if (!['Vibrate', 'Normal'].includes(res.data.prediction)) {
        throw new Error('Expected Vibrate or Normal during work hours');
      }
    });
  }

  async testUserService() {
    console.log('\n👤 User Service Tests');
    
    await this.test('Get users list', async () => {
      const res = await axios.get(`${API_URL}/api/users`);
      if (!res.data.users) throw new Error('No users returned');
    });
  }

  async testErrorHandling() {
    console.log('\n⚠️  Error Handling Tests');
    
    await this.test('Invalid prediction parameters', async () => {
      try {
        await axios.post(`${API_URL}/api/ai/predict`, {
          hour: 25,
          usageCount: 25,
          context: 'work'
        });
        throw new Error('Should have thrown validation error');
      } catch (error) {
        if (error.response?.status !== 400) throw error;
      }
    });

    await this.test('Missing required parameters', async () => {
      try {
        await axios.post(`${API_URL}/api/ai/predict`, {
          hour: 14
        });
        throw new Error('Should have thrown validation error');
      } catch (error) {
        if (error.response?.status !== 400) throw error;
      }
    });

    await this.test('404 for invalid route', async () => {
      try {
        await axios.get(`${API_URL}/api/invalid-route`);
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response?.status !== 404) throw error;
      }
    });
  }
}

const runner = new TestRunner();
runner.run();
