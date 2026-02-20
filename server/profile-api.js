const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kunlun-secret-key-2026';

// Configure multer for avatar uploads
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
      // Use user ID as filename for consistent naming
      const userId = req.user.id;
      const ext = path.extname(file.originalname);
      cb(null, `avatar-${userId}.jpg`);
    }
  }),
  fileFilter: (req, file, cb) => {
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

// Read users data
const readUsersFromFile = () => {
  try {
    if (fs.existsSync(path.join(__dirname, 'users.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
};

// Write users data
const writeUsersToFile = (data) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// Verify JWT token
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

// Get user profile
router.get('/profile', verifyToken, (req, res) => {
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
        avatar: user.avatar,
        pin: user.pin,
        points: user.points || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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

// Update user profile
router.put('/profile', verifyToken, upload.single('avatar'), (req, res) => {
  try {
    const { username, firstName, lastName, email } = req.body;
    const avatarFile = req.file;
    const data = readUsersFromFile();
    const userIndex = data.users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }
    
    // Update user data
    if (username && username.trim()) {
      data.users[userIndex].username = username.trim();
    }
    if (firstName !== undefined) {
      data.users[userIndex].firstName = firstName;
    }
    if (lastName !== undefined) {
      data.users[userIndex].lastName = lastName;
    }
    if (email && email.trim()) {
      data.users[userIndex].email = email.trim();
    }
    
    // Update avatar if file was uploaded
    if (avatarFile) {
      // Delete old avatar if it exists
      const user = data.users[userIndex];
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Set new avatar path
      data.users[userIndex].avatar = `/uploads/avatars/avatar-${req.user.id}.jpg`;
    }
    
    data.users[userIndex].updatedAt = new Date().toISOString();
    
    const success = writeUsersToFile(data);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถบันทึกข้อมูลได้'
      });
    }
    
    res.json({
      success: true,
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: {
        id: data.users[userIndex].id,
        username: data.users[userIndex].username,
        email: data.users[userIndex].email,
        firstName: data.users[userIndex].firstName,
        lastName: data.users[userIndex].lastName,
        avatar: data.users[userIndex].avatar,
        points: data.users[userIndex].points || 0,
        createdAt: data.users[userIndex].createdAt,
        updatedAt: data.users[userIndex].updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
    });
  }
});

module.exports = router;
