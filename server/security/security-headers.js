/**
 * Advanced Security Headers and CORS Management
 * ระบบจัดการ Security Headers และ CORS ขั้นสูง
 */

const crypto = require('crypto');

class SecurityHeaders {
  constructor(options = {}) {
    this.config = {
      // Security headers
      headers: {
        // Content Security Policy
        csp: {
          enable: options.enableCSP !== false,
          policy: options.cspPolicy || this.getDefaultCSP(),
          reportOnly: options.cspReportOnly || false,
          reportURI: options.cspReportURI || '/api/security/csp-report'
        },
        
        // HTTP Strict Transport Security
        hsts: {
          enable: options.enableHSTS !== false,
          maxAge: options.hstsMaxAge || 31536000, // 1 year
          includeSubDomains: options.hstsIncludeSubDomains !== false,
          preload: options.hstsPreload || false
        },
        
        // X-Frame-Options
        frameOptions: {
          enable: options.enableFrameOptions !== false,
          value: options.frameOptionsValue || 'DENY' // DENY, SAMEORIGIN, ALLOW-FROM
        },
        
        // X-Content-Type-Options
        contentTypeOptions: {
          enable: options.enableContentTypeOptions !== false,
          value: 'nosniff'
        },
        
        // Referrer Policy
        referrerPolicy: {
          enable: options.enableReferrerPolicy !== false,
          value: options.referrerPolicyValue || 'strict-origin-when-cross-origin'
        },
        
        // Permissions Policy
        permissionsPolicy: {
          enable: options.enablePermissionsPolicy !== false,
          permissions: options.permissions || this.getDefaultPermissions()
        },
        
        // Cross-Origin Embedder Policy
        coop: {
          enable: options.enableCOOP !== false,
          value: options.coopValue || 'same-origin'
        },
        
        // Cross-Origin Resource Policy
        corp: {
          enable: options.enableCORP !== false,
          value: options.corpValue || 'same-origin'
        }
      },
      
      // CORS configuration
      cors: {
        enable: options.enableCORS !== false,
        origins: options.allowedOrigins || ['http://localhost:8081', 'http://localhost:3000'],
        methods: options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: options.exposedHeaders || [],
        credentials: options.allowCredentials || false,
        maxAge: options.corsMaxAge || 86400, // 24 hours
        preflightContinue: options.preflightContinue || false,
        optionsSuccessStatus: options.optionsSuccessStatus || 204
      },
      
      // Additional security
      additional: {
        removePoweredBy: options.removePoweredBy !== false,
        addRandomHeader: options.addRandomHeader !== false,
        customHeaders: options.customHeaders || {}
      }
    };

    // Statistics
    this.stats = {
      totalRequests: 0,
      corsRequests: 0,
      preflightRequests: 0,
      cspViolations: 0,
      securityScore: 100
    };

    // CSP violations storage
    this.cspViolations = [];

    // Initialize
    this.init();
  }

  init() {
    console.log('🔒 Security Headers System initialized');
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      this.stats.totalRequests++;

      // Handle CORS
      if (this.config.cors.enable) {
        this.handleCORS(req, res);
      }

      // Add security headers
      this.addSecurityHeaders(req, res);

      // Handle CSP violations
      if (req.path === this.config.headers.csp.reportURI && req.method === 'POST') {
        this.handleCSPViolation(req, res);
        return;
      }

      // Add custom headers
      this.addCustomHeaders(req, res);

      next();
    };
  }

  handleCORS(req, res) {
    const origin = req.headers.origin;
    const method = req.method;

    // Track preflight requests
    if (method === 'OPTIONS') {
      this.stats.preflightRequests++;
    }

    // Check if origin is allowed
    if (this.isOriginAllowed(origin)) {
      // Set Access-Control-Allow-Origin
      if (this.config.cors.credentials) {
        // With credentials, must be specific origin
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Without credentials, can use wildcard or specific
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      // Set other CORS headers
      res.setHeader('Access-Control-Allow-Methods', this.config.cors.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', this.config.cors.allowedHeaders.join(', '));
      
      if (this.config.cors.exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', this.config.cors.exposedHeaders.join(', '));
      }

      if (this.config.cors.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      res.setHeader('Access-Control-Max-Age', this.config.cors.maxAge.toString());

      this.stats.corsRequests++;
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      if (this.isOriginAllowed(origin)) {
        res.status(this.config.cors.optionsSuccessStatus).end();
        return;
      } else {
        res.status(403).json({
          error: 'CORS Error',
          message: 'Origin not allowed'
        });
        return;
      }
    }
  }

  isOriginAllowed(origin) {
    if (!origin) return true; // Same origin requests

    const allowedOrigins = this.config.cors.origins;
    
    // Check for exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Check for wildcard patterns
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin === '*') {
        return true;
      }
      
      // Handle subdomain wildcards (e.g., *.example.com)
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        if (origin.endsWith(domain) && origin.includes('.')) {
          return true;
        }
      }
    }

    return false;
  }

  addSecurityHeaders(req, res) {
    // Content Security Policy
    if (this.config.headers.csp.enable) {
      const cspHeader = this.config.headers.csp.reportOnly ? 
        'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
      
      res.setHeader(cspHeader, this.config.headers.csp.policy);
      
      if (this.config.headers.csp.reportURI) {
        res.setHeader('Content-Security-Policy-Report-Only', 
          this.config.headers.csp.policy + ` report-uri ${this.config.headers.csp.reportURI}`);
      }
    }

    // HTTP Strict Transport Security
    if (this.config.headers.hsts.enable && req.protocol === 'https') {
      let hstsValue = `max-age=${this.config.headers.hsts.maxAge}`;
      
      if (this.config.headers.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      
      if (this.config.headers.hsts.preload) {
        hstsValue += '; preload';
      }
      
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    if (this.config.headers.frameOptions.enable) {
      res.setHeader('X-Frame-Options', this.config.headers.frameOptions.value);
    }

    // X-Content-Type-Options
    if (this.config.headers.contentTypeOptions.enable) {
      res.setHeader('X-Content-Type-Options', this.config.headers.contentTypeOptions.value);
    }

    // Referrer Policy
    if (this.config.headers.referrerPolicy.enable) {
      res.setHeader('Referrer-Policy', this.config.headers.referrerPolicy.value);
    }

    // Permissions Policy
    if (this.config.headers.permissionsPolicy.enable) {
      const permissions = Object.entries(this.config.headers.permissions.permissions)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => `${feature}=()`)
        .join(', ');
      
      if (permissions) {
        res.setHeader('Permissions-Policy', permissions);
      }
    }

    // Cross-Origin Embedder Policy
    if (this.config.headers.coop.enable) {
      res.setHeader('Cross-Origin-Embedder-Policy', this.config.headers.coop.value);
    }

    // Cross-Origin Resource Policy
    if (this.config.headers.corp.enable) {
      res.setHeader('Cross-Origin-Resource-Policy', this.config.headers.corp.value);
    }

    // Additional security headers
    this.addAdditionalSecurityHeaders(req, res);
  }

  addAdditionalSecurityHeaders(req, res) {
    // Remove Server header
    if (this.config.additional.removePoweredBy) {
      res.removeHeader('X-Powered-By');
      res.setHeader('X-Powered-By', 'Kunlun Security');
    }

    // Add random header for obfuscation
    if (this.config.additional.addRandomHeader) {
      const randomValue = crypto.randomBytes(16).toString('hex');
      res.setHeader('X-Request-ID', randomValue);
      res.setHeader('X-Timestamp', Date.now().toString());
    }

    // Add security-related headers
    res.setHeader('X-Content-Security-Policy', 'default-src \'self\'');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-WebKit-CSP', 'default-src \'self\'');
  }

  addCustomHeaders(req, res) {
    for (const [name, value] of Object.entries(this.config.additional.customHeaders)) {
      res.setHeader(name, value);
    }
  }

  handleCSPViolation(req, res) {
    try {
      const violation = req.body;
      
      // Store violation
      this.cspViolations.push({
        timestamp: Date.now(),
        violation,
        userAgent: req.headers['user-agent'],
        ip: this.getClientIP(req)
      });

      this.stats.cspViolations++;

      // Log violation
      console.log('🚨 CSP Violation:', violation);

      // Emit event for monitoring
      if (this.emit) {
        this.emit('csp-violation', violation);
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error handling CSP violation:', error);
      res.status(400).json({ error: 'Invalid CSP report' });
    }
  }

  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  getDefaultCSP() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: http:",
      "connect-src 'self' https://api.example.com",
      "media-src 'self' https:",
      "object-src 'none'",
      "child-src 'self'",
      "frame-src 'self'",
      "worker-src 'self'",
      "manifest-src 'self'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  getDefaultPermissions() {
    return {
      'geolocation': false,
      'microphone': false,
      'camera': false,
      'payment': false,
      'usb': false,
      'magnetometer': false,
      'gyroscope': false,
      'accelerometer': false,
      'ambient-light-sensor': false,
      'autoplay': false,
      'encrypted-media': false,
      'fullscreen': false,
      'picture-in-picture': false,
      'speaker': false,
      'clipboard-read': false,
      'clipboard-write': false,
      'gamepad': false,
      'vr': false,
      'xr': false
    };
  }

  // Configuration methods
  updateCSP(policy) {
    this.config.headers.csp.policy = policy;
  }

  addCSPDirective(directive, value) {
    const currentPolicy = this.config.headers.csp.policy;
    this.config.headers.csp.policy = currentPolicy + `; ${directive} ${value}`;
  }

  removeCSPDirective(directive) {
    const currentPolicy = this.config.headers.csp.policy;
    const directives = currentPolicy.split(';').filter(d => !d.trim().startsWith(directive));
    this.config.headers.csp.policy = directives.join(';');
  }

  addAllowedOrigin(origin) {
    if (!this.config.cors.origins.includes(origin)) {
      this.config.cors.origins.push(origin);
    }
  }

  removeAllowedOrigin(origin) {
    const index = this.config.cors.origins.indexOf(origin);
    if (index > -1) {
      this.config.cors.origins.splice(index, 1);
    }
  }

  addCustomHeader(name, value) {
    this.config.additional.customHeaders[name] = value;
  }

  removeCustomHeader(name) {
    delete this.config.additional.customHeaders[name];
  }

  // Analytics methods
  getSecurityScore() {
    let score = 100;
    
    // Deduct points for missing security headers
    if (!this.config.headers.csp.enable) score -= 20;
    if (!this.config.headers.hsts.enable) score -= 15;
    if (!this.config.headers.frameOptions.enable) score -= 10;
    if (!this.config.headers.contentTypeOptions.enable) score -= 10;
    if (!this.config.headers.referrerPolicy.enable) score -= 5;
    if (!this.config.headers.permissionsPolicy.enable) score -= 5;
    
    // Deduct points for CSP violations
    score -= Math.min(this.stats.cspViolations * 2, 20);
    
    this.stats.securityScore = Math.max(score, 0);
    return this.stats.securityScore;
  }

  getStats() {
    return {
      ...this.stats,
      securityScore: this.getSecurityScore(),
      cspViolations: this.cspViolations.length,
      allowedOrigins: this.config.cors.origins.length,
      timestamp: Date.now()
    };
  }

  getCSPViolations(limit = 50) {
    return this.cspViolations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  clearCSPViolations() {
    this.cspViolations = [];
    this.stats.cspViolations = 0;
  }

  // Export configuration
  exportConfig() {
    return {
      config: this.config,
      stats: this.getStats(),
      cspViolations: this.getCSPViolations(),
      timestamp: Date.now()
    };
  }

  // Import configuration
  importConfig(configData) {
    if (configData.config) {
      this.config = { ...this.config, ...configData.config };
    }
    
    if (configData.stats) {
      this.stats = { ...this.stats, ...configData.stats };
    }
  }

  // Generate security report
  generateSecurityReport() {
    const score = this.getSecurityScore();
    const violations = this.getCSPViolations(10);
    
    return {
      timestamp: new Date().toISOString(),
      securityScore: score,
      grade: this.getSecurityGrade(score),
      headers: {
        csp: this.config.headers.csp.enable,
        hsts: this.config.headers.hsts.enable,
        frameOptions: this.config.headers.frameOptions.enable,
        contentTypeOptions: this.config.headers.contentTypeOptions.enable,
        referrerPolicy: this.config.headers.referrerPolicy.enable,
        permissionsPolicy: this.config.headers.permissionsPolicy.enable
      },
      cors: {
        enabled: this.config.cors.enable,
        origins: this.config.cors.origins.length,
        credentials: this.config.cors.credentials
      },
      violations: {
        total: this.stats.cspViolations,
        recent: violations.length
      },
      recommendations: this.getRecommendations(score)
    };
  }

  getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getRecommendations(score) {
    const recommendations = [];
    
    if (!this.config.headers.csp.enable) {
      recommendations.push('Enable Content Security Policy (CSP)');
    }
    
    if (!this.config.headers.hsts.enable) {
      recommendations.push('Enable HTTP Strict Transport Security (HSTS)');
    }
    
    if (!this.config.headers.frameOptions.enable) {
      recommendations.push('Enable X-Frame-Options to prevent clickjacking');
    }
    
    if (this.stats.cspViolations > 0) {
      recommendations.push('Review and fix CSP violations');
    }
    
    if (!this.config.cors.credentials && this.config.cors.origins.length > 1) {
      recommendations.push('Consider enabling CORS credentials for multiple origins');
    }
    
    return recommendations;
  }
}

module.exports = SecurityHeaders;
