const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

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
app.use(express.json());

// Admin: Create new user
app.post('/api/admin/users', (req, res) => {
  try {
    const { username, email, password, firstName, lastName, points } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }
    
    const data = readUsersFromFile();
    
    // Check if username or email already exists
    const existingUser = data.users.find(u => 
      u.username === username || u.email === email
    );
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว'
      });
    }
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      pin: '1234', // Default PIN
      points: points || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    
    const success = writeUsersToFile(data);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถบันทึกข้อมูลได้'
      });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้ใหม่สำเร็จ',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
    });
  }
});

app.listen(PORT, () => {
  console.log(`User creation service running on port ${PORT}`);
});
