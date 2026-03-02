/**
 * Advanced IP Firewall and Blocking System
 * ระบบไฟร์วอลล์และการบล็อก IP ขั้นสูง
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const geoip = require('geoip-lite'); // ต้องติดตั้ง: npm install geoip-lite

class IPFirewall {
  constructor(options = {}) {
    this.config = {
      // Database files
      databasePath: options.databasePath || path.join(__dirname, '../data/ip-firewall.json'),
      geoDatabasePath: options.geoDatabasePath || path.join(__dirname, '../data/geo-rules.json'),
      
      // Blocking rules
      autoBlock: {
        enable: options.autoBlock !== false,
        duration: options.autoBlockDuration || 30 * 60 * 1000, // 30 minutes
        threshold: options.autoBlockThreshold || 100, // requests
        timeWindow: options.autoBlockTimeWindow || 5 * 60 * 1000, // 5 minutes
        escalationThreshold: options.escalationThreshold || 500, // for permanent block
        suspiciousThreshold: options.suspiciousThreshold || 50
      },
      
      // Geographic blocking
      geoBlocking: {
        enable: options.geoBlocking !== false,
        blockedCountries: options.blockedCountries || [],
        allowedCountries: options.allowedCountries || [],
        action: options.geoAction || 'block' // 'block' or 'monitor'
      },
      
      // IP reputation
      reputation: {
        enable: options.reputationCheck !== false,
        sources: options.reputationSources || ['spamhaus', 'abuseipdb'],
        threshold: options.reputationThreshold || 50,
        cacheDuration: options.reputationCacheDuration || 24 * 60 * 60 * 1000 // 24 hours
      },
      
      // Network analysis
      networkAnalysis: {
        enable: options.networkAnalysis !== false,
        privateNetworks: options.allowPrivateNetworks !== false,
        detectProxies: options.detectProxies !== false,
        detectVPNs: options.detectVPNs !== false,
        detectTor: options.detectTor !== false
      }
    };

    // Data storage
    this.blockedIPs = new Map(); // IP -> block info
    this.monitoredIPs = new Map(); // IP -> monitoring data
    this.ipReputation = new Map(); // IP -> reputation score
    this.geoRules = new Map(); // country -> rules
    this.networkRanges = new Map(); // CIDR ranges -> rules
    
    // Statistics
    this.stats = {
      totalBlocks: 0,
      autoBlocks: 0,
      manualBlocks: 0,
      geoBlocks: 0,
      reputationBlocks: 0,
      networkBlocks: 0,
      totalRequests: 0,
      blockedRequests: 0,
      lastCleanup: Date.now()
    };

    // Initialize
    this.init();
  }

  async init() {
    // Create data directory
    const dataDir = path.dirname(this.config.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing data
    await this.loadData();
    
    // Load geographic rules
    await this.loadGeoRules();
    
    // Setup periodic tasks
    this.setupPeriodicTasks();
    
    console.log('🔥 IP Firewall System initialized');
  }

  // Main middleware function
  middleware() {
    return async (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const now = Date.now();
      
      this.stats.totalRequests++;

      // Check if IP is blocked
      const blockResult = this.checkIPBlock(clientIP, req);
      if (blockResult.blocked) {
        this.handleBlockedRequest(req, res, clientIP, blockResult);
        return;
      }

      // Update monitoring data
      this.updateMonitoringData(clientIP, req, now);

      // Check for auto-block conditions
      if (this.config.autoBlock.enable) {
        this.checkAutoBlockConditions(clientIP, now);
      }

      // Check geographic rules
      if (this.config.geoBlocking.enable) {
        const geoResult = this.checkGeographicRules(clientIP, req);
        if (geoResult.blocked) {
          this.handleGeoBlockedRequest(req, res, clientIP, geoResult);
          return;
        }
      }

      // Check IP reputation
      if (this.config.reputation.enable) {
        const repResult = await this.checkIPReputation(clientIP);
        if (repResult.blocked) {
          this.handleReputationBlockedRequest(req, res, clientIP, repResult);
          return;
        }
      }

      // Network analysis
      if (this.config.networkAnalysis.enable) {
        const netResult = this.checkNetworkAnalysis(clientIP, req);
        if (netResult.blocked) {
          this.handleNetworkBlockedRequest(req, res, clientIP, netResult);
          return;
        }
      }

      // Request passed all checks
      next();
    };
  }

  getClientIP(req) {
    // Check various headers for real IP
    const ipHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-cluster-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    for (const header of ipHeaders) {
      const value = req.headers[header];
      if (value) {
        // X-Forwarded-For can contain multiple IPs
        const ips = value.split(',').map(ip => ip.trim());
        const ip = ips[0]; // Take the first IP
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    // Fallback to connection IP
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  checkIPBlock(ip, req) {
    const blockInfo = this.blockedIPs.get(ip);
    
    if (!blockInfo) {
      return { blocked: false };
    }

    // Check if block has expired
    if (blockInfo.expires && Date.now() > blockInfo.expires) {
      this.blockedIPs.delete(ip);
      this.saveData();
      return { blocked: false };
    }

    // Update block statistics
    blockInfo.requestCount++;
    blockInfo.lastRequest = Date.now();

    this.stats.blockedRequests++;

    return {
      blocked: true,
      reason: blockInfo.reason,
      expires: blockInfo.expires,
      severity: blockInfo.severity,
      requestCount: blockInfo.requestCount
    };
  }

  updateMonitoringData(ip, req, now) {
    if (!this.monitoredIPs.has(ip)) {
      this.monitoredIPs.set(ip, {
        firstSeen: now,
        lastSeen: now,
        requestCount: 0,
        requests: [],
        endpoints: new Set(),
        userAgent: req.headers['user-agent'] || '',
        suspiciousScore: 0,
        violations: 0
      });
    }

    const data = this.monitoredIPs.get(ip);
    data.lastSeen = now;
    data.requestCount++;
    data.requests.push(now);
    data.endpoints.add(req.path);

    // Keep only recent requests (within 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    data.requests = data.requests.filter(time => time > oneHourAgo);
  }

  checkAutoBlockConditions(ip, now) {
    const data = this.monitoredIPs.get(ip);
    if (!data) return;

    const windowStart = now - this.config.autoBlock.timeWindow;
    const recentRequests = data.requests.filter(time => time > windowStart);

    // Check threshold
    if (recentRequests.length >= this.config.autoBlock.threshold) {
      // Determine severity based on violation count
      let severity = 'medium';
      let duration = this.config.autoBlock.duration;

      if (data.violations >= this.config.autoBlock.escalationThreshold) {
        severity = 'high';
        duration = 24 * 60 * 60 * 1000; // 24 hours
      } else if (data.violations >= this.config.autoBlock.suspiciousThreshold) {
        severity = 'medium';
        duration = 2 * 60 * 60 * 1000; // 2 hours
      }

      this.blockIP(ip, {
        reason: 'Auto-block: Exceeded request threshold',
        severity,
        duration,
        source: 'auto-block',
        requestCount: recentRequests.length,
        timeWindow: this.config.autoBlock.timeWindow
      });

      this.stats.autoBlocks++;
    }
  }

  checkGeographicRules(ip, req) {
    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return { blocked: false, reason: 'Unknown location' };
    }

    const country = geo.country;
    const rules = this.geoRules.get(country);

    // Check if country is explicitly blocked
    if (this.config.geoBlocking.blockedCountries.includes(country)) {
      return {
        blocked: true,
        reason: `Country ${country} is blocked`,
        country,
        action: 'block'
      };
    }

    // Check if only specific countries are allowed
    if (this.config.geoBlocking.allowedCountries.length > 0 &&
        !this.config.geoBlocking.allowedCountries.includes(country)) {
      return {
        blocked: true,
        reason: `Country ${country} is not in allowed list`,
        country,
        action: 'block'
      };
    }

    // Check custom rules
    if (rules && rules.action === 'block') {
      return {
        blocked: true,
        reason: rules.reason || `Custom rule for ${country}`,
        country,
        action: 'block'
      };
    }

    return { blocked: false, country, geo };
  }

  async checkIPReputation(ip) {
    // Check cache first
    const cached = this.ipReputation.get(ip);
    if (cached && Date.now() - cached.timestamp < this.config.reputation.cacheDuration) {
      return {
        blocked: cached.score >= this.config.reputation.threshold,
        score: cached.score,
        sources: cached.sources
      };
    }

    // Simulate reputation check (in real implementation, call actual APIs)
    let score = 0;
    const sources = [];

    // Check against known malicious patterns
    if (this.isSuspiciousIP(ip)) {
      score += 30;
      sources.push('internal-analysis');
    }

    // Simulate external reputation sources
    // In production, integrate with: Spamhaus, AbuseIPDB, etc.
    if (Math.random() < 0.05) { // 5% chance of being flagged
      score += 50;
      sources.push('spamhaus');
    }

    // Cache result
    this.ipReputation.set(ip, {
      score,
      sources,
      timestamp: Date.now()
    });

    return {
      blocked: score >= this.config.reputation.threshold,
      score,
      sources
    };
  }

  checkNetworkAnalysis(ip, req) {
    const analysis = this.analyzeIP(ip);
    
    if (!this.config.networkAnalysis.privateNetworks && analysis.isPrivate) {
      return {
        blocked: true,
        reason: 'Private network access denied',
        type: 'private-network'
      };
    }

    if (this.config.networkAnalysis.detectProxies && analysis.isProxy) {
      return {
        blocked: true,
        reason: 'Proxy/VPN detected',
        type: 'proxy'
      };
    }

    if (this.config.networkAnalysis.detectTor && analysis.isTor) {
      return {
        blocked: true,
        reason: 'Tor exit node detected',
        type: 'tor'
      };
    }

    return { blocked: false, analysis };
  }

  analyzeIP(ip) {
    const analysis = {
      isPrivate: this.isPrivateIP(ip),
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      asn: null,
      organization: null
    };

    // Check for common proxy headers
    // In production, use more sophisticated detection
    
    return analysis;
  }

  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  isSuspiciousIP(ip) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^0\./,         // 0.0.0.0/8
      /^255\./,       // 255.0.0.0/8
      /^22[4-9]\./,   // 224.0.0.0/4 (multicast)
      /^24[0-9]\./,   // 240.0.0.0/4 (reserved)
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ip));
  }

  // Block IP with detailed information
  blockIP(ip, options = {}) {
    const blockInfo = {
      ip,
      reason: options.reason || 'Manual block',
      severity: options.severity || 'medium',
      timestamp: Date.now(),
      expires: options.duration ? Date.now() + options.duration : null,
      source: options.source || 'manual',
      requestCount: options.requestCount || 0,
      violations: options.violations || 0,
      metadata: options.metadata || {}
    };

    this.blockedIPs.set(ip, blockInfo);
    this.stats.totalBlocks++;
    
    this.saveData();
    this.logSecurity(`IP ${ip} blocked: ${blockInfo.reason}`);

    return blockInfo;
  }

  // Unblock IP
  unblockIP(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (blockInfo) {
      this.blockedIPs.delete(ip);
      this.saveData();
      this.logSecurity(`IP ${ip} unblocked`);
      return true;
    }
    return false;
  }

  // Handle blocked requests
  handleBlockedRequest(req, res, ip, blockResult) {
    const headers = {
      'X-Blocked-Reason': blockResult.reason,
      'X-Block-Severity': blockResult.severity,
      'X-Block-Expires': blockResult.expires ? new Date(blockResult.expires).toISOString() : 'never',
      'Retry-After': blockResult.expires ? Math.ceil((blockResult.expires - Date.now()) / 1000) : 3600
    };

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(403).json({
      error: 'Access Denied',
      message: 'Your IP address has been blocked',
      reason: blockResult.reason,
      expires: headers['X-Block-Expires']
    });
  }

  handleGeoBlockedRequest(req, res, ip, geoResult) {
    res.setHeader('X-Geo-Blocked', 'true');
    res.setHeader('X-Country', geoResult.country);

    res.status(403).json({
      error: 'Geographic Access Denied',
      message: `Access from your location (${geoResult.country}) is not allowed`,
      country: geoResult.country
    });

    this.stats.geoBlocks++;
  }

  handleReputationBlockedRequest(req, res, ip, repResult) {
    res.setHeader('X-Reputation-Score', repResult.score);
    res.setHeader('X-Reputation-Sources', repResult.sources.join(','));

    res.status(403).json({
      error: 'Reputation Check Failed',
      message: 'Your IP address has a poor reputation',
      score: repResult.score,
      sources: repResult.sources
    });

    this.stats.reputationBlocks++;
  }

  handleNetworkBlockedRequest(req, res, ip, netResult) {
    res.setHeader('X-Network-Type', netResult.type);

    res.status(403).json({
      error: 'Network Access Denied',
      message: `${netResult.type} access is not allowed`,
      type: netResult.type
    });

    this.stats.networkBlocks++;
  }

  // Data persistence
  async loadData() {
    try {
      if (fs.existsSync(this.config.databasePath)) {
        const data = JSON.parse(fs.readFileSync(this.config.databasePath, 'utf8'));
        
        if (data.blockedIPs) {
          this.blockedIPs = new Map(data.blockedIPs);
        }
        if (data.monitoredIPs) {
          this.monitoredIPs = new Map(data.monitoredIPs);
        }
        if (data.ipReputation) {
          this.ipReputation = new Map(data.ipReputation);
        }
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
      }
    } catch (error) {
      console.error('Failed to load firewall data:', error);
    }
  }

  async saveData() {
    try {
      const data = {
        blockedIPs: Array.from(this.blockedIPs.entries()),
        monitoredIPs: Array.from(this.monitoredIPs.entries()),
        ipReputation: Array.from(this.ipReputation.entries()),
        stats: this.stats,
        timestamp: Date.now()
      };

      fs.writeFileSync(this.config.databasePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save firewall data:', error);
    }
  }

  async loadGeoRules() {
    try {
      if (fs.existsSync(this.config.geoDatabasePath)) {
        const data = JSON.parse(fs.readFileSync(this.config.geoDatabasePath, 'utf8'));
        this.geoRules = new Map(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load geo rules:', error);
    }
  }

  setupPeriodicTasks() {
    // Cleanup old data every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
    
    // Save data every 5 minutes
    setInterval(() => this.saveData(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean expired blocks
    for (const [ip, block] of this.blockedIPs.entries()) {
      if (block.expires && now > block.expires) {
        this.blockedIPs.delete(ip);
        cleanedCount++;
      }
    }

    // Clean old monitoring data
    for (const [ip, data] of this.monitoredIPs.entries()) {
      if (now - data.lastSeen > 24 * 60 * 60 * 1000) { // 24 hours
        this.monitoredIPs.delete(ip);
        cleanedCount++;
      }
    }

    // Clean expired reputation cache
    for (const [ip, data] of this.ipReputation.entries()) {
      if (now - data.timestamp > this.config.reputation.cacheDuration) {
        this.ipReputation.delete(ip);
        cleanedCount++;
      }
    }

    this.stats.lastCleanup = now;
    
    if (cleanedCount > 0) {
      this.logSecurity(`Firewall cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  logSecurity(message) {
    const timestamp = new Date().toISOString();
    console.log(`🔥 [${timestamp}] FIREWALL: ${message}`);
  }

  // Management functions
  getStats() {
    return {
      ...this.stats,
      blockedIPs: this.blockedIPs.size,
      monitoredIPs: this.monitoredIPs.size,
      reputationCache: this.ipReputation.size,
      geoRules: this.geoRules.size
    };
  }

  getIPInfo(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    const monitorInfo = this.monitoredIPs.get(ip);
    const reputationInfo = this.ipReputation.get(ip);
    const geo = geoip.lookup(ip);

    return {
      ip,
      blocked: !!blockInfo,
      blockInfo,
      monitored: !!monitorInfo,
      monitorInfo,
      reputation: reputationInfo,
      geo
    };
  }

  // Geographic rule management
  addGeoRule(country, rule) {
    this.geoRules.set(country, rule);
    this.saveGeoRules();
  }

  removeGeoRule(country) {
    this.geoRules.delete(country);
    this.saveGeoRules();
  }

  saveGeoRules() {
    try {
      const data = {
        rules: Array.from(this.geoRules.entries()),
        timestamp: Date.now()
      };
      fs.writeFileSync(this.config.geoDatabasePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save geo rules:', error);
    }
  }
}

module.exports = IPFirewall;
