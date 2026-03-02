/**
 * Reset Emergency Mode Script
 * สคริปต์สำหรับรีเซ็ต emergency mode ของระบบความปลอดภัย
 */

const http = require('http');

async function resetEmergencyMode() {
  console.log('🔄 Attempting to reset emergency mode...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/security/emergency/exit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
      'X-Admin-Key': 'kunlun-admin-reset-2026'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Emergency mode reset successfully!');
        } else {
          console.log('❌ Failed to reset emergency mode');
        }
        
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error:', err.message);
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Alternative: Direct server restart approach
async function restartServer() {
  console.log('🔄 Restarting server to clear emergency mode...');
  
  const { exec } = require('child_process');
  
  return new Promise((resolve, reject) => {
    exec('taskkill /F /IM node.exe && cd server && node server.js', 
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error restarting server:', error);
          reject(error);
        } else {
          console.log('✅ Server restart initiated');
          console.log('📝 Output:', stdout);
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

// Main execution
async function main() {
  try {
    console.log('🚨 Emergency Mode Reset Tool');
    console.log('================================');
    
    // Try API reset first
    try {
      await resetEmergencyMode();
    } catch (err) {
      console.log('⚠️ API reset failed, trying server restart...');
      await restartServer();
    }
    
    // Test if server is working
    console.log('\n🧪 Testing server...');
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          console.log('✅ Server is working again!');
        } else {
          console.log('❌ Server still has issues');
        }
      } catch (err) {
        console.log('❌ Server test failed:', err.message);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { resetEmergencyMode, restartServer };
