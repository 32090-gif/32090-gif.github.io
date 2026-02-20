const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'kunlun-secret-key-2026';

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

// Profile helper functions
const getUserProfile = (userId) => {
  try {
    const data = readUsersFromFile();
    const user = data.users.find(u => u.id === userId);
    
    if (!user) return null;
    
    // Return safe profile data
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      avatar: user.avatar || null,
      pin: user.pin,
      points: user.points || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

const updateUserProfile = (userId, updates) => {
  try {
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;
    
    // Update allowed fields
    const allowedFields = ['username', 'email', 'firstName', 'lastName', 'avatar'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        data.users[userIndex][field] = updates[field];
      }
    });
    
    data.users[userIndex].updatedAt = new Date().toISOString();
    
    const success = writeUsersToFile(data);
    if (!success) return null;
    
    return getUserProfile(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

const processAvatarUpload = (avatarFile, userId) => {
  try {
    if (!avatarFile) return null;
    
    // Define avatar paths
    const avatarName = `avatar-${userId}.jpg`;
    const oldPath = path.join(__dirname, avatarFile.path);
    const newPath = path.join(__dirname, 'uploads', 'avatars', avatarName);
    
    // Delete old avatar if it exists
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath);
    }
    
    // Move and rename uploaded file
    fs.renameSync(oldPath, newPath);
    
    return `/uploads/avatars/${avatarName}`;
  } catch (error) {
    console.error('Error processing avatar upload:', error);
    return null;
  }
};

// Data file paths
const DATA_FILE = path.join(__dirname, 'users.json');

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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ token การยืนยันตัวตน'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Profile API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Profile Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`👤 Profile endpoints available:`);
  console.log(`   GET  /api/user/profile - Get current user profile`);
  console.log(`   PUT  /api/user/profile - Update current user profile`);
  console.log(`   GET  /api/user/:userId/profile - Get public profile`);
  console.log(`   DELETE /api/user/avatar - Delete avatar`);
});

module.exports = app;
