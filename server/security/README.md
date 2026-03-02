# Advanced DDoS and Botnet Protection System

ระบบป้องกัน DDoS และ Botnet ขั้นสูงสำหรับเว็บไซต์ของคุณ

## 🛡️ ภาพรวมระบบ

ระบบนี้ประกอบด้วยคอมโพเนนต์ความปลอดภัยหลายส่วนที่ทำงานร่วมกันเพื่อปกป้องเว็บไซต์ของคุณจากภัยคุกคามต่างๆ:

### คอมโพเนนต์หลัก

1. **DDoS Protection** (`ddos-protection.js`) - ป้องกันการโจมตี DDoS
2. **Rate Limiter** (`rate-limiter.js`) - จำกัดอัตราคำขอ
3. **IP Firewall** (`ip-firewall.js`) - ไฟร์วอลล์ IP ขั้นสูง
4. **Request Validator** (`request-validator.js`) - ตรวจสอบและทำความสะอาดคำขอ
5. **Bot Detection** (`bot-detection.js`) - ตรวจจับและท้าทาย Bot
6. **Security Monitor** (`monitoring.js`) - ระบบตรวจสอบและแจ้งเตือน
7. **Security Headers** (`security-headers.js`) - จัดการ Security Headers และ CORS

## 🚀 การติดตั้งและการใช้งาน

### การติดตั้ง Dependencies

```bash
npm install geoip-lite validator
```

### การใช้งานพื้นฐาน

```javascript
const UnifiedSecuritySystem = require('./security/index');

// สร้างระบบความปลอดภัย
const security = new UnifiedSecuritySystem({
  // การตั้งค่าทั่วไป
  securityMode: 'balanced', // 'strict', 'balanced', 'permissive'
  failClosed: true, // บล็อกคำขอถ้าระบบความปลอดภัยล้มเหลว
  
  // การตั้งค่า DDoS Protection
  ddosProtection: {
    maxRequests: 100, // สูงสุด 100 คำขอต่อ 15 นาที
    burstLimit: 20,   // สูงสุด 20 คำขอต่อวินาที
    autoBlockDuration: 30 * 60 * 1000 // บล็อก 30 นาที
  },
  
  // การตั้งค่า Rate Limiter
  rateLimiter: {
    slidingWindowMs: 15 * 60 * 1000, // 15 นาที
    maxRequests: 100,
    tokenCapacity: 20,
    refillRate: 1
  },
  
  // การตั้งค่า IP Firewall
  ipFirewall: {
    autoBlockThreshold: 100,
    geoBlocking: {
      enable: true,
      blockedCountries: ['CN', 'RU'] // บล็อกประเทศ
    }
  },
  
  // การตั้งค่า Bot Detection
  botDetection: {
    enableChallenges: true,
    challengeDifficulty: 'medium',
    enableHoneypot: true
  },
  
  // การตั้งค่า Monitoring
  monitoring: {
    enableAlerts: true,
    webhookURL: 'https://your-webhook-url.com',
    enableFileLogging: true
  },
  
  // การตั้งค่า Security Headers
  securityHeaders: {
    enableCSP: true,
    enableHSTS: true,
    cors: {
      origins: ['https://yourdomain.com'],
      credentials: true
    }
  }
});

// ใช้งาน middleware
app.use(security.middleware());
```

### การใช้งานกับ Express.js

```javascript
const express = require('express');
const UnifiedSecuritySystem = require('./security/index');

const app = express();

// เปิดใช้งานระบบความปลอดภัย
const security = new UnifiedSecuritySystem({
  securityMode: 'strict',
  monitoring: {
    enableAlerts: true,
    webhookURL: process.env.SECURITY_WEBHOOK_URL
  }
});

// ใช้งาน security middleware
app.use(security.middleware());

// Routes ของคุณ
app.get('/', (req, res) => {
  res.json({ message: 'Protected by Kunlun Security System' });
});

// Security API endpoints
app.get('/api/security/stats', (req, res) => {
  res.json(security.getSystemStats());
});

app.get('/api/security/health', (req, res) => {
  res.json(security.getSystemHealth());
});

app.post('/api/security/challenge/:sessionId', (req, res) => {
  const result = security.verifyChallenge(req.params.sessionId, req.body.answer);
  res.json(result);
});

// Manual IP management
app.post('/api/security/block-ip', (req, res) => {
  const success = security.blockIP(req.body.ip, req.body.options);
  res.json({ success });
});

app.post('/api/security/unblock-ip', (req, res) => {
  const success = security.unblockIP(req.body.ip);
  res.json({ success });
});

app.listen(3001, () => {
  console.log('Server running with security protection');
});
```

## 📊 คอมโพเนนต์และฟีเจอร์

### 1. DDoS Protection

- **Sliding Window Rate Limiting**: จำกัดคำขอตามช่วงเวลา
- **Token Bucket Algorithm**: จัดการการระเบิดของคำขอ
- **IP-based Blocking**: บล็อก IP อัตโนมัติ
- **Adaptive Rate Limiting**: ปรับเปลี่ยนขีดจำกัดตามพฤติกรรม

### 2. Rate Limiter

- **Multiple Algorithms**: Sliding window, token bucket, fixed window
- **Adaptive Limiting**: ปรับขีดจำกัดตามการใช้งาน
- **Burst Handling**: จัดการคำขอที่มาพร้อมกัน
- **Per-IP Tracking**: ติดตามแต่ละ IP แยกกัน

### 3. IP Firewall

- **Geographic Blocking**: บล็อกตามประเทศ
- **IP Reputation**: ตรวจสอบความน่าเชื่อถือของ IP
- **Network Analysis**: ตรวจจับ proxy, VPN, Tor
- **Auto-blocking**: บล็อกอัตโนมัติตามพฤติกรรม

### 4. Request Validator

- **XSS Protection**: ป้องกัน XSS attacks
- **SQL Injection Protection**: ป้องกัน SQL injection
- **Path Traversal Protection**: ป้องกัน path traversal
- **Input Sanitization**: ทำความสะอาดข้อมูลที่รับเข้ามา

### 5. Bot Detection

- **Behavioral Analysis**: วิเคราะห์พฤติกรรมผู้ใช้
- **Challenge System**: ท้าทายด้วย puzzle/captcha
- **Honeypot**: ดักจับ bot ด้วย honeypot
- **Machine Learning**: ใช้ ML ในการตรวจจับ (simplified)

### 6. Security Monitor

- **Real-time Monitoring**: ตรวจสอบแบบ real-time
- **Alert System**: แจ้งเตือนผ่าน webhook, email, Slack
- **Metrics Collection**: เก็บข้อมูลสถิติ
- **Health Checks**: ตรวจสอบสถานะระบบ

### 7. Security Headers

- **CSP (Content Security Policy)**: ควบคุมทรัพยากร
- **HSTS (HTTP Strict Transport Security)**: บังคับ HTTPS
- **CORS Management**: จัดการ cross-origin requests
- **Security Headers**: เพิ่ม headers ความปลอดภัยต่างๆ

## 🔧 การตั้งค่าขั้นสูง

### Security Modes

```javascript
// Strict Mode - ความปลอดภัยสูงสุด
const security = new UnifiedSecuritySystem({
  securityMode: 'strict',
  failClosed: true,
  ddosProtection: {
    maxRequests: 50,
    burstLimit: 10
  }
});

// Balanced Mode - สมดุลระหว่างความปลอดภัยและประสิทธิภาพ
const security = new UnifiedSecuritySystem({
  securityMode: 'balanced'
});

// Permissive Mode - ความปลอดภัยน้อยลง
const security = new UnifiedSecuritySystem({
  securityMode: 'permissive',
  failClosed: false
});
```

### Custom Configuration

```javascript
// การตั้งค่า DDoS Protection แบบละเอียด
const security = new UnifiedSecuritySystem({
  ddosProtection: {
    windowMs: 10 * 60 * 1000, // 10 นาที
    maxRequests: 200,
    burstLimit: 30,
    criticalThreshold: 100,
    autoBlockDuration: 60 * 60 * 1000, // 1 ชั่วโมง
    whitelist: ['127.0.0.1', '::1'],
    blacklist: ['192.168.1.100']
  }
});

// การตั้งค่า Geographic Blocking
const security = new UnifiedSecuritySystem({
  ipFirewall: {
    geoBlocking: {
      enable: true,
      blockedCountries: ['CN', 'RU', 'KP'],
      allowedCountries: ['TH', 'US', 'GB'],
      action: 'block' // 'block' หรือ 'monitor'
    }
  }
});

// การตั้งค่า Bot Detection
const security = new UnifiedSecuritySystem({
  botDetection: {
    enableChallenges: true,
    challengeTypes: ['math', 'captcha', 'puzzle'],
    challengeDifficulty: 'hard',
    maxChallengeAttempts: 3,
    honeypotFieldName: 'confirm_email'
  }
});
```

## 📈 Monitoring และ Analytics

### การดูสถิติระบบ

```javascript
// ดูสถิติทั้งหมด
const stats = security.getSystemStats();
console.log('System Stats:', stats);

// ดูสถานะสุขภาพระบบ
const health = security.getSystemHealth();
console.log('System Health:', health);

// สร้างรายงานความปลอดภัย
const report = security.generateSecurityReport();
console.log('Security Report:', report);
```

### การตั้งค่า Alerts

```javascript
const security = new UnifiedSecuritySystem({
  monitoring: {
    enableAlerts: true,
    thresholds: {
      requestsPerMinute: 1000,
      errorRate: 0.05, // 5%
      blockedRequestsRate: 0.1 // 10%
    },
    notifications: {
      enableWebhook: true,
      webhookURL: 'https://hooks.slack.com/...',
      enableEmail: true,
      emailSettings: {
        to: 'admin@yourdomain.com',
        subject: 'Security Alert'
      }
    }
  }
});
```

## 🛠️ API Endpoints

### Security Management API

```javascript
// ดูสถิติระบบ
GET /api/security/stats

// ดูสถานะสุขภาพ
GET /api/security/health

// สร้างรายงานความปลอดภัย
GET /api/security/report

// บล็อก IP ด้วยตนเอง
POST /api/security/block-ip
{
  "ip": "192.168.1.100",
  "options": {
    "reason": "Manual block",
    "duration": 3600000
  }
}

// ปลดบล็อก IP
POST /api/security/unblock-ip
{
  "ip": "192.168.1.100"
}

// ตรวจสอบ challenge
POST /api/security/challenge/:sessionId
{
  "answer": "42"
}

// ดูข้อมูล IP
GET /api/security/ip/:ip
```

## 🔍 การตรวจสอบและ Debugging

### Logging

```javascript
// เปิดใช้งาน logging
const security = new UnifiedSecuritySystem({
  monitoring: {
    enableFileLogging: true,
    logDirectory: './logs',
    logLevel: 'info'
  }
});

// Log files จะถูกสร้างใน:
// - logs/security.log
// - logs/alerts.log
// - logs/ddos.log
// - logs/validation.log
```

### Debug Mode

```javascript
// เปิด debug mode
const security = new UnifiedSecuritySystem({
  global: {
    logLevel: 'debug'
  }
});

// ดูข้อมูล debug
console.log('Debug Info:', security.getSystemStats());
```

## 🚨 Emergency Procedures

### Emergency Mode

```javascript
// เข้าสู่ emergency mode ด้วยตนเอง
security.enterEmergencyMode('DDoS attack detected');

// ออกจาก emergency mode
security.exitEmergencyMode();

// ตรวจสอบ emergency mode
const stats = security.getSystemStats();
console.log('Emergency Mode:', stats.system.emergencyMode);
```

### Manual IP Management

```javascript
// บล็อก IP ทันที
security.blockIP('192.168.1.100', {
  reason: 'Suspicious activity',
  severity: 'high',
  duration: 24 * 60 * 60 * 1000 // 24 ชั่วโมง
});

// ปลดบล็อก IP
security.unblockIP('192.168.1.100');

// เพิ่ม IP ใน whitelist
security.components.ipFirewall.addToWhitelist('192.168.1.50');

// เพิ่ม IP ใน blacklist
security.components.ipFirewall.addToBlacklist('192.168.1.200');
```

## 📋 Best Practices

### 1. Configuration Recommendations

- **Production**: ใช้ `securityMode: 'strict'`
- **Development**: ใช้ `securityMode: 'balanced'`
- **Testing**: ใช้ `securityMode: 'permissive'`

### 2. Performance Considerations

- เปิดใช้งานเฉพาะคอมโพเนนต์ที่จำเป็น
- ตั้งค่า thresholds ให้เหมาะสมกับ traffic ของคุณ
- ใช้ caching สำหรับ IP reputation checks

### 3. Monitoring

- ตั้งค่า alerts สำหรับ critical events
- ตรวจสอบ logs เป็นประจำ
- ตั้งค่า webhook สำหรับ real-time notifications

### 4. Maintenance

- อัปเดต blocked IPs lists เป็นประจำ
- ทำความสะอาด old data เป็นระยะ
- ตรวจสอบและปรับปรุง configurations

## 🔧 Troubleshooting

### Common Issues

1. **High False Positive Rate**
   - ลดค่า thresholds
   - เพิ่ม IPs ใน whitelist
   - ปรับ security mode เป็น 'permissive'

2. **Performance Issues**
   - ปิดคอมโพเนนต์ที่ไม่จำเป็น
   - ลด monitoring frequency
   - ใช้ caching

3. **Legitimate Users Blocked**
   - ตรวจสอบ blocked IPs list
   - เพิ่ม legitimate IPs ใน whitelist
   - ปรับ rate limits

### Debug Information

```javascript
// ดูข้อมูลทั้งหมดสำหรับ debugging
const debugInfo = {
  config: security.exportConfiguration(),
  stats: security.getSystemStats(),
  health: security.getSystemHealth(),
  report: security.generateSecurityReport()
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

## 📞 Support

หากพบปัญหาหรือมีคำถาม:

1. ตรวจสอบ logs ใน `logs/` directory
2. ดูสถานะระบบที่ `/api/security/health`
3. สร้างรายงานที่ `/api/security/report`
4. ติดต่อทีมงาน security

## 📄 License

ระบบนี้พัฒนาขึ้นสำหรับการป้องกันเว็บไซต์ สามารถนำไปปรับใช้ได้ตามความเหมาะสม

---

**⚠️ Important**: อย่าลืมทดสอบระบบในสภาพแวดล้อม development ก่อนนำไปใช้ใน production!
