/**
 * Simple DDoS Test - Quick Test Script
 * ทดสอบ DDoS แบบง่ายๆ เห็นผลลัพธ์ทันที
 */

const http = require('http');

async function simpleDDoSTest() {
  console.log('🚀 Starting Simple DDoS Test...');
  console.log('📍 Target: http://localhost:3001/api/health');
  console.log('⚡  Sending 50 rapid requests...\n');
  
  const results = {
    success: 0,
    blocked: 0,
    rateLimited: 0,
    errors: 0,
    responseTimes: []
  };
  
  const startTime = Date.now();
  
  // Send 50 requests rapidly
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(sendRequest(i, results));
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Results
  console.log('📊 Test Results:');
  console.log(`⏱️  Total Time: ${duration}ms`);
  console.log(`🚀 Requests/Second: ${(50 / duration * 1000).toFixed(2)}`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`🚫 Blocked (403): ${results.blocked}`);
  console.log(`⏱️  Rate Limited (429): ${results.rateLimited}`);
  console.log(`❌ Errors: ${results.errors}`);
  
  if (results.responseTimes.length > 0) {
    const avgTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    console.log(`⚡ Avg Response Time: ${avgTime.toFixed(2)}ms`);
  }
  
  // Protection analysis
  const totalProtected = results.blocked + results.rateLimited;
  const protectionRate = (totalProtected / 50) * 100;
  
  console.log(`\n🛡️  Protection Analysis:`);
  console.log(`📈 Protection Rate: ${protectionRate.toFixed(1)}%`);
  
  if (protectionRate > 50) {
    console.log('✅ EXCELLENT - DDoS protection is working well!');
  } else if (protectionRate > 20) {
    console.log('⚠️  GOOD - DDoS protection is active');
  } else if (protectionRate > 0) {
    console.log('❌ POOR - Limited protection detected');
  } else {
    console.log('🚨 NO PROTECTION - All requests passed through!');
  }
  
  return results;
}

function sendRequest(requestId, results) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:8081',
        'User-Agent': `DDoS-Test-${requestId}`,
        'X-Test-Request': 'true'
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
        
        if (res.statusCode === 200) {
          results.success++;
          results.responseTimes.push(responseTime);
        } else if (res.statusCode === 403) {
          results.blocked++;
        } else if (res.statusCode === 429) {
          results.rateLimited++;
        } else {
          results.errors++;
        }
        
        resolve();
      });
    });

    req.on('error', () => {
      results.errors++;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      results.errors++;
      resolve();
    });

    req.end();
  });
}

// Run the test
simpleDDoSTest().catch(console.error);
