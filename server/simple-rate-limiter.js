/**
 * Simple Rate Limiter - Working DDoS Protection
 * Rate Limiter แบบง่ายที่ทำงานได้จริง
 * บล็อกเฉพาะ IP ที่ยิง request เกินจริงๆ ไม่กระทบ visitor ปกติ
 */

class SimpleRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 300; // 300 requests per window (ปกติพอ)
    this.burstLimit = options.burstLimit || 30; // max 30 req/sec ก่อน block burst
    this.burstWindowMs = 1000; // 1 second burst window
    this.requests = new Map(); // IP -> array of timestamps
    
    console.log(`🛡️ Simple Rate Limiter initialized: ${this.maxRequests} requests per ${this.windowMs/1000}s, burst: ${this.burstLimit}/s`);
  }

  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const now = Date.now();
      
      // Whitelist: localhost และ private network ผ่านได้เลย
      if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' ||
          ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
        return next();
      }

      // Get or create IP request array
      if (!this.requests.has(ip)) {
        this.requests.set(ip, []);
      }
      
      const ipRequests = this.requests.get(ip);
      
      // Remove old requests outside the window
      const windowStart = now - this.windowMs;
      const validRequests = ipRequests.filter(timestamp => timestamp > windowStart);
      this.requests.set(ip, validRequests);

      // Check burst limit (requests per second) — block เฉพาะ IP ที่ยิงเร็วผิดปกติ
      const burstStart = now - this.burstWindowMs;
      const burstRequests = validRequests.filter(timestamp => timestamp > burstStart);
      if (burstRequests.length >= this.burstLimit) {
        console.log(`🚫 Burst limit exceeded for IP ${ip}: ${burstRequests.length} req/s`);
        return res.status(429).json({
          success: false,
          message: 'Too Many Requests - Burst limit exceeded',
          retryAfter: 1
        });
      }
      
      // Check if window limit exceeded
      if (validRequests.length >= this.maxRequests) {
        console.log(`🚫 Rate limit exceeded for IP ${ip}: ${validRequests.length}/${this.maxRequests}`);
        
        return res.status(429).json({
          success: false,
          message: 'Too Many Requests - Please slow down',
          retryAfter: Math.ceil(this.windowMs / 1000),
          limit: this.maxRequests,
          windowMs: this.windowMs
        });
      }
      
      // Add current request
      validRequests.push(now);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - validRequests.length));
      res.setHeader('X-RateLimit-Reset', new Date(now + this.windowMs).toISOString());
      
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

  // Cleanup old data
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let cleanedCount = 0;
    
    for (const [ip, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(ip);
        cleanedCount++;
      } else if (validRequests.length < requests.length) {
        this.requests.set(ip, validRequests);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  getStats() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let totalActiveRequests = 0;
    let activeIPs = 0;
    
    for (const [ip, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length > 0) {
        totalActiveRequests += validRequests.length;
        activeIPs++;
      }
    }
    
    return {
      activeIPs,
      totalActiveRequests,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      timestamp: now
    };
  }
}

module.exports = SimpleRateLimiter;
