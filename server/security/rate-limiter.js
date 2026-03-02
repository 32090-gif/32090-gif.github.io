/**
 * Advanced Rate Limiter with Multiple Strategies
 * ระบบจำกัดอัตราคำขอขั้นสูง หลายกลยุทธ์
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class RateLimiter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Sliding window rate limiting
      slidingWindow: {
        windowMs: options.slidingWindowMs || 15 * 60 * 1000, // 15 minutes
        maxRequests: options.maxRequests || 100,
        cleanupIntervalMs: options.cleanupIntervalMs || 5 * 60 * 1000 // 5 minutes
      },
      
      // Token bucket for burst handling
      tokenBucket: {
        capacity: options.tokenCapacity || 20,
        refillRate: options.refillRate || 1, // tokens per second
        minTokens: options.minTokens || 1
      },
      
      // Fixed window counting
      fixedWindow: {
        windowSizeMs: options.fixedWindowMs || 60 * 1000, // 1 minute
        maxPerWindow: options.maxPerWindow || 30
      },
      
      // Adaptive rate limiting
      adaptive: {
        enableAdaptive: options.enableAdaptive !== false,
        baseLimit: options.baseLimit || 100,
        scaleFactor: options.scaleFactor || 0.5,
        recoveryRate: options.recoveryRate || 0.1
      }
    };

    // Storage for different strategies
    this.slidingWindows = new Map(); // IP -> { requests: [], count: number }
    this.tokenBuckets = new Map(); // IP -> { tokens, lastRefill }
    this.fixedWindows = new Map(); // IP -> { windowStart, count }
    this.adaptiveLimits = new Map(); // IP -> { currentLimit, violations }
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      limitedRequests: 0,
      slidingWindowHits: 0,
      tokenBucketHits: 0,
      fixedWindowHits: 0,
      adaptiveHits: 0,
      violations: 0
    };

    // Start cleanup interval
    this.startCleanup();
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const now = Date.now();
      
      this.stats.totalRequests++;

      // Check all rate limiting strategies
      const results = {
        slidingWindow: this.checkSlidingWindow(ip, now),
        tokenBucket: this.checkTokenBucket(ip, now),
        fixedWindow: this.checkFixedWindow(ip, now)
      };

      // Adaptive rate limiting
      let adaptiveLimit = this.config.adaptive.baseLimit;
      if (this.config.adaptive.enableAdaptive) {
        adaptiveLimit = this.getAdaptiveLimit(ip);
        results.adaptive = this.checkAdaptive(ip, now, adaptiveLimit);
      }

      // Determine if request should be limited
      const isLimited = Object.values(results).some(result => result.limited);
      
      if (isLimited) {
        this.stats.limitedRequests++;
        this.handleRateLimit(req, res, ip, results);
        return;
      }

      // Update all strategies
      this.updateStrategies(ip, now);

      // Emit event for monitoring
      this.emit('request', {
        ip,
        timestamp: now,
        results,
        adaptiveLimit
      });

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

  // Sliding Window Algorithm
  checkSlidingWindow(ip, now) {
    if (!this.slidingWindows.has(ip)) {
      this.slidingWindows.set(ip, {
        requests: [],
        count: 0
      });
    }

    const window = this.slidingWindows.get(ip);
    const windowStart = now - this.config.slidingWindow.windowMs;
    
    // Remove old requests
    window.requests = window.requests.filter(timestamp => timestamp > windowStart);
    window.count = window.requests.length;

    const limited = window.count >= this.config.slidingWindow.maxRequests;
    
    if (limited) {
      this.stats.slidingWindowHits++;
    }

    return {
      limited,
      current: window.count,
      max: this.config.slidingWindow.maxRequests,
      resetTime: window.requests[0] + this.config.slidingWindow.windowMs,
      strategy: 'sliding-window'
    };
  }

  updateSlidingWindow(ip, now) {
    const window = this.slidingWindows.get(ip);
    if (window) {
      window.requests.push(now);
      window.count++;
    }
  }

  // Token Bucket Algorithm
  checkTokenBucket(ip, now) {
    if (!this.tokenBuckets.has(ip)) {
      this.tokenBuckets.set(ip, {
        tokens: this.config.tokenBucket.capacity,
        lastRefill: now
      });
    }

    const bucket = this.tokenBuckets.get(ip);
    
    // Refill tokens
    const timeDiff = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(timeDiff * this.config.tokenBucket.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        bucket.tokens + tokensToAdd,
        this.config.tokenBucket.capacity
      );
      bucket.lastRefill = now;
    }

    const limited = bucket.tokens < this.config.tokenBucket.minTokens;
    
    if (limited) {
      this.stats.tokenBucketHits++;
    }

    return {
      limited,
      tokens: bucket.tokens,
      capacity: this.config.tokenBucket.capacity,
      refillRate: this.config.tokenBucket.refillRate,
      strategy: 'token-bucket'
    };
  }

  updateTokenBucket(ip, now) {
    const bucket = this.tokenBuckets.get(ip);
    if (bucket && bucket.tokens >= this.config.tokenBucket.minTokens) {
      bucket.tokens--;
    }
  }

  // Fixed Window Algorithm
  checkFixedWindow(ip, now) {
    if (!this.fixedWindows.has(ip)) {
      this.fixedWindows.set(ip, {
        windowStart: now,
        count: 0
      });
    }

    const window = this.fixedWindows.get(ip);
    const windowEnd = window.windowStart + this.config.fixedWindow.windowSizeMs;
    
    // Reset window if expired
    if (now >= windowEnd) {
      window.windowStart = now;
      window.count = 0;
    }

    const limited = window.count >= this.config.fixedWindow.maxPerWindow;
    
    if (limited) {
      this.stats.fixedWindowHits++;
    }

    return {
      limited,
      current: window.count,
      max: this.config.fixedWindow.maxPerWindow,
      resetTime: windowEnd,
      strategy: 'fixed-window'
    };
  }

  updateFixedWindow(ip, now) {
    const window = this.fixedWindows.get(ip);
    if (window) {
      window.count++;
    }
  }

  // Adaptive Rate Limiting
  getAdaptiveLimit(ip) {
    if (!this.adaptiveLimits.has(ip)) {
      this.adaptiveLimits.set(ip, {
        currentLimit: this.config.adaptive.baseLimit,
        violations: 0,
        lastViolation: 0,
        recoveryStart: 0
      });
    }

    const adaptive = this.adaptiveLimits.get(ip);
    const now = Date.now();

    // Recovery logic
    if (adaptive.recoveryStart > 0) {
      const timeSinceRecovery = now - adaptive.recoveryStart;
      const recoveryAmount = Math.floor(
        timeSinceRecovery * this.config.adaptive.recoveryRate / 1000
      );
      
      if (recoveryAmount > 0) {
        adaptive.currentLimit = Math.min(
          adaptive.currentLimit + recoveryAmount,
          this.config.adaptive.baseLimit
        );
        adaptive.recoveryStart = now;
      }
    }

    return adaptive.currentLimit;
  }

  checkAdaptive(ip, now, limit) {
    const adaptive = this.adaptiveLimits.get(ip);
    
    // Check other strategies for violations
    const slidingWindowResult = this.checkSlidingWindow(ip, now);
    const tokenBucketResult = this.checkTokenBucket(ip, now);
    
    const hasViolation = slidingWindowResult.limited || tokenBucketResult.limited;
    
    if (hasViolation) {
      adaptive.violations++;
      adaptive.lastViolation = now;
      
      // Reduce limit
      adaptive.currentLimit = Math.max(
        Math.floor(adaptive.currentLimit * this.config.adaptive.scaleFactor),
        10 // Minimum limit
      );
      
      // Start recovery
      adaptive.recoveryStart = now;
      
      this.stats.violations++;
      this.stats.adaptiveHits++;
    }

    const limited = adaptive.currentLimit < this.config.adaptive.baseLimit * 0.3;

    return {
      limited,
      currentLimit: adaptive.currentLimit,
      baseLimit: this.config.adaptive.baseLimit,
      violations: adaptive.violations,
      strategy: 'adaptive'
    };
  }

  updateStrategies(ip, now) {
    this.updateSlidingWindow(ip, now);
    this.updateTokenBucket(ip, now);
    this.updateFixedWindow(ip, now);
  }

  handleRateLimit(req, res, ip, results) {
    // Find the most restrictive limit
    const activeLimits = Object.values(results).filter(result => result.limited);
    const mostRestrictive = activeLimits.reduce((worst, current) => {
      if (!worst) return current;
      // Choose the strategy with the longest reset time
      return (current.resetTime || 0) > (worst.resetTime || 0) ? current : worst;
    }, null);

    const headers = {
      'X-RateLimit-Limit': mostRestrictive.max || 'N/A',
      'X-RateLimit-Remaining': Math.max(0, (mostRestrictive.max || 0) - (mostRestrictive.current || 0)),
      'X-RateLimit-Reset': Math.ceil((mostRestrictive.resetTime || 0) / 1000),
      'X-RateLimit-Strategy': mostRestrictive.strategy,
      'Retry-After': Math.ceil(((mostRestrictive.resetTime || 0) - Date.now()) / 1000)
    };

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Emit violation event
    this.emit('violation', {
      ip,
      timestamp: Date.now(),
      results,
      mostRestrictive,
      userAgent: req.headers['user-agent'],
      path: req.path
    });

    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      strategy: mostRestrictive.strategy,
      retryAfter: headers['Retry-After']
    });
  }

  // Cleanup old data
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      // Clean sliding windows
      for (const [ip, window] of this.slidingWindows.entries()) {
        const windowStart = now - this.config.slidingWindow.windowMs;
        const originalLength = window.requests.length;
        window.requests = window.requests.filter(timestamp => timestamp > windowStart);
        
        if (window.requests.length === 0) {
          this.slidingWindows.delete(ip);
          cleanedCount++;
        } else if (window.requests.length < originalLength) {
          cleanedCount++;
        }
      }

      // Clean fixed windows
      for (const [ip, window] of this.fixedWindows.entries()) {
        const windowEnd = window.windowStart + this.config.fixedWindow.windowSizeMs;
        if (now >= windowEnd + 60000) { // Remove after 1 minute past window end
          this.fixedWindows.delete(ip);
          cleanedCount++;
        }
      }

      // Clean token buckets (remove if inactive for 1 hour)
      for (const [ip, bucket] of this.tokenBuckets.entries()) {
        if (now - bucket.lastRefill > 3600000) {
          this.tokenBuckets.delete(ip);
          cleanedCount++;
        }
      }

      // Clean adaptive limits (remove if no violations for 24 hours)
      for (const [ip, adaptive] of this.adaptiveLimits.entries()) {
        if (adaptive.violations === 0 && now - adaptive.lastViolation > 86400000) {
          this.adaptiveLimits.delete(ip);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.emit('cleanup', { cleanedCount, timestamp: now });
      }
    }, this.config.slidingWindow.cleanupIntervalMs);
  }

  // Get comprehensive statistics
  getStats() {
    return {
      ...this.stats,
      activeSlidingWindows: this.slidingWindows.size,
      activeTokenBuckets: this.tokenBuckets.size,
      activeFixedWindows: this.fixedWindows.size,
      activeAdaptiveLimits: this.adaptiveLimits.size,
      timestamp: Date.now()
    };
  }

  // Get IP-specific information
  getIPInfo(ip) {
    const slidingWindow = this.slidingWindows.get(ip);
    const tokenBucket = this.tokenBuckets.get(ip);
    const fixedWindow = this.fixedWindows.get(ip);
    const adaptive = this.adaptiveLimits.get(ip);

    return {
      ip,
      slidingWindow: slidingWindow ? {
        count: slidingWindow.count,
        requests: slidingWindow.requests.length,
        maxRequests: this.config.slidingWindow.maxRequests
      } : null,
      tokenBucket: tokenBucket ? {
        tokens: tokenBucket.tokens,
        capacity: this.config.tokenBucket.capacity,
        refillRate: this.config.tokenBucket.refillRate
      } : null,
      fixedWindow: fixedWindow ? {
        count: fixedWindow.count,
        maxPerWindow: this.config.fixedWindow.maxPerWindow,
        windowStart: fixedWindow.windowStart,
        resetTime: fixedWindow.windowStart + this.config.fixedWindow.windowSizeMs
      } : null,
      adaptive: adaptive ? {
        currentLimit: adaptive.currentLimit,
        baseLimit: this.config.adaptive.baseLimit,
        violations: adaptive.violations,
        lastViolation: adaptive.lastViolation
      } : null
    };
  }

  // Reset IP data (admin function)
  resetIP(ip) {
    this.slidingWindows.delete(ip);
    this.tokenBuckets.delete(ip);
    this.fixedWindows.delete(ip);
    this.adaptiveLimits.delete(ip);
    
    this.emit('ip-reset', { ip, timestamp: Date.now() });
  }

  // Update configuration
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.emit('config-updated', { config: this.config, timestamp: Date.now() });
  }

  // Export/import data for persistence
  exportData() {
    return {
      slidingWindows: Array.from(this.slidingWindows.entries()),
      tokenBuckets: Array.from(this.tokenBuckets.entries()),
      fixedWindows: Array.from(this.fixedWindows.entries()),
      adaptiveLimits: Array.from(this.adaptiveLimits.entries()),
      stats: this.stats,
      timestamp: Date.now()
    };
  }

  importData(data) {
    if (data.slidingWindows) {
      this.slidingWindows = new Map(data.slidingWindows);
    }
    if (data.tokenBuckets) {
      this.tokenBuckets = new Map(data.tokenBuckets);
    }
    if (data.fixedWindows) {
      this.fixedWindows = new Map(data.fixedWindows);
    }
    if (data.adaptiveLimits) {
      this.adaptiveLimits = new Map(data.adaptiveLimits);
    }
    if (data.stats) {
      this.stats = data.stats;
    }
  }
}

module.exports = RateLimiter;
