const fs = require('fs');
const crypto = require('crypto');

// Read users.json
const usersData = JSON.parse(fs.readFileSync('server/users.json', 'utf8'));

// Function to generate universal key
function generateUniversalKey(userId) {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(4).toString('hex');
  return `KD_${userId}_UNIVERSAL_${timestamp}_${randomHash}`;
}

// Process each user
usersData.users.forEach(user => {
  // Remove old dashboardKeys
  delete user.dashboardKeys;
  
  // Add universal key
  user.universalKey = generateUniversalKey(user.id);
  user.universalKeyCreatedAt = new Date().toISOString();
  
  console.log(`Generated universal key for ${user.username}: ${user.universalKey}`);
});

// Write back to file
fs.writeFileSync('server/users.json', JSON.stringify(usersData, null, 2));
console.log('✅ Updated users.json with universal keys');
