const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kunlun-secret-key-2026';

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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

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
    message: 'Slumzick API is running',
    timestamp: new Date().toISOString()
  });
});

// Get all users (for admin purposes - in production, this should be protected)
app.get('/api/users', (req, res) => {
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

    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      pin,
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
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Extracted token:', token);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ token การยืนยันตัวตน'
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

// Protected route example
app.get('/api/profile', verifyToken, (req, res) => {
  try {
    const data = readUsersFromFile();
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        pin: user.pin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
    });
  }
});

// Export/Download users data
app.get('/api/export/users', (req, res) => {
  try {
    const data = readUsersFromFile();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=slumzick_users.json');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
    });
  }
});

// Voucher endpoints
app.get('/api/vouchers', (req, res) => {
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
app.get('/api/topups/stats', (req, res) => {
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
  });
});

// Stock/Products endpoints
app.get('/api/products', (req, res) => {
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

app.get('/api/products/:id', (req, res) => {
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

    // Generate delivery code (for digital products)
    const deliveryCode = `${product.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
app.get('/api/announcements', (req, res) => {
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
      message: 'API endpoint not found'
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