# Slumzick API Documentation

## 🚀 API Endpoints

### Base URL
```
http://localhost:3001/api
```

## Authentication Endpoints

### 1. Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Slumzick API is running",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

### 2. Register User
```http
POST /api/register
```
**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "user": {
    "id": "uuid-here",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "pin": "1234"
  },
  "token": "jwt-token-here"
}
```

### 3. Login User
```http
POST /api/login
```
**Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "user": {
    "id": "uuid-here",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "pin": "1234"
  },
  "token": "jwt-token-here"
}
```

## Protected Endpoints (Requires Authorization Header)

### 4. Get User Profile
```http
GET /api/profile
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "pin": "1234",
    "createdAt": "2026-02-08T10:30:00.000Z"
  }
}
```

## Admin Endpoints

### 5. Get All Users
```http
GET /api/users
```

### 6. Export Users Data
```http
GET /api/export/users
```
Downloads JSON file with all user data.

## 🛠️ How to Use

### Starting the API Server:
```bash
cd server
npm install
npm run dev
```

### Example Usage with Fetch:

```javascript
// Register
const register = async (userData) => {
  const response = await fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return await response.json();
};

// Login
const login = async (credentials) => {
  const response = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  return await response.json();
};

// Get Profile (Protected)
const getProfile = async (token) => {
  const response = await fetch('http://localhost:3001/api/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 🔐 Security Features
- Password hashing with bcrypt
- JWT token authentication
- CORS enabled
- Input validation
- Error handling

## 📁 Data Storage
- Users stored in `server/users.json`
- Passwords are hashed (never stored in plain text)
- Unique user IDs generated with UUID