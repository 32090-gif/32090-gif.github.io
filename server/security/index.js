/**
 * Unified Security System - Main Integration
 * ระบบรักษาความปลอดภัยรวม - การเชื่อมต่อหลัก
 */

const DDoSProtection = require('./ddos-protection');
const RateLimiter = require('./rate-limiter');
const IPFirewall = require('./ip-firewall');
const RequestValidator = require('./request-validator');
const BotDetection = require('./bot-detection');
const SecurityMonitor = require('./monitoring');
const SecurityHeaders = require('./security-headers');

class UnifiedSecuritySystem {
  constructor(options = {}) {
    this.config = {
      // Enable/disable individual components
      components: {
        ddosProtection: options.enableDDoSProtection !== false,
        rateLimiter: options.enableRateLimiter !== false,
        ipFirewall: options.enableIPFirewall !== false,
        requestValidator: options.enableRequestValidator !== false,
        botDetection: options.enableBotDetection !== false,
        monitoring: options.enableMonitoring !== false,
        securityHeaders: options.enableSecurityHeaders !== false
      },
      
      // Global settings
      global: {
        logLevel: options.logLevel || 'info',
        enableRealTimeAlerts: options.enableRealTimeAlerts !== false,
        securityMode: options.securityMode || 'balanced', // 'strict', 'balanced', 'permissive'
        failClosed: options.failClosed !== false // Block requests if security systems fail
      },
      
      // Component-specific configurations
      ddosProtection: options.ddosProtection || {},
      rateLimiter: options.rateLimiter || {},
      ipFirewall: options.ipFirewall || {},
      requestValidator: options.requestValidator || {},
      botDetection: options.botDetection || {},
      monitoring: options.monitoring || {},
      securityHeaders: options.securityHeaders || {}
    };

    // Initialize components
    this.components = {};
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      systemUptime: Date.now(),
      lastActivity: Date.now()
    };

    // Initialize the system
    this.init();
  }

  async init() {
    try {
      console.log('🛡️ Initializing Unified Security System...');

      // Initialize components in order
      if (this.config.components.monitoring) {
        this.components.monitoring = new SecurityMonitor(this.config.monitoring);
        console.log('✅ Security Monitor initialized');
      }

      if (this.config.components.ddosProtection) {
        this.components.ddosProtection = new DDoSProtection(this.config.ddosProtection);
        console.log('✅ DDoS Protection initialized');
      }

      if (this.config.components.rateLimiter) {
        this.components.rateLimiter = new RateLimiter(this.config.rateLimiter);
        console.log('✅ Rate Limiter initialized');
      }

      if (this.config.components.ipFirewall) {
        this.components.ipFirewall = new IPFirewall(this.config.ipFirewall);
        console.log('✅ IP Firewall initialized');
      }

      if (this.config.components.requestValidator) {
        this.components.requestValidator = new RequestValidator(this.config.requestValidator);
        console.log('✅ Request Validator initialized');
      }

      if (this.config.components.botDetection) {
        this.components.botDetection = new BotDetection(this.config.botDetection);
        console.log('✅ Bot Detection initialized');
      }

      if (this.config.components.securityHeaders) {
        this.components.securityHeaders = new SecurityHeaders(this.config.securityHeaders);
        console.log('✅ Security Headers initialized');
      }

      // Setup inter-component communication
      this.setupComponentCommunication();

      console.log('🎉 Unified Security System fully initialized!');
      console.log(`📊 Security Mode: ${this.config.global.securityMode}`);
      console.log(`🔒 Components Active: ${Object.values(this.config.components).filter(Boolean).length}/${Object.keys(this.config.components).length}`);

    } catch (error) {
      console.error('❌ Failed to initialize security system:', error);
      
      if (this.config.global.failClosed) {
        console.log('🚨 System in fail-closed mode - blocking all requests');
        this.emergencyMode = true;
      }
    }
  }

  setupComponentCommunication() {
    // Setup event listeners between components
    const components = this.components;

    // Bot Detection -> IP Firewall
    if (components.botDetection && components.ipFirewall) {
      components.botDetection.on('bot-detected', (data) => {
        components.ipFirewall.blockIP(data.ip, {
          reason: 'Bot detected by detection system',
          severity: 'medium',
          duration: 30 * 60 * 1000, // 30 minutes
          source: 'bot-detection'
        });
      });

      components.botDetection.on('session-blocked', (data) => {
        components.ipFirewall.blockIP(data.ip, {
          reason: data.reason,
          severity: 'high',
          duration: 60 * 60 * 1000, // 1 hour
          source: 'bot-detection'
        });
      });
    }

    // Rate Limiter -> IP Firewall
    if (components.rateLimiter && components.ipFirewall) {
      components.rateLimiter.on('violation', (data) => {
        if (data.mostRestrictive.strategy === 'adaptive' && data.mostRestrictive.currentLimit < 10) {
          components.ipFirewall.blockIP(data.ip, {
            reason: 'Excessive rate limit violations',
            severity: 'medium',
            duration: 15 * 60 * 1000, // 15 minutes
            source: 'rate-limiter'
          });
        }
      });
    }

    // Request Validator -> IP Firewall
    if (components.requestValidator && components.ipFirewall) {
      components.requestValidator.on('security-violation', (data) => {
        components.ipFirewall.blockIP(data.ip, {
          reason: 'Security violation detected',
          severity: 'high',
          duration: 60 * 60 * 1000, // 1 hour
          source: 'request-validator'
        });
      });
    }

    // All components -> Monitoring
    if (components.monitoring) {
      Object.entries(components).forEach(([name, component]) => {
        if (name !== 'monitoring' && component.on) {
          // Forward all events to monitoring
          component.on('alert', (alert) => {
            components.monitoring.triggerAlert(name + '_alert', alert);
          });

          component.on('security-violation', (data) => {
            components.monitoring.triggerAlert('security_violation', data);
          });

          component.on('bot-detected', (data) => {
            components.monitoring.triggerAlert('bot_detected', data);
          });
        }
      });
    }
  }

  // Main middleware function
  middleware() {
    return async (req, res, next) => {
      // Emergency mode handling
      if (this.emergencyMode) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Security system is in emergency mode'
        });
        return;
      }

      const startTime = Date.now();
      this.stats.totalRequests++;
      this.stats.lastActivity = Date.now();

      try {
        // Apply security components in order
        const securityResults = await this.applySecurityComponents(req, res);

        // Check if any component blocked the request
        if (securityResults.blocked) {
          this.stats.blockedRequests++;
          this.logSecurityEvent('request_blocked', {
            ip: this.getClientIP(req),
            path: req.path,
            method: req.method,
            reasons: securityResults.reasons,
            processingTime: Date.now() - startTime
          });
          return;
        }

        // Request passed all security checks
        this.stats.allowedRequests++;
        
        // Add security metadata to request
        req.security = {
          processed: true,
          components: securityResults.components,
          processingTime: Date.now() - startTime,
          timestamp: startTime
        };

        next();

      } catch (error) {
        console.error('Security middleware error:', error);
        
        if (this.config.global.failClosed) {
          res.status(503).json({
            error: 'Security System Error',
            message: 'Request blocked due to security system failure'
          });
        } else {
          next(); // Allow request to proceed if not in fail-closed mode
        }
      }
    };
  }

  async applySecurityComponents(req, res) {
    const results = {
      blocked: false,
      reasons: [],
      components: {}
    };

    const componentOrder = [
      'securityHeaders', // Headers first (non-blocking)
      'ipFirewall',      // IP blocking
      'requestValidator', // Request validation
      'ddosProtection',  // DDoS protection
      'rateLimiter',     // Rate limiting
      'botDetection'      // Bot detection (last)
    ];

    for (const componentName of componentOrder) {
      if (!this.config.components[componentName] || !this.components[componentName]) {
        continue;
      }

      try {
        const component = this.components[componentName];
        
        // For security headers, just apply them (non-blocking)
        if (componentName === 'securityHeaders') {
          component.addSecurityHeaders(req, res);
          component.handleCORS(req, res);
          results.components[componentName] = { applied: true };
          continue;
        }

        // For other components, run their middleware logic
        const result = await this.runComponentMiddleware(component, req, res);
        results.components[componentName] = result;

        if (result.blocked) {
          results.blocked = true;
          results.reasons.push(result.reason || `${componentName} blocked request`);
          
          // Don't run further components if one blocked
          break;
        }

      } catch (error) {
        console.error(`Error in ${componentName}:`, error);
        
        if (this.config.global.failClosed) {
          results.blocked = true;
          results.reasons.push(`${componentName} failed`);
          break;
        }
      }
    }

    return results;
  }

  async runComponentMiddleware(component, req, res) {
    return new Promise((resolve) => {
      // Create a mock next function
      const mockNext = () => {
        resolve({ blocked: false, reason: null });
      };

      // Create a mock end function for responses
      const originalEnd = res.end;
      const originalJson = res.json;
      const originalStatus = res.status;
      let blocked = false;
      let reason = null;

      res.end = function(...args) {
        blocked = true;
        originalEnd.apply(this, args);
        resolve({ blocked: true, reason: reason || 'Response ended' });
      };

      res.json = function(...args) {
        blocked = true;
        originalJson.apply(this, args);
        resolve({ blocked: true, reason: reason || 'JSON response sent' });
      };

      res.status = function(code) {
        if (code >= 400) {
          blocked = true;
          reason = `HTTP ${code}`;
        }
        return originalStatus.call(this, code);
      };

      // Run the component middleware
      try {
        const middleware = component.middleware();
        middleware(req, res, mockNext);
        
        // If middleware calls next() synchronously
        setTimeout(() => {
          if (!blocked) {
            resolve({ blocked: false, reason: null });
          }
        }, 0);
        
      } catch (error) {
        resolve({ blocked: true, reason: `Component error: ${error.message}` });
      }
    });
  }

  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  logSecurityEvent(event, data) {
    const timestamp = new Date().toISOString();
    console.log(`🔒 [${timestamp}] SECURITY: ${event}`, data);
  }

  // Management methods
  getSystemStats() {
    const componentStats = {};
    
    Object.entries(this.components).forEach(([name, component]) => {
      if (component.getStats) {
        componentStats[name] = component.getStats();
      }
    });

    return {
      system: {
        ...this.stats,
        uptime: Date.now() - this.stats.systemUptime,
        emergencyMode: this.emergencyMode || false,
        securityMode: this.config.global.securityMode,
        activeComponents: Object.keys(this.components).length
      },
      components: componentStats,
      timestamp: Date.now()
    };
  }

  getSystemHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      components: {}
    };

    // Check each component
    Object.entries(this.components).forEach(([name, component]) => {
      try {
        if (component.getSystemHealth) {
          health.components[name] = component.getSystemHealth();
        } else if (component.getStats) {
          health.components[name] = { status: 'healthy', stats: component.getStats() };
        } else {
          health.components[name] = { status: 'unknown' };
        }
      } catch (error) {
        health.components[name] = { status: 'error', error: error.message };
        health.issues.push(`${name}: ${error.message}`);
      }
    });

    // Determine overall health
    if (health.issues.length > 0) {
      health.status = health.issues.some(issue => issue.includes('critical')) ? 'critical' : 'degraded';
    }

    if (this.emergencyMode) {
      health.status = 'emergency';
      health.issues.push('System in emergency mode');
    }

    return health;
  }

  updateConfiguration(component, config) {
    if (this.components[component] && this.components[component].updateConfig) {
      this.components[component].updateConfig(config);
      return true;
    }
    return false;
  }

  enableComponent(componentName) {
    if (this.components[componentName]) {
      this.config.components[componentName] = true;
      return true;
    }
    return false;
  }

  disableComponent(componentName) {
    if (this.components[componentName]) {
      this.config.components[componentName] = false;
      return true;
    }
    return false;
  }

  // Emergency controls
  enterEmergencyMode(reason = 'Manual activation') {
    this.emergencyMode = true;
    this.logSecurityEvent('emergency_mode_entered', { reason });
    
    if (this.components.monitoring) {
      this.components.monitoring.triggerAlert('emergency_mode', { reason });
    }
  }

  exitEmergencyMode() {
    this.emergencyMode = false;
    this.logSecurityEvent('emergency_mode_exited', {});
  }

  // Manual blocking
  blockIP(ip, options = {}) {
    if (this.components.ipFirewall) {
      return this.components.ipFirewall.blockIP(ip, options);
    }
    return false;
  }

  unblockIP(ip) {
    if (this.components.ipFirewall) {
      return this.components.ipFirewall.unblockIP(ip);
    }
    return false;
  }

  // Challenge verification
  verifyChallenge(sessionId, answer) {
    if (this.components.botDetection) {
      return this.components.botDetection.verifyChallenge(sessionId, answer);
    }
    return { success: false, reason: 'Bot detection not enabled' };
  }

  // Generate security report
  generateSecurityReport() {
    const stats = this.getSystemStats();
    const health = this.getSystemHealth();
    
    let securityScore = 100;
    const issues = [];

    // Check component health
    Object.entries(health.components).forEach(([name, component]) => {
      if (component.status === 'error') {
        securityScore -= 20;
        issues.push(`${name} component error`);
      } else if (component.status === 'degraded') {
        securityScore -= 10;
        issues.push(`${name} component degraded`);
      }
    });

    // Check system stats
    const blockRate = stats.system.blockedRequests / Math.max(stats.system.totalRequests, 1);
    if (blockRate > 0.1) { // More than 10% blocked
      securityScore -= 15;
      issues.push('High block rate detected');
    }

    // Check emergency mode
    if (stats.system.emergencyMode) {
      securityScore -= 50;
      issues.push('System in emergency mode');
    }

    return {
      timestamp: new Date().toISOString(),
      securityScore: Math.max(securityScore, 0),
      grade: this.getSecurityGrade(securityScore),
      health: health.status,
      stats: stats,
      issues: issues,
      recommendations: this.getRecommendations(securityScore, health, issues)
    };
  }

  getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getRecommendations(score, health, issues) {
    const recommendations = [];

    if (score < 70) {
      recommendations.push('Review security configuration - low security score');
    }

    if (health.status !== 'healthy') {
      recommendations.push('Address component health issues');
    }

    if (issues.some(issue => issue.includes('error'))) {
      recommendations.push('Fix component errors immediately');
    }

    if (!this.config.components.monitoring) {
      recommendations.push('Enable monitoring for better visibility');
    }

    if (!this.config.components.botDetection) {
      recommendations.push('Consider enabling bot detection');
    }

    return recommendations;
  }

  // Export/Import configuration
  exportConfiguration() {
    return {
      config: this.config,
      stats: this.getSystemStats(),
      timestamp: Date.now()
    };
  }

  importConfiguration(configData) {
    if (configData.config) {
      Object.assign(this.config, configData.config);
    }
    
    // Reinitialize affected components
    this.init();
  }
}

module.exports = UnifiedSecuritySystem;
