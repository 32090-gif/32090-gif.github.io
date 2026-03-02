/**
 * Security Integration for Existing Server
 * การเชื่อมต่อระบบความปลอดภัยกับ Server ที่มีอยู่แล้ว
 */

const UnifiedSecuritySystem = require('./security/index');

// สร้างระบบความปลอดภัย
const security = new UnifiedSecuritySystem({
  // โหมดความปลอดภัย - balanced เหมาะสำหรับการใช้งานทั่วไป
  securityMode: 'balanced',
  failClosed: false, // ไม่บล็อกคำขอถ้าระบบความปลอดภัยล้มเหลว
  
  // DDoS Protection
  ddosProtection: {
    maxRequests: 100, // สูงสุด 100 คำขอต่อ 15 นาที
    burstLimit: 20,   // สูงสุด 20 คำขอต่อวินาที
    autoBlockDuration: 30 * 60 * 1000, // บล็อก 30 นาที
    whitelist: ['127.0.0.1', '::1', 'localhost'] // อนุญาต localhost
  },
  
  // Rate Limiter
  rateLimiter: {
    slidingWindowMs: 15 * 60 * 1000, // 15 นาที
    maxRequests: 100,
    tokenCapacity: 20,
    refillRate: 1,
    enableAdaptive: true
  },
  
  // IP Firewall
  ipFirewall: {
    autoBlockThreshold: 100,
    autoBlockDuration: 30 * 60 * 1000,
    geoBlocking: {
      enable: false, // ปิด geo blocking ไว้ก่อน
      blockedCountries: []
    },
    reputation: {
      enable: false // ปิด reputation check ไว้ก่อน
    }
  },
  
  // Request Validator
  requestValidator: {
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    enableXSSProtection: true,
    enableSQLInjectionProtection: true,
    enablePathTraversalProtection: true,
    enableCommandInjectionProtection: true
  },
  
  // Bot Detection
  botDetection: {
    enableChallenges: true,
    challengeDifficulty: 'medium',
    enableHoneypot: true,
    honeypotFieldName: 'website_verification'
  },
  
  // Monitoring
  monitoring: {
    enableAlerts: true,
    enableFileLogging: true,
    logDirectory: './logs',
    thresholds: {
      requestsPerMinute: 500,
      errorRate: 0.05,
      blockedRequestsRate: 0.1
    }
  },
  
  // Security Headers
  securityHeaders: {
    enableCSP: true,
    enableHSTS: false, // ปิด HSTS ไว้ถ้ายังไม่มี HTTPS
    enableFrameOptions: true,
    enableContentTypeOptions: true,
    cors: {
      enable: true,
      origins: [
        'http://localhost:8081', 
        'http://localhost:8082', 
        'http://localhost:3000',
        'https://getkunlun.me',
        'https://www.getkunlun.me'
      ],
      credentials: true
    }
  }
});

// Export สำหรับใช้ใน server.js
module.exports = security;

// Helper functions สำหรับการใช้งาน
module.exports.helpers = {
  // API endpoints สำหรับ security management
  setupSecurityAPI: (app) => {
    // ดูสถิติระบบ
    app.get('/api/security/stats', (req, res) => {
      try {
        const stats = security.getSystemStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get security stats',
          error: error.message
        });
      }
    });

    // ดูสถานะสุขภาพระบบ
    app.get('/api/security/health', (req, res) => {
      try {
        const health = security.getSystemHealth();
        res.json({
          success: true,
          data: health
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get system health',
          error: error.message
        });
      }
    });

    // สร้างรายงานความปลอดภัย
    app.get('/api/security/report', (req, res) => {
      try {
        const report = security.generateSecurityReport();
        res.json({
          success: true,
          data: report
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate security report',
          error: error.message
        });
      }
    });

    // บล็อก IP ด้วยตนเอง
    app.post('/api/security/block-ip', (req, res) => {
      try {
        const { ip, options = {} } = req.body;
        
        if (!ip) {
          return res.status(400).json({
            success: false,
            message: 'IP address is required'
          });
        }

        const success = security.blockIP(ip, {
          reason: options.reason || 'Manual block',
          severity: options.severity || 'medium',
          duration: options.duration || 60 * 60 * 1000, // 1 hour
          source: 'manual'
        });

        res.json({
          success,
          message: success ? 'IP blocked successfully' : 'Failed to block IP'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to block IP',
          error: error.message
        });
      }
    });

    // ปลดบล็อก IP
    app.post('/api/security/unblock-ip', (req, res) => {
      try {
        const { ip } = req.body;
        
        if (!ip) {
          return res.status(400).json({
            success: false,
            message: 'IP address is required'
          });
        }

        const success = security.unblockIP(ip);

        res.json({
          success,
          message: success ? 'IP unblocked successfully' : 'Failed to unblock IP'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to unblock IP',
          error: error.message
        });
      }
    });

    // ตรวจสอบ challenge
    app.post('/api/security/challenge/:sessionId', (req, res) => {
      try {
        const { sessionId } = req.params;
        const { answer } = req.body;

        if (!answer) {
          return res.status(400).json({
            success: false,
            message: 'Answer is required'
          });
        }

        const result = security.verifyChallenge(sessionId, answer);

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to verify challenge',
          error: error.message
        });
      }
    });

    // ดูข้อมูล IP
    app.get('/api/security/ip/:ip', (req, res) => {
      try {
        const { ip } = req.params;
        const ipInfo = security.components.ipFirewall?.getIPInfo(ip);

        res.json({
          success: true,
          data: ipInfo
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get IP info',
          error: error.message
        });
      }
    });

    // Emergency mode controls
    app.post('/api/security/emergency-mode', (req, res) => {
      try {
        const { action, reason } = req.body;

        if (action === 'enter') {
          security.enterEmergencyMode(reason || 'Manual activation');
        } else if (action === 'exit') {
          security.exitEmergencyMode();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use "enter" or "exit"'
          });
        }

        res.json({
          success: true,
          message: `Emergency mode ${action}ed successfully`
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to control emergency mode',
          error: error.message
        });
      }
    });

    // อัปเดต configuration
    app.put('/api/security/config', (req, res) => {
      try {
        const { component, config } = req.body;

        if (!component || !config) {
          return res.status(400).json({
            success: false,
            message: 'Component and config are required'
          });
        }

        const success = security.updateConfiguration(component, config);

        res.json({
          success,
          message: success ? 'Configuration updated successfully' : 'Failed to update configuration'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to update configuration',
          error: error.message
        });
      }
    });

    // Enable/Disable components
    app.post('/api/security/components/:component/toggle', (req, res) => {
      try {
        const { component } = req.params;
        const { enable } = req.body;

        if (typeof enable !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'Enable field must be boolean'
          });
        }

        const success = enable ? 
          security.enableComponent(component) : 
          security.disableComponent(component);

        res.json({
          success,
          message: `Component ${component} ${enable ? 'enabled' : 'disabled'} successfully`
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to toggle component',
          error: error.message
        });
      }
    });
  },

  // Middleware สำหรับการตรวจสอบสิทธิ์ admin
  requireAdmin: (req, res, next) => {
    // ตรวจสอบว่าเป็น admin request หรือไม่
    const isAdmin = req.headers['x-admin-key'] === 'kunlun-admin-2026' ||
                   req.query.admin === 'true' ||
                   (req.user && req.user.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  },

  // ฟังก์ชันสำหรับ log security events
  logSecurityEvent: (event, data) => {
    console.log(`🔒 SECURITY: ${event}`, data);
    
    // ส่งไปยัง monitoring system ถ้ามี
    if (security.components.monitoring) {
      security.components.monitoring.emit('security-event', { event, data });
    }
  },

  // ฟังก์ชันสำหรับตรวจสอบความปลอดภัยก่อน processing
  preProcessCheck: (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // ตรวจสอบว่า IP ถูกบล็อกหรือไม่
    if (security.components.ipFirewall) {
      const blockResult = security.components.ipFirewall.checkIPBlock(ip, req);
      if (blockResult.blocked) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          reason: blockResult.reason
        });
      }
    }

    next();
  }
};

// Export ค่าคอนฟิกูเรชันสำหรับการอ้างอิง
module.exports.config = {
  securityModes: ['strict', 'balanced', 'permissive'],
  defaultConfig: security.config,
  availableComponents: Object.keys(security.components)
};

// ฟังก์ชันสำหรับการเริ่มต้นระบบ
module.exports.initialize = async (app) => {
  try {
    console.log('🛡️ Initializing Security Integration...');
    
    // เพิ่ม security middleware เป็นอันดับแรก
    app.use(security.middleware());
    
    // Setup security API endpoints
    module.exports.helpers.setupSecurityAPI(app);
    
    console.log('✅ Security Integration initialized successfully');
    console.log(`📊 Active Components: ${Object.keys(security.components).length}`);
    console.log(`🔒 Security Mode: ${security.config ? security.config.global.securityMode : 'unknown'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Security Integration:', error);
    return false;
  }
};
