/**
 * Simple Rate Limiter - Working DDoS Protection
 * Rate Limiter แบบง่ายที่ทำงานได้จริง
 */

class SimpleRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100; // 100 requests per window
    this.requests = new Map(); // IP -> array of timestamps
    
    console.log(`🛡️ Simple Rate Limiter initialized: ${this.maxRequests} requests per ${this.windowMs/1000}s`);
  }

  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const now = Date.now();
      
      // Get or create IP request array
      if (!this.requests.has(ip)) {
        this.requests.set(ip, []);
      }
      
      const ipRequests = this.requests.get(ip);
      
      // Remove old requests outside the window
      const windowStart = now - this.windowMs;
      const validRequests = ipRequests.filter(timestamp => timestamp > windowStart);
      this.requests.set(ip, validRequests);
      
      // Check if limit exceeded
      if (validRequests.length >= this.maxRequests) {
        console.log(`🚫 Rate limit exceeded for IP ${ip}: ${validRequests.length}/${this.maxRequests}`);
        
        return res.status(429).json({
          success: false,
          message: 'Too Many Requests',
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
