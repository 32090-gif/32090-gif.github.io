const fs = require('fs');
const path = require('path');

const DATABASE_FILE = path.join(__dirname, 'database.json');

// Database helper functions
function readDatabase() {
  try {
    if (!fs.existsSync(DATABASE_FILE)) {
      return { dashboardData: {} };
    }
    const data = fs.readFileSync(DATABASE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { dashboardData: {} };
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

function updateDashboardData(userId, gameName, playerData) {
  const db = readDatabase();
  
  // Initialize user data if not exists
  if (!db.dashboardData[userId]) {
    db.dashboardData[userId] = {};
  }
  
  // Initialize game data if not exists
  if (!db.dashboardData[userId][gameName]) {
    db.dashboardData[userId][gameName] = {
      players: {},
      stats: {
        totalMoney: 0,
        totalPlayers: 0,
        avgLevel: 0,
        lastUpdate: null
      }
    };
  }
  
  // Update player data
  const gameData = db.dashboardData[userId][gameName];
  Object.keys(playerData).forEach(username => {
    gameData.players[username] = {
      ...playerData[username],
      updated_at: new Date().toISOString()
    };
  });
  
  // Update stats
  const players = Object.values(gameData.players);
  gameData.stats = {
    totalMoney: players.reduce((sum, p) => sum + (p.money || 0), 0),
    totalPlayers: players.length,
    avgLevel: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (parseInt(p.level) || 0), 0) / players.length) : 0,
    lastUpdate: new Date().toISOString()
  };
  
  return writeDatabase(db);
}

function getDashboardData(userId, gameName) {
  const db = readDatabase();
  
  if (!db.dashboardData[userId]) {
    return null;
  }
  
  if (gameName) {
    return db.dashboardData[userId][gameName] || null;
  }
  
  return db.dashboardData[userId];
}

function getAllDashboardData() {
  const db = readDatabase();
  return db.dashboardData;
}

function deleteAccount(userId, gameName, accountName) {
  const db = readDatabase();
  
  // Check if user and game exist
  if (!db.dashboardData[userId] || !db.dashboardData[userId][gameName]) {
    return false;
  }
  
  const gameData = db.dashboardData[userId][gameName];
  
  // Check if account exists
  if (!gameData.players[accountName]) {
    return false;
  }
  
  // Delete the account
  delete gameData.players[accountName];
  
  // Update stats
  const players = Object.values(gameData.players);
  gameData.stats = {
    totalMoney: players.reduce((sum, p) => sum + (p.money || 0), 0),
    totalPlayers: players.length,
    avgLevel: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (parseInt(p.level) || 0), 0) / players.length) : 0,
    lastUpdate: new Date().toISOString()
  };
  
  // If no players left, we can optionally delete the entire game entry
  if (players.length === 0) {
    delete db.dashboardData[userId][gameName];
  }
  
  return writeDatabase(db);
}

module.exports = {
  readDatabase,
  writeDatabase,
  updateDashboardData,
  getDashboardData,
  getAllDashboardData,
  deleteAccount
};
