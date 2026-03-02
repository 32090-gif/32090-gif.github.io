/**
 * DDoS Protection Testing Script
 * สคริปต์ทดสอบระบบป้องกัน DDoS
 */

const http = require('http');
const https = require('https');

// Configuration
const TARGET_URL = 'http://localhost:3001';
const TEST_ENDPOINTS = [
  '/api/health',
  '/api/announcements', 
  '/api/products',
  '/api/topups/stats'
];

// Test scenarios
const TEST_SCENARIOS = {
  // 1. Normal traffic test
  normal: {
    requests: 10,
    interval: 1000, // 1 second between requests
    concurrent: 1
  },
  
  // 2. Moderate load test
  moderate: {
    requests: 50,
    interval: 200, // 200ms between requests
    concurrent: 5
  },
  
  // 3. High load test (DDoS simulation)
  high: {
    requests: 200,
    interval: 50, // 50ms between requests
    concurrent: 20
  },
  
  // 4. Burst test (sudden spike)
  burst: {
    requests: 100,
    interval: 10, // 10ms between requests
    concurrent: 50
  }
};

class DDoSTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      startTime: null,
      endTime: null,
      responses: []
    };
  }

  async runTest(scenarioName, endpoint) {
    console.log(`\n🧪 Starting ${scenarioName.toUpperCase()} test on ${endpoint}`);
    console.log(`📊 Configuration:`, TEST_SCENARIOS[scenarioName]);
    
    const scenario = TEST_SCENARIOS[scenarioName];
    this.results.startTime = Date.now();
    this.results.totalRequests = scenario.requests;
    
    const promises = [];
    
    // Create concurrent requests
    for (let i = 0; i < scenario.concurrent; i++) {
      promises.push(this.sendRequests(i, scenario, endpoint));
    }
    
    // Wait for all requests to complete
    await Promise.all(promises);
    
    this.results.endTime = Date.now();
    this.printResults(scenarioName, endpoint);
    
    return this.results;
  }

  async sendRequests(workerId, scenario, endpoint) {
    const requestsPerWorker = Math.ceil(scenario.requests / scenario.concurrent);
    
    for (let i = 0; i < requestsPerWorker; i++) {
      const requestNumber = workerId * requestsPerWorker + i;
      
      if (requestNumber >= scenario.requests) break;
      
      await this.sendRequest(endpoint, requestNumber);
      
      // Wait between requests
      if (i < requestsPerWorker - 1) {
        await this.sleep(scenario.interval);
      }
    }
  }

  async sendRequest(endpoint, requestNumber) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: endpoint,
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:8081',
          'User-Agent': `DDoS-Test-Bot-${requestNumber}`,
          'X-Request-ID': `test-${requestNumber}`
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          const result = {
            requestNumber,
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers,
            success: res.statusCode >= 200 && res.statusCode < 400,
            blocked: res.statusCode === 429 || res.statusCode === 403,
            rateLimited: res.statusCode === 429,
            timestamp: startTime
          };
          
          this.processResult(result);
          resolve(result);
        });
      });

      req.on('error', (err) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const result = {
          requestNumber,
          statusCode: 0,
          responseTime,
          error: err.message,
          success: false,
          blocked: false,
          rateLimited: false,
          timestamp: startTime
        };
        
        this.processResult(result);
        resolve(result);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        const result = {
          requestNumber,
          statusCode: 0,
          responseTime: 10000,
          error: 'Timeout',
          success: false,
          blocked: false,
          rateLimited: false,
          timestamp: startTime
        };
        
        this.processResult(result);
        resolve(result);
      });

      req.end();
    });
  }

  processResult(result) {
    this.results.responses.push(result);
    
    if (result.success) {
      this.results.successfulRequests++;
    } else if (result.blocked) {
      this.results.blockedRequests++;
    } else if (result.rateLimited) {
      this.results.rateLimitedRequests++;
    } else {
      this.results.errorRequests++;
    }
  }

  printResults(scenarioName, endpoint) {
    const duration = this.results.endTime - this.results.startTime;
    const requestsPerSecond = (this.results.totalRequests / duration) * 1000;
    
    // Calculate average response time for successful requests only
    const successfulResponses = this.results.responses.filter(r => r.success);
    const avgResponseTime = successfulResponses.length > 0 
      ? successfulResponses.reduce((sum, r) => sum + r.responseTime, 0) / successfulResponses.length 
      : 0;

    console.log(`\n📈 ${scenarioName.toUpperCase()} Test Results for ${endpoint}:`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🚀 Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`✅ Successful: ${this.results.successfulRequests}/${this.results.totalRequests} (${((this.results.successfulRequests/this.results.totalRequests)*100).toFixed(1)}%)`);
    console.log(`🚫 Blocked: ${this.results.blockedRequests}/${this.results.totalRequests} (${((this.results.blockedRequests/this.results.totalRequests)*100).toFixed(1)}%)`);
    console.log(`⏱️  Rate Limited: ${this.results.rateLimitedRequests}/${this.results.totalRequests} (${((this.results.rateLimitedRequests/this.results.totalRequests)*100).toFixed(1)}%)`);
    console.log(`❌ Errors: ${this.results.errorRequests}/${this.results.totalRequests} (${((this.results.errorRequests/this.results.totalRequests)*100).toFixed(1)}%)`);
    console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Analyze protection effectiveness
    const protectionScore = this.calculateProtectionScore();
    console.log(`🛡️  Protection Score: ${protectionScore}/100`);
    
    if (protectionScore >= 80) {
      console.log(`✅ EXCELLENT - DDoS protection is working very well!`);
    } else if (protectionScore >= 60) {
      console.log(`⚠️  GOOD - DDoS protection is working but could be improved`);
    } else if (protectionScore >= 40) {
      console.log(`❌ POOR - DDoS protection needs significant improvement`);
    } else {
      console.log(`🚨 CRITICAL - DDoS protection is not working properly`);
    }
    
    // Show response time distribution
    this.showResponseTimeDistribution();
    
    // Show blocked request details
    if (this.results.blockedRequests > 0 || this.results.rateLimitedRequests > 0) {
      this.showBlockedRequestDetails();
    }
  }

  calculateProtectionScore() {
    let score = 0;
    
    // Base score for having any protection
    if (this.results.blockedRequests > 0 || this.results.rateLimitedRequests > 0) {
      score += 30;
    }
    
    // Score for blocking rate (higher is better for DDoS protection)
    const blockRate = (this.results.blockedRequests + this.results.rateLimitedRequests) / this.results.totalRequests;
    if (blockRate > 0.8) score += 30;
    else if (blockRate > 0.6) score += 25;
    else if (blockRate > 0.4) score += 20;
    else if (blockRate > 0.2) score += 15;
    else if (blockRate > 0.1) score += 10;
    else score += 5;
    
    // Score for maintaining service availability
    const successRate = this.results.successfulRequests / this.results.totalRequests;
    if (successRate > 0.8) score += 20;
    else if (successRate > 0.6) score += 15;
    else if (successRate > 0.4) score += 10;
    else if (successRate > 0.2) score += 5;
    
    // Score for response time stability
    const successfulResponses = this.results.responses.filter(r => r.success);
    if (successfulResponses.length > 0) {
      const avgTime = successfulResponses.reduce((sum, r) => sum + r.responseTime, 0) / successfulResponses.length;
      if (avgTime < 100) score += 20;
      else if (avgTime < 500) score += 15;
      else if (avgTime < 1000) score += 10;
      else if (avgTime < 2000) score += 5;
    }
    
    return Math.min(score, 100);
  }

  showResponseTimeDistribution() {
    const successfulResponses = this.results.responses.filter(r => r.success);
    if (successfulResponses.length === 0) return;
    
    const times = successfulResponses.map(r => r.responseTime).sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    
    console.log(`\n⏱️  Response Time Distribution:`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Median: ${median}ms`);
    console.log(`   95th percentile: ${p95}ms`);
    console.log(`   Max: ${max}ms`);
  }

  showBlockedRequestDetails() {
    const blockedResponses = this.results.responses.filter(r => r.blocked || r.rateLimited);
    
    console.log(`\n🚫 Blocked Request Details:`);
    
    // Group by status code
    const statusGroups = {};
    blockedResponses.forEach(r => {
      const status = r.statusCode;
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(r);
    });
    
    Object.entries(statusGroups).forEach(([status, requests]) => {
      const statusText = status === 429 ? 'Rate Limited' : 
                        status === 403 ? 'Forbidden' : 
                        status === 503 ? 'Service Unavailable' : 'Other';
      
      console.log(`   ${status} (${statusText}): ${requests.length} requests`);
      
      // Show sample headers for first blocked request
      if (requests.length > 0) {
        const sample = requests[0];
        console.log(`     Sample headers:`, sample.headers);
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      startTime: null,
      endTime: null,
      responses: []
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting DDoS Protection Tests');
  console.log('=====================================');
  
  const tester = new DDoSTester();
  
  // Test each scenario on each endpoint
  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\n🎯 Testing endpoint: ${endpoint}`);
    
    for (const [scenarioName] of Object.entries(TEST_SCENARIOS)) {
      tester.reset();
      await tester.runTest(scenarioName, endpoint);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('💡 Tips:');
  console.log('   - High protection scores (80+) indicate good DDoS protection');
  console.log('   - Rate limiting (429) shows the system is working');
  console.log('   - Some blocked requests during high load is normal');
  console.log('   - Monitor server logs for detailed security events');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { DDoSTester, runAllTests };
