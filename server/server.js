const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const dbManager = require('./database-manager');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kunlun-secret-key-2026';

// ระบบป้องกัน API
const API_SECURITY = {
  // API Key protection
  apiKeys: new Set(['kunlun-api-key-2026', 'slumzick-secure-key']),
  
  // Request tracking
  requestCounts: new Map(),
  lastRequestTime: new Map()
};

// API Key validation middleware
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const userAgent = req.headers['user-agent'] || '';
  
  // อนุญาต origins ที่เป็น frontend ของเราโดยไม่ต้องมี API key
  const allowedOrigins = [
    'http://localhost:8082', 
    'http://localhost:8081', 
    'http://localhost:8080', 
    'http://localhost:3000',
    'https://getkunlun.me',
    'https://www.getkunlun.me'
  ];
  
  // ตรวจสอบว่ามาจาก frontend ของเราหรือไม่
  const isFromFrontend = allowedOrigins.includes(origin) || 
                       (referer && allowedOrigins.some(origin => referer.includes(origin))) ||
                       (origin === null && referer && allowedOrigins.some(origin => referer.includes(origin)));
  
  // ถ้ามาจาก frontend ของเรา ให้ผ่านได้เลย
  if (isFromFrontend) {
    return next();
  }
  
  // ถ้าไม่ใช่ frontend ของเรา ต้องมี API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: '5555555555555555555555555555555 หวังใช้ API ฟรีหรอ? จ่ายตังค์ก่อนนะ!',
      suspicious: true
    });
  }
  
  // Validate API key
  if (!API_SECURITY.apiKeys.has(apiKey)) {
    return res.status(401).json({
      success: false,
      message: '5555555555555555555555555555555 API key ผิด หวังใช้ฟรีหรอ?',
      invalidKey: true
    });
  }
  
  next();
};

// Request logging and monitoring
const requestMonitor = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const now = Date.now();
  
  // Track request patterns
  const requestCount = API_SECURITY.requestCounts.get(clientIP) || 0;
  API_SECURITY.requestCounts.set(clientIP, requestCount + 1);
  API_SECURITY.lastRequestTime.set(clientIP, now);
  
  // Log suspicious activity
  if (requestCount > 50) { // More than 50 requests total
    console.log(`🚨 Suspicious activity detected from ${clientIP}: ${requestCount} requests`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Endpoint: ${req.method} ${req.url}`);
  }
  
  next();
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Use unique naming for initial upload, will be renamed in route handler
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8082', 
    'http://localhost:8081', 
    'http://localhost:8080', 
    'http://localhost:3000',
    'https://getkunlun.me',
    'https://www.getkunlun.me'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Handle preflight requests
app.options('*', cors());

// Apply security middleware
app.use(requestMonitor);
// ไม่ใส่ validateAPIKey ตรงนี้ เพื่อให้ frontend ทำงานได้

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file paths
const DATA_FILE = path.join(__dirname, 'users.json');
const VOUCHER_FILE = path.join(__dirname, 'voucher.json');
const TOPUP_FILE = path.join(__dirname, 'topups.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const STOCK_DIR = path.join(__dirname, 'stock');
const ANNOUNCEMENTS_FILE = path.join(__dirname, 'announcements.json');
const PAGES_FILE = path.join(__dirname, 'pages.json');

// Helper functions
const readUsersFromFile = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
};

const writeUsersToFile = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// Orders helper functions
const readOrdersFromFile = () => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { orders: [] };
  } catch (error) {
    console.error('Error reading orders file:', error);
    return { orders: [] };
  }
};

const writeOrdersToFile = (data) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing orders file:', error);
    return false;
  }
};

const addOrder = (orderData) => {
  try {
    const data = readOrdersFromFile();
    const newOrder = {
      id: uuidv4(),
      orderId: `ORD-${Date.now()}`,
      ...orderData,
      purchaseDate: new Date().toISOString(),
      status: 'completed'
    };
    
    data.orders.push(newOrder);
    writeOrdersToFile(data);
    return newOrder;
  } catch (error) {
    console.error('Error adding order:', error);
    return null;
  }
};

const getUserOrders = (userId) => {
  try {
    const data = readOrdersFromFile();
    return data.orders.filter(order => order.userId === userId).sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
};

// User points helper functions
const getUserPoints = (userId) => {
  try {
    const data = readUsersFromFile();
    const user = data.users.find(u => u.id === userId);
    return user ? (user.points || 0) : 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
};

const updateUserPoints = (userId, points) => {
  try {
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      data.users[userIndex].points = (data.users[userIndex].points || 0) + points;
      writeUsersToFile(data);
      return data.users[userIndex].points;
    }
    return 0;
  } catch (error) {
    console.error('Error updating user points:', error);
    return 0;
  }
};

const deductUserPoints = (userId, points) => {
  try {
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      const currentPoints = data.users[userIndex].points || 0;
      if (currentPoints >= points) {
        data.users[userIndex].points = currentPoints - points;
        writeUsersToFile(data);
        return data.users[userIndex].points;
      }
    }
    return -1; // Insufficient points
  } catch (error) {
    console.error('Error deducting user points:', error);
    return -1;
  }
};

// Voucher helper functions
const readVouchersFromFile = () => {
  try {
    if (fs.existsSync(VOUCHER_FILE)) {
      const data = fs.readFileSync(VOUCHER_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { vouchers: [] };
  } catch (error) {
    console.error('Error reading vouchers file:', error);
    return { vouchers: [] };
  }
};

const writeVouchersToFile = (data) => {
  try {
    fs.writeFileSync(VOUCHER_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing vouchers file:', error);
    return false;
  }
};

// Topup helper functions
const readTopupsFromFile = () => {
  try {
    if (fs.existsSync(TOPUP_FILE)) {
      const data = fs.readFileSync(TOPUP_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { topups: [], totalTopupAmount: 0, totalUsers: 0 };
  } catch (error) {
    console.error('Error reading topups file:', error);
    return { topups: [], totalTopupAmount: 0, totalUsers: 0 };
  }
};

const writeTopupsToFile = (data) => {
  try {
    fs.writeFileSync(TOPUP_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing topups file:', error);
    return false;
  }
};

// Stock helper functions
const getAllStockItems = () => {
  try {
    if (!fs.existsSync(STOCK_DIR)) {
      fs.mkdirSync(STOCK_DIR, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(STOCK_DIR).filter(file => file.endsWith('.json'));
    const items = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(STOCK_DIR, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const item = JSON.parse(data);
        items.push(item);
      } catch (error) {
        console.error(`Error reading stock file ${file}:`, error);
      }
    }
    
    // Sort by category, then by price
    return items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category, 'th');
      }
      return a.price - b.price;
    });
  } catch (error) {
    console.error('Error reading stock directory:', error);
    return [];
  }
};

const getStockItem = (id) => {
  try {
    const items = getAllStockItems();
    return items.find(item => item.id === id);
  } catch (error) {
    console.error('Error getting stock item:', error);
    return null;
  }
};

const updateStockItem = (id, updates) => {
  try {
    const items = getAllStockItems();
    const item = items.find(i => i.id === id);
    
    if (!item) return false;
    
    const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
    const fileName = `${item.name.replace(/[^a-zA-Z0-9ก-๙]/g, '')}.json`;
    const filePath = path.join(STOCK_DIR, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(updatedItem, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating stock item:', error);
    return false;
  }
};

const createStockItem = (productData) => {
  try {
    const fileName = `${productData.name.replace(/[^a-zA-Z0-9ก-๙]/g, '')}.json`;
    const filePath = path.join(STOCK_DIR, fileName);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.error('Product file already exists:', fileName);
      return false;
    }
    
    const now = new Date().toISOString();
    const newProduct = {
      ...productData,
      createdAt: now,
      updatedAt: now
    };
    
    fs.writeFileSync(filePath, JSON.stringify(newProduct, null, 2));
    return true;
  } catch (error) {
    console.error('Error creating stock item:', error);
    return false;
  }
};

const deleteStockItem = (id) => {
  try {
    console.log('deleteStockItem called with id:', id);
    const items = getAllStockItems();
    console.log('Found items:', items.length);
    const item = items.find(i => i.id === id);
    console.log('Found item to delete:', item ? item.name : 'NOT FOUND');
    
    if (!item) {
      console.log('Item not found for deletion');
      return false;
    }
    
    const fileName = `${item.name.replace(/[^a-zA-Z0-9ก-๙]/g, '')}.json`;
    const filePath = path.join(STOCK_DIR, fileName);
    console.log('Attempting to delete file:', filePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted successfully');
      return true;
    }
    
    console.log('File does not exist:', filePath);
    return false;
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return false;
  }
};

// Pages helper functions
const readPagesFromFile = () => {
  try {
    if (fs.existsSync(PAGES_FILE)) {
      const data = fs.readFileSync(PAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { pages: {} };
  } catch (error) {
    console.error('Error reading pages file:', error);
    return { pages: {} };
  }
};

const writePagesToFile = (data) => {
  try {
    fs.writeFileSync(PAGES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing pages file:', error);
    return false;
  }
};

const getPageData = (pageId) => {
  try {
    const data = readPagesFromFile();
    return data.pages[pageId] || null;
  } catch (error) {
    console.error('Error getting page data:', error);
    return null;
  }
};

const savePageData = (pageId, pageData) => {
  try {
    const data = readPagesFromFile();
    data.pages[pageId] = {
      ...pageData,
      updatedAt: new Date().toISOString()
    };
    return writePagesToFile(data);
  } catch (error) {
    console.error('Error saving page data:', error);
    return false;
  }
};

// Initialize users file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  writeUsersToFile({ users: [] });
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Get all users (for admin purposes - in production, this should be protected)
app.get('/api/users', validateAPIKey, (req, res) => {
  try {
    const data = readUsersFromFile();
    // Don't return passwords
    const safeUsers = data.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      pin: user.pin,
      createdAt: user.createdAt
    }));
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, pin } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName || !pin) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Check if username or email already exists
    const data = readUsersFromFile();
    const existingUser = data.users.find(
      user => user.username === username || user.email === email
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID first
    const userId = uuidv4();

    // Generate universal key for new user
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(4).toString('hex');
    const universalKey = `KD_${userId}_UNIVERSAL_${timestamp}_${randomHash}`;

    // Create new user
    const newUser = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      pin,
      points: 0,
      universalKey: universalKey,
      universalKeyCreatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add user to data
    data.users.push(newUser);
    
    // Save to file
    const saved = writeUsersToFile(data);
    
    if (saved) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          pin: newUser.pin
        },
        token
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    }

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
    });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
      });
    }

    // Find user
    const data = readUsersFromFile();
    const user = data.users.find(
      u => u.username === username || u.email === username
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        pin: user.pin
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('=== VerifyToken Middleware ===');
  console.log('Headers:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  console.log('Extracted token:', token);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      message: '5555555555555555555555555555555'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }
};

// ===== PROFILE SYSTEM =====

// GET /api/user/profile - Get current user's profile
app.get('/api/user/profile', verifyToken, (req, res) => {
  try {
    const profile = getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์'
    });
  }
});

// PUT /api/user/profile - Update current user's profile
app.put('/api/user/profile', verifyToken, upload.single('avatar'), (req, res) => {
  try {
    const { username, firstName, lastName, email } = req.body;
    const avatarFile = req.file;
    
    // Validate input data
    const updates = {};
    
    if (username !== undefined) {
      if (!username || username.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
        });
      }
      updates.username = username.trim();
    }
    
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'รูปแบบอีเมลไม่ถูกต้อง'
        });
      }
      updates.email = email.trim();
    }
    
    if (firstName !== undefined) {
      updates.firstName = firstName || '';
    }
    
    if (lastName !== undefined) {
      updates.lastName = lastName || '';
    }
    
    // Process avatar upload
    if (avatarFile) {
      const avatarPath = processAvatarUpload(avatarFile, req.user.id);
      if (!avatarPath) {
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถจัดการไฟล์รูปภาพได้'
        });
      }
      updates.avatar = avatarPath;
    }
    
    // Update profile
    const updatedProfile = updateUserProfile(req.user.id, updates);
    
    if (!updatedProfile) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถอัปเดตโปรไฟล์ได้'
      });
    }

    res.json({
      success: true,
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
    });
  }
});

// GET /api/user/:userId/profile - Get another user's public profile
app.get('/api/user/:userId/profile', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    const profile = getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Return public profile data (hide sensitive info)
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      points: profile.points,
      createdAt: profile.createdAt
    };

    res.json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์'
    });
  }
});

// DELETE /api/user/avatar - Delete user's avatar
app.delete('/api/user/avatar', verifyToken, (req, res) => {
  try {
    const profile = getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Delete avatar file if exists
    if (profile.avatar) {
      const avatarPath = path.join(__dirname, profile.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      
      // Update user data
      const updatedProfile = updateUserProfile(req.user.id, { avatar: null });
      
      if (!updatedProfile) {
        return res.status(500).json({
          success: false,
          message: 'ไม่สามารถลบรูปภาพได้'
        });
      }
    }

    res.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ'
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
    });
  }
});

// ===== END PROFILE SYSTEM =====

// Get vouchers
app.get('/api/vouchers', validateAPIKey, (req, res) => {
  try {
    const data = readVouchersFromFile();
    res.json({ success: true, vouchers: data.vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโค้ดส่วนลด' });
  }
});

// Use voucher
app.post('/api/vouchers/use', verifyToken, (req, res) => {
  try {
    const { code, amount } = req.body;
    const data = readVouchersFromFile();
    const voucher = data.vouchers.find(v => v.code === code && v.active);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'ไม่พบโค้ดส่วนลดนี้' });
    }

    if (voucher.used >= voucher.maxUsage) {
      return res.status(400).json({ success: false, message: 'โค้ดส่วนลดนี้ถูกใช้หมดแล้ว' });
    }

    if (amount < voucher.minAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `ยอดขั้นต่ำสำหรับโค้ดนี้คือ ${voucher.minAmount} บาท` 
      });
    }

    if (new Date() > new Date(voucher.expiry)) {
      return res.status(400).json({ success: false, message: 'โค้ดส่วนลดนี้หมดอายุแล้ว' });
    }

    // Calculate discount
    let discount = 0;
    if (voucher.type === 'percent') {
      discount = (amount * voucher.discount) / 100;
    } else if (voucher.type === 'amount') {
      discount = voucher.discount;
    } else if (voucher.type === 'shipping') {
      discount = voucher.discount; // Fixed shipping discount
    }

    // Update voucher usage
    voucher.used += 1;
    writeVouchersToFile(data);

    res.json({
      success: true,
      message: 'ใช้โค้ดส่วนลดสำเร็จ',
      discount,
      originalAmount: amount,
      finalAmount: Math.max(0, amount - discount)
    });
  } catch (error) {
    console.error('Voucher use error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการใช้โค้ดส่วนลด' });
  }
});

// Topup endpoints
app.get('/api/topups/stats', validateAPIKey, (req, res) => {
  try {
    const topupData = readTopupsFromFile();
    const userData = readUsersFromFile();
    
    res.json({
      success: true,
      stats: {
        totalUsers: userData.users.length,
        totalTopupAmount: topupData.totalTopupAmount || 0,
        totalTopups: topupData.topups.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
  }
});

// Create topup request
app.post('/api/topup', verifyToken, async (req, res) => {
  try {
    const { angpaoLink } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!angpaoLink) {
      return res.status(400).json({ success: false, message: 'กรุณาใส่ลิ้งก์อังเปา' });
    }

    // Validate TrueMoney link format
    if (!angpaoLink.includes('gift.truemoney.com') && !angpaoLink.includes('tmn.app')) {
      return res.status(400).json({ 
        success: false, 
        message: 'รูปแบบลิ้งก์อังเปาไม่ถูกต้อง' 
      });
    }

    // Check if this link has been used before (prevent duplicate usage)
    const topupData = readTopupsFromFile();
    const existingTopup = topupData.topups.find(topup => 
      topup.angpaoLink === angpaoLink && topup.status === 'completed'
    );

    if (existingTopup) {
      return res.status(400).json({ 
        success: false, 
        message: `ลิ้งก์นี้เคยถูกใช้ไปแล้วโดย ${existingTopup.username} เมื่อ ${new Date(existingTopup.createdAt).toLocaleString('th-TH')}` 
      });
    }

    // Extract gift code from URL
    let giftCode = '';
    try {
      const url = new URL(angpaoLink);
      
      // Try different parameter names and formats
      giftCode = url.searchParams.get('v') ||     // For gift.truemoney.com/?v=...
                 url.searchParams.get('c') ||     // For some other formats
                 url.pathname.split('/').pop() || // For direct path
                 '';
      
      // If still no code, try to extract from the full link
      if (!giftCode && angpaoLink.includes('=')) {
        const parts = angpaoLink.split('=');
        giftCode = parts[parts.length - 1];
      }
      
      if (!giftCode) {
        console.log('Failed to extract gift code from URL:', angpaoLink);
        console.log('URL object:', url);
        console.log('Search params:', [...url.searchParams.entries()]);
        
        return res.status(400).json({ 
          success: false, 
          message: 'ไม่สามารถดึงรหัสอังเปาจากลิ้งก์ได้' 
        });
      }
      
      console.log('Extracted gift code:', giftCode);
    } catch (error) {
      console.log('Error parsing URL:', error);
      return res.status(400).json({ 
        success: false, 
        message: 'ลิ้งก์อังเปาไม่ถูกต้อง' 
      });
    }

    console.log('Processing angpao with link:', angpaoLink);

    // Call mystrix2.me API to check angpao (using full URL)
    try {
      const apiUrl = `https://api.mystrix2.me/truemoney?phone=0852552856&gift=${encodeURIComponent(angpaoLink)}`;
      console.log('Calling API:', apiUrl);
      
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const apiData = await apiResponse.json();
      console.log('Mystrix API response:', apiData);

      // Check if voucher data exists first
      if (!apiData.data || !apiData.data.voucher) {
        return res.status(400).json({ 
          success: false, 
          message: 'ไม่พบข้อมูลอังเปา' 
        });
      }

      const voucher = apiData.data.voucher;
      const amount = parseFloat(voucher.amount_baht || 0);
      const ownerProfile = apiData.data.owner_profile || {};
      const myTicket = apiData.data.my_ticket;
      const tickets = apiData.data.tickets || [];

      // Check for various success and error conditions
      if (apiData.status) {
        const statusCode = apiData.status.code;
        
        // SUCCESS with available > 0 means we can still redeem
        // SUCCESS with available = 0 and my_ticket means we just redeemed successfully
        if (statusCode === 'SUCCESS') {
          if (myTicket) {
            // We successfully redeemed this voucher
            console.log('Successfully redeemed voucher, our ticket:', myTicket);
            // Continue to create topup record
          } else if (voucher.available > 0) {
            // Voucher is still available for redemption - this shouldn't happen in practice
            console.log('Voucher still available for redemption');
            // Continue to create topup record  
          } else {
            // No my_ticket and no availability - someone else took it
            return res.status(400).json({ 
              success: false, 
              message: 'อังเปานี้ถูกคนอื่นใช้ไปแล้ว' 
            });
          }
        }
        // VOUCHER_OUT_OF_STOCK means someone already redeemed it (could be us or someone else)
        else if (statusCode === 'VOUCHER_OUT_OF_STOCK') {
          // Check if we have a ticket (means we successfully redeemed)
          if (myTicket) {
            // We successfully redeemed this voucher
            console.log('Successfully redeemed voucher (OUT_OF_STOCK), our ticket:', myTicket);
            // Continue to create topup record
          } else if (tickets.length > 0) {
            // Someone else redeemed it
            return res.status(400).json({ 
              success: false, 
              message: 'อังเปานี้ถูกคนอื่นใช้ไปแล้ว' 
            });
          } else {
            return res.status(400).json({ 
              success: false, 
              message: 'อังเปานี้ถูกใช้หมดแล้ว' 
            });
          }
        }
        // Other error cases
        else if (statusCode === 'VOUCHER_EXPIRED') {
          return res.status(400).json({ 
            success: false, 
            message: 'อังเปานี้หมดอายุแล้ว' 
          });
        }
        else if (statusCode === 'VOUCHER_NOT_FOUND') {
          return res.status(400).json({ 
            success: false, 
            message: 'ไม่พบอังเปานี้' 
          });
        }
        else {
          return res.status(400).json({ 
            success: false, 
            message: apiData.status.message || 'ไม่สามารถรับอังเปาได้' 
          });
        }
      }

      if (amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'จำนวนเงินในอังเปาไม่ถูกต้อง' 
        });
      }

      const topupData = readTopupsFromFile();
      
      // Extract gift code for record keeping
      let giftCode = '';
      try {
        const url = new URL(angpaoLink);
        giftCode = url.searchParams.get('v') || 
                   url.searchParams.get('c') || 
                   url.pathname.split('/').pop() || 
                   angpaoLink.split('=')[angpaoLink.split('=').length - 1];
      } catch (e) {
        giftCode = angpaoLink; // fallback
      }
      
      const newTopup = {
        id: 'TOPUP' + Date.now(),
        userId,
        username,
        amount: amount,
        angpaoLink,
        giftCode,
        status: 'completed',
        points: amount, // 1:1 ratio
        ownerProfile: {
          fullName: ownerProfile.full_name || '',
          mobile: ownerProfile.mobile || ''
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      topupData.topups.push(newTopup);
      topupData.totalTopupAmount = (topupData.totalTopupAmount || 0) + amount;
      
      writeTopupsToFile(topupData);

      // Add points to user account
      const newPoints = updateUserPoints(userId, amount);

      res.json({
        success: true,
        message: `🎉 คุณเติมเงินสำเร็จ ${amount} บาท จากคุณ ${ownerProfile.full_name || 'ผู้ส่ง'} ได้รับ ${amount} พอยต์`,
        topup: newTopup,
        userPoints: newPoints
      });

    } catch (apiError) {
      console.error('Mystrix API error:', apiError);
      return res.status(500).json({ 
        success: false, 
        message: 'ไม่สามารถเชื่อมต่อกับระบบรับอังเปาได้ กรุณาลองใหม่อีกครั้ง' 
      });
    }

  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเติมเงิน' });
  }
});

// Get user topups
app.get('/api/topups', verifyToken, (req, res) => {
  try {
    const topupData = readTopupsFromFile();
    const userTopups = topupData.topups.filter(t => t.userId === req.user.id);
    
    res.json({
      success: true,
      topups: userTopups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงประวัติเติมเงิน' });
  }
});

// Verify Turnstile token endpoint
app.post('/api/verify-turnstile', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // ตรวจสอบ token กับ Cloudflare API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: '0x4AAAAAACf9_TwDPy63W_1gTfPJ9wi3jiU', // Secret key
        response: token,
        remoteip: req.ip || req.connection.remoteAddress
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Turnstile verification successful:', {
        success: data.success,
        hostname: data.hostname,
        challenge_ts: data.challenge_ts
      });
      
      res.json({
        success: true,
        message: 'Verification successful',
        data: {
          hostname: data.hostname,
          challenge_ts: data.challenge_ts
        }
      });
    } else {
      console.log('Turnstile verification failed:', data);
      res.status(400).json({
        success: false,
        message: 'Verification failed',
        error: data['error-codes'] || ['unknown_error']
      });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// Roblox Script API - Hidden loadstring endpoint (for Roblox execution only)
app.get('/api/scripts/:scriptId/loadstring', verifyToken, (req, res) => {
  try {
    const { scriptId } = req.params;
    
    // ตรวจสอบว่า scriptId ถูกต้องหรือไม่
    if (!scriptId || !/^[a-zA-Z0-9_-]+$/.test(scriptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid script ID'
      });
    }

    // อ่านไฟล์ script
    const scriptPath = path.join(__dirname, 'scripts', `${scriptId}.lua`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    // อ่านเนื้อหา script เพื่อตรวจสอบความเป็นเจ้าของ
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // ตรวจสอบว่า script มีข้อมูลเจ้าของหรือไม่
    const authorMatch = scriptContent.match(/--\s*@author\s+(.+)/i);
    const scriptAuthor = authorMatch ? authorMatch[1].trim().toLowerCase() : null;
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ script หรือ admin
    const currentUser = req.user.username.toLowerCase();
    const isAdmin = req.user.username.toLowerCase() === 'admin';
    
    if (!isAdmin && scriptAuthor && scriptAuthor !== currentUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You do not own this script'
      });
    }
    
    // ตรวจสอบ User-Agent เพื่อให้แน่ใจว่าเป็น Roblox
    const userAgent = req.headers['user-agent'] || '';
    const isRoblox = userAgent.includes('Roblox') || 
                   userAgent.includes('Windows') || 
                   req.headers['x-roblox-game-id'] ||
                   req.query.from === 'roblox';
    
    if (!isRoblox) {
      return res.status(403).send(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 - Roblox Only | Kunlun</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
            background: linear-gradient(135deg, #0d0d0f 0%, #1a1a1f 100%);
            color: #dcdce6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(18, 18, 21, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 60px 40px;
            border: 1px solid rgba(35, 35, 42, 0.5);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        
        .error-code {
            font-size: 120px;
            font-weight: 700;
            color: #ff3b30;
            margin-bottom: 20px;
            text-shadow: 0 0 30px rgba(255, 59, 48, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .error-title {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #dcdce6;
        }
        
        .error-message {
            font-size: 18px;
            line-height: 1.6;
            color: #646473;
            margin-bottom: 40px;
        }
        
        .info-box {
            background: rgba(22, 22, 26, 0.6);
            border: 1px solid rgba(45, 45, 55, 0.5);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #30ff6a;
            margin-bottom: 10px;
        }
        
        .info-text {
            font-size: 14px;
            color: #646473;
            line-height: 1.5;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: #30ff6a;
            color: #0a0a0c;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 0 10px;
        }
        
        .btn:hover {
            background: #1ed250;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(48, 255, 106, 0.2);
        }
        
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #646473;
        }
        
        .roblox-icon {
            font-size: 60px;
            margin-bottom: 20px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="roblox-icon">🎮</div>
        <div class="error-code">403</div>
        <h1 class="error-title">Roblox Only</h1>
        <p class="error-message">
            Endpoint นี้สำหรับ Roblox เท่านั้น<br>
            สคริปต์สามารถ loadstring ได้เฉพาะใน Roblox environment
        </p>
        
        <div class="info-box">
            <div class="info-title">🎮 ข้อมูลการเข้าถึง</div>
            <div class="info-text">
                • Endpoint นี้สำหรับ loadstring ใน Roblox เท่านั้น<br>
                • ไม่สามารถเข้าถึงผ่าน browser ธรรมดา<br>
                • ต้องมีสิทธิ์และเป็นเจ้าของสคริปต์<br>
                • สำหรับการดูสคริปต์ ใช้ /raw endpoint
            </div>
        </div>
        
        <div>
            <a href="https://getkunlun.me" class="btn">🏠 กลับหน้าแรก</a>
            <a href="https://discord.com/channels/1425425387256680519/1432548436535672912" class="btn btn-secondary">💬 ติดต่อ Discord</a>
        </div>
        
        <div class="footer">
            <p>© 2026 Kunlun - Roblox Script Protection</p>
        </div>
    </div>
</body>
</html>
      `);
    }
    
    // ส่งเป็น raw text สำหรับ loadstring (Roblox เท่านั้น)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Roblox-Script', 'true');
    res.send(scriptContent);
    
  } catch (error) {
    console.error('Error serving script for loadstring:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading script'
    });
  }
});

// Roblox Script API - Raw script endpoint (protected)
app.get('/api/scripts/:scriptId/raw', verifyToken, (req, res) => {
  try {
    const { scriptId } = req.params;
    
    // ตรวจสอบว่า scriptId ถูกต้องหรือไม่
    if (!scriptId || !/^[a-zA-Z0-9_-]+$/.test(scriptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid script ID'
      });
    }

    // อ่านไฟล์ script
    const scriptPath = path.join(__dirname, 'scripts', `${scriptId}.lua`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    // อ่านเนื้อหา script เพื่อตรวจสอบความเป็นเจ้าของ
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // ตรวจสอบว่า script มีข้อมูลเจ้าของหรือไม่
    const authorMatch = scriptContent.match(/--\s*@author\s+(.+)/i);
    const scriptAuthor = authorMatch ? authorMatch[1].trim().toLowerCase() : null;
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ script หรือ admin
    const currentUser = req.user.username.toLowerCase();
    const isAdmin = req.user.username.toLowerCase() === 'admin';
    
    if (!isAdmin && scriptAuthor && scriptAuthor !== currentUser) {
      return res.status(403).send(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 - Access Denied | Kunlun</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
            background: linear-gradient(135deg, #0d0d0f 0%, #1a1a1f 100%);
            color: #dcdce6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(18, 18, 21, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 60px 40px;
            border: 1px solid rgba(35, 35, 42, 0.5);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        
        .error-code {
            font-size: 120px;
            font-weight: 700;
            color: #ff3b30;
            margin-bottom: 20px;
            text-shadow: 0 0 30px rgba(255, 59, 48, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .error-title {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #dcdce6;
        }
        
        .error-message {
            font-size: 18px;
            line-height: 1.6;
            color: #646473;
            margin-bottom: 40px;
        }
        
        .info-box {
            background: rgba(22, 22, 26, 0.6);
            border: 1px solid rgba(45, 45, 55, 0.5);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #30ff6a;
            margin-bottom: 10px;
        }
        
        .info-text {
            font-size: 14px;
            color: #646473;
            line-height: 1.5;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: #30ff6a;
            color: #0a0a0c;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 0 10px;
        }
        
        .btn:hover {
            background: #1ed250;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(48, 255, 106, 0.2);
        }
        
        .btn-secondary {
            background: transparent;
            border: 1px solid #30ff6a;
            color: #30ff6a;
        }
        
        .btn-secondary:hover {
            background: #30ff6a;
            color: #0a0a0c;
        }
        
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #646473;
        }
        
        .lock-icon {
            font-size: 60px;
            margin-bottom: 20px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="lock-icon">🔒</div>
        <div class="error-code">403</div>
        <h1 class="error-title">Access Denied</h1>
        <p class="error-message">
            คุณไม่มีสิทธิ์เข้าถึงสคริปต์นี้<br>
            สคริปต์นี้เป็นส่วนตัวและต้องการการอนุญาตพิเศษ
        </p>
        
        <div class="info-box">
            <div class="info-title">📋 ข้อมูลการเข้าถึง</div>
            <div class="info-text">
                • ต้องเป็นเจ้าของสคริปต์เท่านั้นที่สามารถเข้าถึงได้<br>
                • ตรวจสอบว่าคุณ login ด้วยบัญชีที่ถูกต้อง<br>
                • หากคุณเป็นเจ้าของสคริปต์ กรุณาตรวจสอบ @author ในไฟล์<br>
                • สำหรับข้อมูลเพิ่มเติม ติดต่อผู้ดูแลระบบ
            </div>
        </div>
        
        <div>
            <a href="https://getkunlun.me" class="btn">🏠 กลับหน้าแรก</a>
            <a href="https://discord.com/channels/1425425387256680519/1432548436535672912" class="btn btn-secondary">💬 ติดต่อ Discord</a>
        </div>
        
        <div class="footer">
            <p>© 2026 Kunlun - Protected Script Access</p>
        </div>
    </div>
</body>
</html>
      `);
    }
    
    // ส่งเป็น HTML page ที่ซ่อน script content
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // สร้าง HTML page ที่ซ่อน script content
    const htmlPage = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Script Content - ${scriptId} | Kunlun</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
            background: linear-gradient(135deg, #0d0d0f 0%, #1a1a1f 100%);
            color: #dcdce6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            text-align: center;
            max-width: 800px;
            background: rgba(18, 18, 21, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 60px 40px;
            border: 1px solid rgba(35, 35, 42, 0.5);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        
        .script-icon {
            font-size: 60px;
            margin-bottom: 20px;
            opacity: 0.8;
        }
        
        .title {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #dcdce6;
        }
        
        .subtitle {
            font-size: 18px;
            line-height: 1.6;
            color: #646473;
            margin-bottom: 30px;
        }
        
        .info-box {
            background: rgba(22, 22, 26, 0.6);
            border: 1px solid rgba(45, 45, 55, 0.5);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #30ff6a;
            margin-bottom: 10px;
        }
        
        .info-text {
            font-size: 14px;
            color: #646473;
            line-height: 1.5;
        }
        
        .script-info {
            background: rgba(48, 255, 106, 0.1);
            border: 1px solid rgba(48, 255, 106, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: #30ff6a;
            color: #0a0a0c;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 0 10px;
            cursor: pointer;
            border: none;
        }
        
        .btn:hover {
            background: #1ed250;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(48, 255, 106, 0.2);
        }
        
        .btn-secondary {
            background: transparent;
            border: 1px solid #30ff6a;
            color: #30ff6a;
        }
        
        .btn-secondary:hover {
            background: #30ff6a;
            color: #0a0a0c;
        }
        
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #646473;
        }
        
        .hidden-content {
            display: none;
        }
        
        .copy-btn {
            background: rgba(48, 255, 106, 0.2);
            border: 1px solid rgba(48, 255, 106, 0.5);
            color: #30ff6a;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .copy-btn:hover {
            background: rgba(48, 255, 106, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="script-icon">📜</div>
        <h1 class="title">Script Content Protected</h1>
        <p class="subtitle">
            เนื้อหาสคริปต์ถูกป้องกันและซ่อนอยู่<br>
            สคริปต์นี้สามารถใช้งานได้เฉพาะใน Roblox เท่านั้น
        </p>
        
        <div class="info-box">
            <div class="info-title">📋 ข้อมูลสคริปต์</div>
            <div class="info-text">
                • Script ID: <strong>${scriptId}</strong><br>
                • สถานะ: <span style="color: #30ff6a;">✅ พร้อมใช้งาน</span><br>
                • การเข้าถึง: <span style="color: #30ff6a;">🔒 ป้องกันแล้ว</span><br>
                • ประเภท: <span style="color: #30ff6a;">🔧 Private Script</span>
            </div>
        </div>
        
        <div class="script-info">
            <strong>📝 Script Information:</strong><br>
            Script content is hidden for security reasons.<br>
            This script can only be executed within Roblox environment.<br>
            Content length: ${scriptContent.length} characters
        </div>
        
        <div class="hidden-content" id="scriptContent">
            ${scriptContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
        
        <div>
            <button class="btn" onclick="copyScript()">📋 คัดลอกสคริปต์</button>
            <button class="btn btn-secondary" onclick="showScript()">👁️ แสดงสคริปต์</button>
            <a href="https://getkunlun.me" class="btn">🏠 กลับหน้าแรก</a>
        </div>
        
        <div class="footer">
            <p>© 2026 Kunlun - Protected Script Content | Script ID: ${scriptId}</p>
        </div>
    </div>
    
    <script>
        function copyScript() {
            const content = document.getElementById('scriptContent').textContent;
            navigator.clipboard.writeText(content).then(() => {
                alert('✅ คัดลอกสคริปต์แล้ว! สามารถนำไปใช้ใน Roblox ได้');
            }).catch(() => {
                alert('❌ ไม่สามารถคัดลอกได้ กรุณาลองใหม่');
            });
        }
        
        function showScript() {
            const hiddenContent = document.getElementById('scriptContent');
            if (hiddenContent.style.display === 'none' || hiddenContent.style.display === '') {
                hiddenContent.style.display = 'block';
                hiddenContent.style.background = 'rgba(22, 22, 26, 0.8)';
                hiddenContent.style.border = '1px solid rgba(45, 45, 55, 0.5)';
                hiddenContent.style.borderRadius = '8px';
                hiddenContent.style.padding = '20px';
                hiddenContent.style.margin = '20px 0';
                hiddenContent.style.whiteSpace = 'pre-wrap';
                hiddenContent.style.fontFamily = 'Courier New, monospace';
                hiddenContent.style.fontSize = '12px';
                hiddenContent.style.maxHeight = '400px';
                hiddenContent.style.overflow = 'auto';
            } else {
                hiddenContent.style.display = 'none';
            }
        }
    </script>
</body>
</html>
    `;
    
    res.send(htmlPage);
    
  } catch (error) {
    console.error('Error serving script:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading script'
    });
  }
});

// Roblox Script API - List available scripts
app.get('/api/scripts', (req, res) => {
  try {
    const scriptsDir = path.join(__dirname, 'scripts');
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    const scriptFiles = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.lua'))
      .map(file => {
        const scriptPath = path.join(scriptsDir, file);
        const stats = fs.statSync(scriptPath);
        const scriptId = file.replace('.lua', '');
        
        // อ่าน metadata จากไฟล์
        const content = fs.readFileSync(scriptPath, 'utf8');
        const metadata = extractScriptMetadata(content);
        
        return {
          id: scriptId,
          name: metadata.name || scriptId,
          description: metadata.description || 'No description',
          version: metadata.version || '1.0.0',
          author: metadata.author || 'Unknown',
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
          size: stats.size
        };
      });
    
    res.json({
      success: true,
      scripts: scriptFiles,
      total: scriptFiles.length
    });
    
  } catch (error) {
    console.error('Error listing scripts:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing scripts'
    });
  }
});

// Helper function to extract metadata from script
function extractScriptMetadata(content) {
  const metadata = {};
  
  // หา metadata ใน comment
  const nameMatch = content.match(/--\s*@name\s+(.+)/i);
  if (nameMatch) metadata.name = nameMatch[1].trim();
  
  const descMatch = content.match(/--\s*@description\s+(.+)/i);
  if (descMatch) metadata.description = descMatch[1].trim();
  
  const versionMatch = content.match(/--\s*@version\s+(.+)/i);
  if (versionMatch) metadata.version = versionMatch[1].trim();
  
  const authorMatch = content.match(/--\s*@author\s+(.+)/i);
  if (authorMatch) metadata.author = authorMatch[1].trim();
  
  return metadata;
}

// Roblox Script API - Upload script (protected)
app.post('/api/scripts/upload', verifyToken, (req, res) => {
  try {
    const { scriptId, content, name, description, version, author } = req.body;
    
    if (!scriptId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Script ID and content are required'
      });
    }
    
    // ตรวจสอบ scriptId
    if (!/^[a-zA-Z0-9_-]+$/.test(scriptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid script ID format'
      });
    }
    
    // สร้าง scripts directory ถ้ายังไม่มี
    const scriptsDir = path.join(__dirname, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    // เพิ่ม metadata ที่ต้นไฟล์
    let finalContent = content;
    if (!content.includes('-- @name')) {
      finalContent = `-- @name ${name || scriptId}\n` +
                    `-- @description ${description || 'No description'}\n` +
                    `-- @version ${version || '1.0.0'}\n` +
                    `-- @author ${author || 'Unknown'}\n\n` +
                    content;
    }
    
    // เขียนไฟล์
    const scriptPath = path.join(scriptsDir, `${scriptId}.lua`);
    fs.writeFileSync(scriptPath, finalContent, 'utf8');
    
    res.json({
      success: true,
      message: 'Script uploaded successfully',
      scriptId: scriptId,
      url: `https://getkunlun.me/api/scripts/${scriptId}/raw`
    });
    
  } catch (error) {
    console.error('Error uploading script:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading script'
    });
  }
});

// Roblox Script API - Delete script (protected)
app.delete('/api/scripts/:scriptId', verifyToken, (req, res) => {
  try {
    const { scriptId } = req.params;
    
    if (!scriptId) {
      return res.status(400).json({
        success: false,
        message: 'Script ID is required'
      });
    }
    
    // ตรวจสอบ scriptId
    if (!/^[a-zA-Z0-9_-]+$/.test(scriptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid script ID format'
      });
    }
    
    // ตรวจสอบว่ามี script หรือไม่
    const scriptPath = path.join(__dirname, 'scripts', `${scriptId}.lua`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }
    
    // ลบไฟล์
    fs.unlinkSync(scriptPath);
    
    res.json({
      success: true,
      message: 'Script deleted successfully',
      scriptId: scriptId
    });
    
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting script'
    });
  }
});

// Cloudflare status check endpoint
app.get('/api/cloudflare-status', (req, res) => {
  try {
    // ตรวจสอบ Cloudflare headers แบบครบถ้วน
    const cfRay = req.headers['cf-ray'];
    const cfCountry = req.headers['cf-country'] || req.headers['cf-ipcountry'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    const cfVisitor = req.headers['cf-visitor'];
    const cfRequestID = req.headers['cf-request-id'];

    // ตรวจสอบว่าอยู่บน localhost หรือไม่
    const isLocalhost = req.hostname === 'localhost' || 
                      req.hostname === '127.0.0.1' ||
                      req.hostname.includes('192.168.') ||
                      req.hostname.includes('169.254.');

    if (isLocalhost) {
      return res.json({
        success: false,
        status: 'localhost',
        message: 'Running on localhost - Development mode',
        tunnelUrl: null,
        headers: {
          cfRay: null,
          cfCountry: null,
          cfConnectingIp: null
        }
      });
    }

    // ตรวจสอบว่ามี Cloudflare headers หรือไม่
    if (cfRay && cfRequestID) {
      return res.json({
        success: true,
        status: 'connected',
        message: 'Connected via Cloudflare Tunnel - Protected',
        tunnelUrl: req.protocol + '://' + req.get('host'),
        headers: {
          cfRay: cfRay,
          cfCountry: cfCountry,
          cfConnectingIp: cfConnectingIp,
          cfVisitor: cfVisitor,
          cfRequestID: cfRequestID
        },
        security: {
          botFightMode: true,
          ddosProtection: true,
          sslEncryption: true
        }
      });
    } else {
      return res.json({
        success: false,
        status: 'direct',
        message: 'Direct connection - Not protected by Cloudflare',
        tunnelUrl: null,
        headers: {
          cfRay: null,
          cfCountry: null,
          cfConnectingIp: null
        },
        recommendation: 'Please configure Cloudflare Tunnel or Cloudflare Proxy'
      });
    }
  } catch (error) {
    console.error('Cloudflare status check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Error checking Cloudflare status',
      tunnelUrl: null
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
  });
});

// Stock/Products endpoints
app.get('/api/products', validateAPIKey, (req, res) => {
  try {
    const items = getAllStockItems();
    const activeItems = items.filter(item => item.status === 'active' && item.stock > 0);
    
    res.json({
      success: true,
      products: activeItems,
      total: activeItems.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

app.get('/api/products/:id', validateAPIKey, (req, res) => {
  try {
    const { id } = req.params;
    const item = getStockItem(id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการ' });
    }
    
    res.json({
      success: true,
      product: item
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

// Purchase product with points
app.post('/api/purchase', verifyToken, (req, res) => {
  try {
    console.log('Purchase request received:', req.body);
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    console.log('User info:', { userId, username });

    // Get product details
    const product = getStockItem(productId);
    console.log('Product found:', product);
    console.log('Product rewards:', product?.rewards);
    console.log('Rewards array length:', product?.rewards?.length);
    
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการ' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'สินค้าไม่เพียงพอ' });
    }

    // Calculate total cost
    const totalCost = product.price * quantity;
    
    // Check user points
    const userPoints = getUserPoints(userId);
    if (userPoints < totalCost) {
      return res.status(400).json({ 
        success: false, 
        message: `พอยต์ไม่เพียงพอ ต้องการ ${totalCost} พอยต์ แต่คุณมี ${userPoints} พอยต์` 
      });
    }

    // Deduct points
    const remainingPoints = deductUserPoints(userId, totalCost);
    if (remainingPoints === -1) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถหักพอยต์ได้' });
    }

    // Update product stock
    const updatedStock = product.stock - quantity;
    updateStockItem(productId, { stock: updatedStock });

    // Generate delivery code and select random reward (for digital products)
    let deliveryCode = `${product.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    let selectedReward = null;
    
    // Check if product has rewards and select random one
    if (product.rewards && Array.isArray(product.rewards) && product.rewards.length > 0) {
      const randomIndex = Math.floor(Math.random() * product.rewards.length);
      selectedReward = product.rewards[randomIndex];
      deliveryCode = selectedReward; // Use the reward as delivery code
      console.log(`Selected random reward: ${selectedReward} from ${product.rewards.length} rewards`);
    }

    console.log('Creating order data...');
    // Create order record
    const orderData = {
      userId,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity,
      price: product.price,
      totalPrice: totalCost,
      deliveredCode: deliveryCode,
      deliveredData: {
        productDetails: product,
        username: username,
        purchaseDate: new Date().toISOString()
      }
    };

    console.log('Adding order to database...');
    const newOrder = addOrder(orderData);
    console.log('Order created:', newOrder);
    
    if (!newOrder) {
      console.log('Failed to create order');
      return res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกคำสั่งซื้อได้' });
    }

    res.json({
      success: true,
      message: `🎉 ซื้อ ${product.name} จำนวน ${quantity} ชิ้น สำเร็จ!`,
      orderId: newOrder.orderId,
      deliveredCode: deliveryCode,
      remainingPoints
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการซื้อสินค้า' });
  }
});

// Get user points
app.get('/api/user/points', verifyToken, (req, res) => {
  try {
    const points = getUserPoints(req.user.id);
    res.json({
      success: true,
      points
    });
  } catch (error) {
    console.error('Error getting points:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพอยต์' });
  }
});

// Get user order history
app.get('/api/orders/history', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const orders = getUserOrders(userId);
    
    res.json({
      success: true,
      orders: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการสั่งซื้อ'
    });
  }
});

// Admin: Get all stock items (including out of stock)
app.get('/api/admin/stock', verifyToken, (req, res) => {
  try {
    const items = getAllStockItems();
    res.json({
      success: true,
      stock: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสต็อก' });
  }
});

// Admin: Update stock
app.put('/api/admin/stock/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const success = updateStockItem(id, updates);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่สามารถอัพเดทสินค้าได้' });
    }
    
    res.json({
      success: true,
      message: 'อัพเดทสินค้าสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสต็อก' });
  }
});

// Admin: Add new product
app.post('/api/admin/products', verifyToken, (req, res) => {
  try {
    const productData = req.body;
    const success = createStockItem(productData);
    
    if (!success) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถสร้างสินค้าได้' });
    }
    
    res.json({
      success: true,
      message: 'เพิ่มสินค้าใหม่สำเร็จ',
      product: productData
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
  }
});

// Admin: Update product
app.put('/api/admin/products/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    const success = updateStockItem(id, productData);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการแก้ไข' });
    }
    
    res.json({
      success: true,
      message: 'แก้ไขสินค้าสำเร็จ',
      product: productData
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' });
  }
});

// Admin: Delete product
app.delete('/api/admin/products/:id', verifyToken, (req, res) => {
  console.log('DELETE /api/admin/products/:id called with id:', req.params.id);
  try {
    const { id } = req.params;
    console.log('Attempting to delete product with id:', id);
    
    const success = deleteStockItem(id);
    console.log('Delete operation result:', success);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่ต้องการลบ' });
    }
    
    res.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบสินค้า' });
  }
});

// Admin Users endpoints
app.get('/api/admin/users', verifyToken, (req, res) => {
  try {
    const data = readUsersFromFile();
    const users = data.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      points: user.points || 0,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});

app.put('/api/admin/users/:id/points', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    
    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({ success: false, message: 'จำนวนพอยต์ไม่ถูกต้อง' });
    }
    
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }
    
    data.users[userIndex].points = points;
    data.users[userIndex].updatedAt = new Date().toISOString();
    
    writeUsersToFile(data);
    
    res.json({
      success: true,
      message: 'อัพเดทพอยต์สำเร็จ',
      user: {
        id: data.users[userIndex].id,
        username: data.users[userIndex].username,
        email: data.users[userIndex].email,
        points: data.users[userIndex].points
      }
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทพอยต์' });
  }
});

app.delete('/api/admin/users/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }
    
    const deletedUser = data.users[userIndex];
    data.users.splice(userIndex, 1);
    
    writeUsersToFile(data);
    
    res.json({
      success: true,
      message: `ลบผู้ใช้ ${deletedUser.username} สำเร็จ`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
  }
});

// ======================
// ANNOUNCEMENTS API
// ======================

// Helper function to read announcements
const readAnnouncementsFromFile = () => {
  try {
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { messages: [] };
  } catch (error) {
    console.error('Error reading announcements file:', error);
    return { messages: [] };
  }
};

// Helper function to write announcements
const writeAnnouncementsToFile = (announcements) => {
  try {
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(announcements, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing announcements file:', error);
    return false;
  }
};

// GET /api/announcements - Get all announcements
app.get('/api/announcements', validateAPIKey, (req, res) => {
  try {
    const announcements = readAnnouncementsFromFile();
    res.json({
      success: true,
      announcements: announcements.messages || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements'
    });
  }
});

// PUT /api/announcements - Update announcements (Admin only)
app.put('/api/announcements', verifyToken, (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages must be an array'
      });
    }

    const announcements = { messages };
    const success = writeAnnouncementsToFile(announcements);
    
    if (success) {
      res.json({
        success: true,
        message: 'Announcements updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating announcements'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating announcements'
    });
  }
});

// GET /api/admin/pages/:pageId - Get page data (Admin only)
app.get('/api/admin/pages/:pageId', verifyToken, (req, res) => {
  try {
    const { pageId } = req.params;
    const pageData = getPageData(pageId);
    
    if (pageData) {
      res.json({
        success: true,
        page: pageData
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving page data'
    });
  }
});

// PUT /api/admin/pages - Save page data (Admin only)
app.put('/api/admin/pages', verifyToken, (req, res) => {
  try {
    const pageData = req.body;
    
    if (!pageData.id) {
      return res.status(400).json({
        success: false,
        message: 'Page ID is required'
      });
    }

    const success = savePageData(pageData.id, pageData);
    
    if (success) {
      res.json({
        success: true,
        message: 'Page saved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error saving page data'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving page data'
    });
  }
});

// GET /api/pages/:pageId - Get page data for public display
app.get('/api/pages/:pageId', (req, res) => {
  try {
    const { pageId } = req.params;
    const pageData = getPageData(pageId);
    
    if (pageData) {
      res.json({
        success: true,
        page: pageData
      });
    } else {
      // Return default page structure if not found
      const defaultPage = {
        id: pageId,
        name: 'หน้าหลัก',
        elements: [],
        styles: {
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }
      };
      
      res.json({
        success: true,
        page: defaultPage
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving page data'
    });
  }
});

// Reviews helper functions
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

const readReviewsFromFile = () => {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { reviews: [] };
  } catch (error) {
    console.error('Error reading reviews file:', error);
    return { reviews: [] };
  }
};

const writeReviewsToFile = (reviewsData) => {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviewsData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing reviews file:', error);
    return false;
  }
};

// Initialize reviews file
if (!fs.existsSync(REVIEWS_FILE)) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify({ reviews: [] }), 'utf8');
}

// Reviews API routes
app.get('/api/products/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const reviewsData = readReviewsFromFile();
    
    // Filter reviews by productId
    const productReviews = reviewsData.reviews.filter(review => review.productId === productId);
    
    // Sort by date (newest first)
    productReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      reviews: productReviews,
      total: productReviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลรีวิวได้'
    });
  }
});

app.get('/api/products/:productId/user-review', verifyToken, (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const reviewsData = readReviewsFromFile();
    
    // Find existing review
    const existingReview = reviewsData.reviews.find(review => 
      review.productId === productId && review.userId === userId
    );
    
    res.json({
      success: true,
      hasReviewed: !!existingReview,
      review: existingReview || null
    });
  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบข้อมูลรีวิวได้'
    });
  }
});

app.post('/api/products/:productId/reviews', verifyToken, (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'คะแนนต้องอยู่ระหว่าง 1-5'
      });
    }
    
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'รีวิวต้องมีอย่างน้อย 10 ตัวอักษร'
      });
    }
    
    const reviewsData = readReviewsFromFile();
    
    // Check if user already reviewed
    const existingReview = reviewsData.reviews.find(review => 
      review.productId === productId && review.userId === userId
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รีวิวสินค้านี้ไปแล้ว'
      });
    }
    
    // Create new review
    const newReview = {
      id: Date.now().toString(),
      productId,
      userId,
      username,
      rating: parseInt(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      helpful: 0,
      verified: true
    };
    
    // Add to reviews
    reviewsData.reviews.push(newReview);
    
    // Save to file
    if (writeReviewsToFile(reviewsData)) {
      res.json({
        success: true,
        message: 'รีวิวสินค้าสำเร็จ',
        review: newReview
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถบันทึกรีวิวได้'
      });
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งรีวิว'
    });
  }
});

app.post('/api/reviews/:reviewId/helpful', verifyToken, (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const reviewsData = readReviewsFromFile();
    
    // Find review
    const reviewIndex = reviewsData.reviews.findIndex(review => review.id === reviewId);
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรีวิว'
      });
    }
    
    // Check if user already marked this review as helpful
    const review = reviewsData.reviews[reviewIndex];
    if (!review.helpfulUsers) {
      review.helpfulUsers = [];
    }
    
    // Check if user already clicked
    if (review.helpfulUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้กดปุ่มนี้ไปแล้ว'
      });
    }
    
    // Add user to helpfulUsers and increment count
    review.helpfulUsers.push(userId);
    review.helpful += 1;
    
    // Save to file
    if (writeReviewsToFile(reviewsData)) {
      res.json({
        success: true,
        message: 'ขอบคุณที่บอกว่ารีวิวนี้มีประโยชน์',
        helpful: review.helpful,
        hasMarkedHelpful: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถอัปเดตข้อมูลได้'
      });
    }
  } catch (error) {
    console.error('Error marking helpful:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    });
  }
});

// Dashboard Update endpoint (Kunlun Script Compatible)
app.post('/api/dashboard/update', async (req, res) => {
  try {
    const { key, data: requestData } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Missing dashboard key'
      });
    }
    
    if (!requestData) {
      return res.status(400).json({
        success: false,
        message: 'Missing data payload'
      });
    }
    
    // Extract userId from universal key (format: KD_{userId}_UNIVERSAL_{timestamp}_{random})
    const keyParts = key.split('_');
    if (keyParts.length < 2 || keyParts[0] !== 'KD') {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard key format'
      });
    }
    
    const userId = keyParts[1];
    
    // Process and update dashboard data for each player
    const updatedGames = {};
    
    for (const [playerName, playerData] of Object.entries(requestData)) {
      // Detect game from player data structure
      let gameName = 'Unknown';
      
      if (playerData.melee || playerData.sword || playerData.fruit_inventory) {
        gameName = 'Bloxfruit';
      } else if (playerData.pocketMoney !== undefined || playerData.atmMoney !== undefined) {
        gameName = 'Blockspin';
      } else if (playerData.diamonds !== undefined || playerData.rapids !== undefined) {
        gameName = 'PetSimulator99';
      }
      
      // Convert Kunlun data format to dashboard format
      const dashboardPlayerData = {
        ...playerData,
        username: playerName,
        displayName: playerName,
        id: playerData.id || playerName,
        game: gameName,
        discordId: userId,
        timestamp: playerData.updated_at || new Date().toISOString(),
        status: "online",
        sessionProfit: 0,
        stats: {
          totalMoney: playerData.money || playerData.pocketMoney || 0,
          level: parseInt(playerData.level) || 0,
          onlineTime: Date.now()
        },
        // Convert item arrays to dashboard format
        items: [
          ...(playerData.melee || []),
          ...(playerData.sword || []),
          ...(playerData.gun || []),
          ...(playerData.devil_fruit || []),
          ...(playerData.fruit_inventory || []),
          ...(playerData.accessories || [])
        ].map(item => ({
          name: item.name || 'Unknown',
          category: item.category || 'Item',
          image: item.image || '',
          sprite: item.sprite || undefined
        }))
      };
      
      // Update database
      dbManager.updateDashboardData(userId, gameName, {
        [playerName]: dashboardPlayerData
      });
      
      updatedGames[gameName] = true;
    }
    
    console.log(`📡 Dashboard updated for user ${userId}, games: ${Object.keys(updatedGames).join(', ')}`);
    
    res.json({
      success: true,
      message: 'Dashboard data updated successfully',
      updatedGames: Object.keys(updatedGames),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get User Universal Key endpoint
app.get('/api/dashboard/universal-key', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const data = readUsersFromFile();
    const user = data.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has universal key
    if (!user.universalKey) {
      return res.json({
        success: true,
        universalKey: null,
        createdAt: null,
        hasData: false,
        message: 'No universal key found'
      });
    }
    
    // Check if there's dashboard data in database.json
    const dashboardData = dbManager.getDashboardData(userId);
    
    if (!dashboardData) {
      return res.json({
        success: true,
        universalKey: user.universalKey,
        createdAt: user.universalKeyCreatedAt,
        hasData: false,
        message: 'No dashboard data found'
      });
    }
    
    // Return data similar to /api/dashboard/logs
    const allGames = Object.keys(dashboardData);
    const totalPlayers = Object.values(dashboardData).reduce((sum, game) => sum + (game.players ? Object.keys(game.players).length : 0), 0);
    
    res.json({
      success: true,
      universalKey: user.universalKey,
      createdAt: user.universalKeyCreatedAt,
      hasData: true,
      data: dashboardData,
      stats: {
        totalGames: allGames.length,
        totalPlayers: totalPlayers,
        games: allGames
      }
    });
    
  } catch (error) {
    console.error('Error getting Universal Key:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete Account endpoint
app.delete('/api/dashboard/account', verifyToken, (req, res) => {
  try {
    const { key, game, account } = req.query;
    
    if (!key || !game || !account) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: key, game, account'
      });
    }
    
    // Extract userId from universal key (format: KD_{userId}_UNIVERSAL_{timestamp}_{random})
    const keyParts = key.split('_');
    if (keyParts.length < 2 || keyParts[0] !== 'KD') {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard key format'
      });
    }
    
    const userId = keyParts[1];
    
    // Delete account from database
    const success = dbManager.deleteAccount(userId, game, account);
    
    if (success) {
      console.log(`🗑️ Account ${account} deleted from game ${game} for user ${userId}`);
      res.json({
        success: true,
        message: 'Account deleted successfully',
        deletedAccount: account,
        game: game
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard data endpoint
app.get('/api/dashboard/logs', async (req, res) => {
  try {
    const { key, game } = req.query;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Missing dashboard key'
      });
    }
    
    // Extract userId from key (format: KD_{userId}_{gameName}_{timestamp}_{random})
    const keyParts = key.split('_');
    if (keyParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard key format'
      });
    }
    
    const userId = keyParts[1];
    
    // Get dashboard data
    let dashboardData;
    if (game) {
      dashboardData = dbManager.getDashboardData(userId, game);
    } else {
      dashboardData = dbManager.getDashboardData(userId);
    }
    
    if (!dashboardData) {
      return res.json({
        success: false,
        message: 'No dashboard data found',
        data: null
      });
    }
    
    if (game) {
      // Return specific game data
      const players = dashboardData.players || {};
      const playerNames = Object.keys(players);
      
      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          hasData: playerNames.length > 0,
          players: playerNames.length,
          playersData: players,
          stats: dashboardData.stats || {}
        }
      });
    } else {
      // Return all games data
      res.json({
        success: true,
        message: 'All dashboard data retrieved successfully',
        data: dashboardData
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Catch-all handler: send back React's index.html file for SPA routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.originalUrl.startsWith('/api')) {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not built yet. Run "npm run build" first.');
    }
  } else {
    console.log('API 404 handler reached for:', req.method, req.originalUrl);
    res.status(404).json({
      success: false,
      message: 'endpoint not found'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Slumzick API Server running on http://localhost:${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

module.exports = app;