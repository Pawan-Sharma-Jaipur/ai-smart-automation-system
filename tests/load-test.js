const axios = require('axios');

const API_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 10;

class LoadTester {
  constructor() {
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      responseTimes: []
    };
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const start = Date.now();
    try {
      const config = {
        method,
        url: `${API_URL}${endpoint}`,
        data,
        timeout: 10000
      };
      
      await axios(config);
      const duration = Date.now() - start;
      
      this.results.success++;
      this.results.responseTimes.push(duration);
      this.results.totalTime += duration;
      this.results.minTime = Math.min(this.results.minTime, duration);
      this.results.maxTime = Math.max(this.results.maxTime, duration);
      
      return { success: true, duration };
    } catch (error) {
      this.results.failed++;
      return { success: false, error: error.message };
    } finally {
      this.results.total++;
    }
  }

  async runTest() {
    console.log('🚀 Starting Load Test\n');
    console.log(`Configuration:`);
    console.log(`  Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`  Requests per User: ${REQUESTS_PER_USER}`);
    console.log(`  Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);
    console.log('='.repeat(60));

    const startTime = Date.now();

    // Test scenarios
    const scenarios = [
      { name: 'Health Check', endpoint: '/health', method: 'GET' },
      { 
        name: 'AI Prediction', 
        endpoint: '/api/ai/predict', 
        method: 'POST',
        data: { hour: 14, usageCount: 25, context: 'work' }
      },
      { name: 'AI Stats', endpoint: '/api/ai/stats', method: 'GET' }
    ];

    // Run concurrent requests
    const promises = [];
    for (let user = 0; user < CONCURRENT_USERS; user++) {
      for (let req = 0; req < REQUESTS_PER_USER; req++) {
        const scenario = scenarios[req % scenarios.length];
        promises.push(this.makeRequest(scenario.endpoint, scenario.method, scenario.data));
      }
    }

    await Promise.all(promises);

    const totalDuration = Date.now() - startTime;

    // Calculate statistics
    const avgTime = this.results.totalTime / this.results.success;
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    // Print results
    console.log('\n📊 Load Test Results\n');
    console.log('='.repeat(60));
    console.log(`\nTotal Requests:     ${this.results.total}`);
    console.log(`Successful:         ${this.results.success} (${((this.results.success / this.results.total) * 100).toFixed(2)}%)`);
    console.log(`Failed:             ${this.results.failed} (${((this.results.failed / this.results.total) * 100).toFixed(2)}%)`);
    console.log(`\nTotal Duration:     ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Requests/sec:       ${(this.results.total / (totalDuration / 1000)).toFixed(2)}`);
    console.log(`\nResponse Times:`);
    console.log(`  Average:          ${avgTime.toFixed(2)}ms`);
    console.log(`  Minimum:          ${this.results.minTime}ms`);
    console.log(`  Maximum:          ${this.results.maxTime}ms`);
    console.log(`  Median (p50):     ${p50}ms`);
    console.log(`  95th percentile:  ${p95}ms`);
    console.log(`  99th percentile:  ${p99}ms`);
    console.log('\n' + '='.repeat(60));

    // Performance assessment
    console.log('\n🎯 Performance Assessment:\n');
    if (avgTime < 100) {
      console.log('✅ EXCELLENT - Average response time < 100ms');
    } else if (avgTime < 200) {
      console.log('✅ GOOD - Average response time < 200ms');
    } else if (avgTime < 500) {
      console.log('⚠️  ACCEPTABLE - Average response time < 500ms');
    } else {
      console.log('❌ POOR - Average response time > 500ms');
    }

    if (this.results.success / this.results.total > 0.99) {
      console.log('✅ EXCELLENT - Success rate > 99%');
    } else if (this.results.success / this.results.total > 0.95) {
      console.log('✅ GOOD - Success rate > 95%');
    } else {
      console.log('❌ POOR - Success rate < 95%');
    }

    const rps = this.results.total / (totalDuration / 1000);
    if (rps > 1000) {
      console.log('✅ EXCELLENT - Throughput > 1000 req/s');
    } else if (rps > 500) {
      console.log('✅ GOOD - Throughput > 500 req/s');
    } else if (rps > 100) {
      console.log('⚠️  ACCEPTABLE - Throughput > 100 req/s');
    } else {
      console.log('❌ POOR - Throughput < 100 req/s');
    }

    console.log('\n');
  }
}

// Run test
const tester = new LoadTester();
tester.runTest().catch(console.error);
