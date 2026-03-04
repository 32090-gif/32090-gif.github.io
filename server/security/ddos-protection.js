/**
 * Advanced DDoS and Botnet Protection System
 * ระบบป้องกัน DDoS และ Botnet ขั้นสูง
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class DDoSProtection {
  constructor(options = {}) {
    // การตั้งค่าพื้นฐาน
    this.config = {
      // Rate limiting ต่อ IP
      rateLimit: {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 นาที
        maxRequests: options.maxRequests || 100, // สูงสุด 100 คำขอต่อ 15 นาที
        burstLimit: options.burstLimit || 20, // สูงสุด 20 คำขอต่อวินาที
        criticalThreshold: options.criticalThreshold || 50 // เกณฑ์วิกฤต
      },
      
      // IP Blocking
      ipBlocking: {
        autoBlockDuration: options.autoBlockDuration || 30 * 60 * 1000, // 30 นาที
        permanentBlockThreshold: options.permanentBlockThreshold || 1000, // บล็อกถาวรถ้าเกิน 1000 ครั้ง
        suspiciousThreshold: options.suspiciousThreshold || 200
      },
      
      // Bot Detection
      botDetection: {
        enableChallenge: options.enableChallenge !== false,
        challengeDifficulty: options.challengeDifficulty || 'medium',
        honeypotEnabled: options.honeypotEnabled !== false
      },
      
      // Monitoring
      monitoring: {
        enableLogging: options.enableLogging !== false,
        alertThreshold: options.alertThreshold || 10,
        logFile: options.logFile || path.join(__dirname, '../logs/security.log')
      }
    };

    // Storage สำหรับ tracking
    this.ipData = new Map(); // ข้อมูลต่อ IP
    this.blockedIPs = new Map(); // IP ที่ถูกบล็อก
    this.suspiciousIPs = new Map(); // IP ที่น่าสงสัย
    this.challenges = new Map(); // Challenge สำหรับ bot
    this.whitelist = new Set(options.whitelist || []); // IP ที่อนุญาต
    this.blacklist = new Set(options.blacklist || []); // IP ที่บล็อกถาวร

    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      challengesIssued: 0,
      lastCleanup: Date.now()
    };

    // Initialize
    this.init();
  }

  init() {
    // สร้าง logs directory ถ้ายังไม่มี
    const logDir = path.dirname(this.config.monitoring.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Load existing blocked IPs
    this.loadBlockedIPs();

    // Setup periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // ทำความสะอาดทุก 5 นาที

    console.log('🛡️ DDoS Protection System initialized');
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const now = Date.now();
      
      this.stats.totalRequests++;

      // Check whitelist first
      if (this.whitelist.has(clientIP)) {
        return next();
      }

      // Check blacklist
      if (this.blacklist.has(clientIP)) {
        this.blockRequest(req, res, 'IP permanently blocked');
        return;
      }

      // Check if IP is currently blocked
      if (this.isIPBlocked(clientIP)) {
        this.blockRequest(req, res, 'IP temporarily blocked');
        return;
      }

      // Update IP tracking data
      this.updateIPData(clientIP, req, now);

      // Check rate limiting
      if (this.checkRateLimit(clientIP, now)) {
        this.handleRateLimitExceeded(req, res, clientIP);
        return;
      }

      // Bot detection
      if (this.config.botDetection.enableChallenge && this.detectBot(req, clientIP)) {
        this.handleBotDetection(req, res, clientIP);
        return;
      }

      // Check for suspicious patterns
      if (this.checkSuspiciousPatterns(req, clientIP)) {
        this.handleSuspiciousActivity(req, res, clientIP);
        return;
      }

      // Request looks legitimate
      next();
    };
  }

  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  updateIPData(ip, req, now) {
    if (!this.ipData.has(ip)) {
      this.ipData.set(ip, {
        firstSeen: now,
        lastSeen: now,
        requestCount: 0,
        requests: [],
        userAgent: req.headers['user-agent'] || '',
        endpoints: new Set(),
        suspiciousScore: 0
      });
    }

    const data = this.ipData.get(ip);
    data.lastSeen = now;
    data.requestCount++;
    data.requests.push(now);
    data.endpoints.add(req.path);

    // Keep only recent requests (within window)
    const windowStart = now - this.config.rateLimit.windowMs;
    data.requests = data.requests.filter(time => time > windowStart);
  }

  checkRateLimit(ip, now) {
    const data = this.ipData.get(ip);
    if (!data) return false;

    const recentRequests = data.requests.filter(time => 
      now - time < this.config.rateLimit.windowMs
    );

    // Check total requests in window
    if (recentRequests.length > this.config.rateLimit.maxRequests) {
      return true;
    }

    // Check burst requests (requests per second)
    const oneSecondAgo = now - 1000;
    const burstRequests = recentRequests.filter(time => time > oneSecondAgo);
    
    if (burstRequests.length > this.config.rateLimit.burstLimit) {
      return true;
    }

    return false;
  }

  detectBot(req, ip) {
    const userAgent = req.headers['user-agent'] || '';
    const data = this.ipData.get(ip);
    
    let botScore = 0;

    // เฉพาะ bot/scraper/automation จริงๆ — ไม่ block curl/python/node/wget
    // เพราะ visitor ปกติ หรือ API client ก็ใช้ได้
    const botPatterns = [
      /\bbot\b/i, /\bcrawler\b/i, /\bspider\b/i, /\bscraper\b/i,
      /\bselenium\b/i, /\bphantom\b/i, /\bheadless\b/i, /\bchromeless\b/i,
      /\blwp\b/i, /\bmechanize\b/i
    ];

    botPatterns.forEach(pattern => {
      if (pattern.test(userAgent)) botScore += 30;
    });

    // Empty user agent เท่านั้นที่น่าสงสัย
    if (!userAgent || userAgent.length < 5) botScore += 20;

    // Missing accept-language เป็นสัญญาณเล็กน้อย
    if (!req.headers['accept-language']) botScore += 8;

    // Check request patterns — เฉพาะ high-volume จริงๆ
    if (data) {
      // Too many different endpoints in short time
      if (data.endpoints.size > 50) botScore += 25;
      
      // ยิง request เร็วมากผิดปกติ (> 100 req/min)
      const recentRequests = data.requests.filter(time => 
        Date.now() - time < 60000
      );
      if (recentRequests.length > 100) botScore += 20;
    }

    return botScore >= 50; // Threshold สูงขึ้นเพื่อลด false positive
  }

  checkSuspiciousPatterns(req, ip) {
    const data = this.ipData.get(ip);
    if (!data) return false;

    let suspiciousScore = 0;

    // Check for SQL injection patterns
    const sqlPatterns = [/union\s+select/i, /or\s+1\s*=\s*1/i, /drop\s+table/i];
    const url = req.url.toLowerCase();
    sqlPatterns.forEach(pattern => {
      if (pattern.test(url)) suspiciousScore += 40;
    });

    // Check for XSS patterns
    const xssPatterns = [/<script/i, /javascript:/i, /onload=/i, /onerror=/i];
    xssPatterns.forEach(pattern => {
      if (pattern.test(url)) suspiciousScore += 30;
    });

    // Check for path traversal
    if (url.includes('../') || url.includes('..\\')) suspiciousScore += 35;

    // Check for excessive request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) suspiciousScore += 25; // 10MB

    // Update suspicious score
    data.suspiciousScore += suspiciousScore;

    return data.suspiciousScore >= 100;
  }

  handleRateLimitExceeded(req, res, ip) {
    this.stats.blockedRequests++;
    
    // Auto-block IP if exceeded threshold
    const data = this.ipData.get(ip);
    if (data && data.requestCount > this.config.ipBlocking.criticalThreshold) {
      this.blockIP(ip, this.config.ipBlocking.autoBlockDuration);
      this.logSecurity(`IP ${ip} auto-blocked for rate limit violation`);
    }

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
    });
  }

  handleBotDetection(req, res, ip) {
    this.stats.challengesIssued++;
    
    // Issue challenge
    const challenge = this.generateChallenge();
    this.challenges.set(ip, {
      challenge,
      timestamp: Date.now(),
      attempts: 0
    });

    res.status(403).json({
      error: 'Bot Detected',
      message: 'Please complete the challenge to continue',
      challenge: challenge,
      challengeEndpoint: '/api/security/challenge'
    });
  }

  handleSuspiciousActivity(req, res, ip) {
    this.stats.suspiciousRequests++;
    
    const data = this.ipData.get(ip);
    if (data && data.suspiciousScore > this.config.ipBlocking.suspiciousThreshold) {
      this.blockIP(ip, this.config.ipBlocking.autoBlockDuration);
      this.logSecurity(`IP ${ip} blocked for suspicious activity`);
    }

    res.status(403).json({
      error: 'Access Denied',
      message: 'Suspicious activity detected'
    });
  }

  blockIP(ip, duration) {
    const unblockTime = Date.now() + duration;
    this.blockedIPs.set(ip, unblockTime);
    
    // Save to file
    this.saveBlockedIPs();
    
    this.logSecurity(`IP ${ip} blocked until ${new Date(unblockTime).toISOString()}`);
  }

  isIPBlocked(ip) {
    const unblockTime = this.blockedIPs.get(ip);
    if (!unblockTime) return false;
    
    if (Date.now() > unblockTime) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  generateChallenge() {
    const difficulty = this.config.botDetection.challengeDifficulty;
    let challenge;
    
    switch (difficulty) {
      case 'easy':
        challenge = {
          type: 'math',
          question: `What is ${Math.floor(Math.random() * 10) + 1} + ${Math.floor(Math.random() * 10) + 1}?`,
          answer: null // Will be calculated on verification
        };
        challenge.answer = parseInt(challenge.question.match(/\d+/g).reduce((a, b) => parseInt(a) + parseInt(b)));
        break;
        
      case 'medium':
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        challenge = {
          type: 'math',
          question: `What is ${num1} × ${num2}?`,
          answer: num1 * num2
        };
        break;
        
      case 'hard':
        challenge = {
          type: 'hash',
          question: 'Compute SHA256 of: ' + crypto.randomBytes(8).toString('hex'),
          prefix: crypto.randomBytes(4).toString('hex'),
          answer: null // Client must find hash with this prefix
        };
        break;
        
      default:
        challenge = { type: 'simple', question: 'Are you human?', answer: 'yes' };
    }
    
    return challenge;
  }

  blockRequest(req, res, reason) {
    this.stats.blockedRequests++;
    this.logSecurity(`Request blocked: ${reason} - IP: ${this.getClientIP(req)} - ${req.method} ${req.url}`);
    
    res.status(403).json({
      error: 'Access Denied',
      message: 'Your access has been restricted'
    });
  }

  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up old IP data
    for (const [ip, data] of this.ipData.entries()) {
      if (now - data.lastSeen > 24 * 60 * 60 * 1000) { // 24 hours
        this.ipData.delete(ip);
        cleanedCount++;
      }
    }

    // Clean up expired blocks
    for (const [ip, unblockTime] of this.blockedIPs.entries()) {
      if (now > unblockTime) {
        this.blockedIPs.delete(ip);
        cleanedCount++;
      }
    }

    // Clean up expired challenges
    for (const [ip, challenge] of this.challenges.entries()) {
      if (now - challenge.timestamp > 10 * 60 * 1000) { // 10 minutes
        this.challenges.delete(ip);
        cleanedCount++;
      }
    }

    this.stats.lastCleanup = now;
    
    if (cleanedCount > 0) {
      this.logSecurity(`Cleanup completed: removed ${cleanedCount} expired entries`);
    }
  }

  logSecurity(message) {
    if (!this.config.monitoring.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SECURITY: ${message}\n`;
    
    fs.appendFile(this.config.monitoring.logFile, logMessage, (err) => {
      if (err) console.error('Failed to write security log:', err);
    });
    
    console.log(`🛡️ ${message}`);
  }

  saveBlockedIPs() {
    try {
      const data = {
        blockedIPs: Array.from(this.blockedIPs.entries()),
        timestamp: Date.now()
      };
      fs.writeFileSync(
        path.join(__dirname, '../data/blocked-ips.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('Failed to save blocked IPs:', error);
    }
  }

  loadBlockedIPs() {
    try {
      const filePath = path.join(__dirname, '../data/blocked-ips.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.blockedIPs) {
          this.blockedIPs = new Map(data.blockedIPs);
        }
      }
    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
    }
  }

  // Challenge verification endpoint
  verifyChallenge(ip, answer) {
    const challenge = this.challenges.get(ip);
    if (!challenge) return false;
    
    const isValid = challenge.challenge.answer === answer;
    
    if (isValid) {
      this.challenges.delete(ip);
      // Mark IP as verified for a period
      const data = this.ipData.get(ip);
      if (data) {
        data.verified = true;
        data.verifiedUntil = Date.now() + 60 * 60 * 1000; // 1 hour
      }
    } else {
      challenge.attempts++;
      if (challenge.attempts >= 3) {
        this.blockIP(ip, this.config.ipBlocking.autoBlockDuration);
        this.challenges.delete(ip);
      }
    }
    
    return isValid;
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      activeIPs: this.ipData.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      activeChallenges: this.challenges.size
    };
  }

  // Manual IP management
  manuallyBlockIP(ip, duration = 24 * 60 * 60 * 1000) {
    this.blockIP(ip, duration);
    this.logSecurity(`IP ${ip} manually blocked by administrator`);
  }

  manuallyUnblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.saveBlockedIPs();
    this.logSecurity(`IP ${ip} manually unblocked by administrator`);
  }

  addToWhitelist(ip) {
    this.whitelist.add(ip);
    this.logSecurity(`IP ${ip} added to whitelist`);
  }

  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
    this.logSecurity(`IP ${ip} removed from whitelist`);
  }

  addToBlacklist(ip) {
    this.blacklist.add(ip);
    this.blockIP(ip, 365 * 24 * 60 * 60 * 1000); // 1 year
    this.logSecurity(`IP ${ip} added to permanent blacklist`);
  }

  removeFromBlacklist(ip) {
    this.blacklist.delete(ip);
    this.blockedIPs.delete(ip);
    this.saveBlockedIPs();
    this.logSecurity(`IP ${ip} removed from blacklist`);
  }
}

module.exports = DDoSProtection;
