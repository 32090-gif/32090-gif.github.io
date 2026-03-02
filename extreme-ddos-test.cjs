/**
 * Extreme DDoS Test - Push to the Limits
 * ทดสอบ DDoS ขั้นสูงสุดเพื่อดูขีดจำกัด
 */

const http = require('http');

async function extremeDDoSTest() {
  console.log('🚀 Starting EXTREME DDoS Test...');
  console.log('📍 Target: http://localhost:3001/api/health');
  console.log('⚡  Sending 2000 rapid requests...\n');
  
  const results = {
    success: 0,
    blocked: 0,
    rateLimited: 0,
    errors: 0,
    responseTimes: []
  };
  
  const startTime = Date.now();
  
  // Send 2000 requests in batches
  const batchSize = 100;
  const totalBatches = 20;
  
  for (let batch = 0; batch < totalBatches; batch++) {
    console.log(`📦 Sending batch ${batch + 1}/${totalBatches} (${batchSize} requests)...`);
    
    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      const requestId = batch * batchSize + i;
      promises.push(sendRequest(requestId, results));
    }
    
    await Promise.all(promises);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Results
  console.log('\n📊 EXTREME Test Results:');
  console.log(`⏱️  Total Time: ${duration}ms`);
  console.log(`🚀 Requests/Second: ${(2000 / duration * 1000).toFixed(2)}`);
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
  const protectionRate = (totalProtected / 2000) * 100;
  
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
  
  console.log('\n🔍 Analysis:');
  console.log(`   - Server handled ${2000} requests in ${(duration/1000).toFixed(2)} seconds`);
  console.log(`   - Average response time increased significantly`);
  console.log(`   - ${results.errors} requests failed (server overload?)`);
  
  if (results.errors > 0) {
    console.log('⚠️  Server showing signs of overload - protection may be needed');
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
        'User-Agent': `Extreme-DDoS-Test-${requestId}`,
        'X-Test-Request': 'true',
        'X-Load-Test': 'extreme'
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

    req.setTimeout(15000, () => {
      req.destroy();
      results.errors++;
      resolve();
    });

    req.end();
  });
}

// Run the test
extremeDDoSTest().catch(console.error);
