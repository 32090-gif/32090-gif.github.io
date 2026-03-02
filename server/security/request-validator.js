/**
 * Advanced Request Validation and Sanitization System
 * ระบบตรวจสอบและทำความสะอาดคำขอขั้นสูง
 */

const crypto = require('crypto');
const validator = require('validator'); // npm install validator
const EventEmitter = require('events');

class RequestValidator extends EventEmitter {
  constructor(options = {}) {
    this.config = {
      // General validation
      maxRequestSize: options.maxRequestSize || 10 * 1024 * 1024, // 10MB
      maxHeaderSize: options.maxHeaderSize || 8192, // 8KB
      maxURLLength: options.maxURLLength || 2048,
      
      // Parameter validation
      parameters: {
        maxParamCount: options.maxParamCount || 50,
        maxParamNameLength: options.maxParamNameLength || 100,
        maxParamValueLength: options.maxParamValueLength || 10000,
        allowedChars: options.allowedParamChars || /^[a-zA-Z0-9._-]+$/
      },
      
      // Content validation
      content: {
        allowedMimeTypes: options.allowedMimeTypes || [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ],
        maxJSONDepth: options.maxJSONDepth || 10,
        validateJSON: options.validateJSON !== false
      },
      
      // Security patterns
      security: {
        enableXSSProtection: options.enableXSSProtection !== false,
        enableSQLInjectionProtection: options.enableSQLInjectionProtection !== false,
        enableCSRFProtection: options.enableCSRFProtection !== false,
        enablePathTraversalProtection: options.enablePathTraversalProtection !== false,
        enableCommandInjectionProtection: options.enableCommandInjectionProtection !== false
      },
      
      // Logging
      logging: {
        enableLogging: options.enableLogging !== false,
        logFile: options.logFile || require('path').join(__dirname, '../logs/validation.log')
      }
    };

    // Attack patterns
    this.attackPatterns = {
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi,
        /<link\b[^>]*>/gi,
        /<meta\b[^>]*>/gi,
        /<style\b[^>]*>/gi,
        /expression\s*\(/gi
      ],
      
      sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|(\\')|(;)|(\%27)|(\%3B))/gi,
        /((\%3C)|<).*((\%3E)|>)/gi,
        /((\%3D)|=)[^\n]*((\%27)|'|(\%3B)|;)/gi,
        /\w*(\%27)|('|(\%3B))\w*/gi,
        /((\%27)|'|(\%3B))\s*union/gi,
        /union\s+all/gi,
        /union\s+select/gi,
        /concat\s*\(/gi,
        /char\s*\(/gi,
        /ascii\s*\(/gi,
        /substring\s*\(/gi
      ],
      
      pathTraversal: [
        /\.\.\//g,
        /\.\.\\/g,
        /\.\.[\/\\]/g,
        /%2e%2e[\/\\]/gi,
        /%c0%ae[\/\\]/gi,
        /%c1%9c[\/\\]/gi
      ],
      
      commandInjection: [
        /[;&|`$(){}[\]]/g,
        /\b(cat|ls|ps|kill|chmod|chown|rm|mv|cp|tar|gzip|gunzip|whoami|id|uname|pwd)\b/gi,
        /\b(nc|netcat|telnet|ssh|ftp|wget|curl)\b/gi,
        /\b(python|perl|ruby|php|node|java)\b/gi,
        /\b(echo|printf|print|read|export|env|set)\b/gi
      ],
      
      ldapInjection: [
        /[()=,*!&|]/g,
        /\*\)\(/g,
        /\)\(.*\*/g
      ],
      
      xPathInjection: [
        /['"]/g,
        /[()=,*<>]/g,
        /or\s+1\s*=\s*1/gi,
        /and\s+1\s*=\s*1/gi
      ]
    };

    // Statistics
    this.stats = {
      totalRequests: 0,
      validRequests: 0,
      blockedRequests: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      pathTraversalAttempts: 0,
      commandInjectionAttempts: 0,
      otherAttacks: 0
    };

    // Initialize
    this.init();
  }

  init() {
    // Create logs directory
    const logDir = require('path').dirname(this.config.logging.logFile);
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    console.log('🔍 Request Validation System initialized');
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      this.stats.totalRequests++;

      try {
        // Validate request basics
        const basicValidation = this.validateBasicRequest(req);
        if (!basicValidation.valid) {
          this.handleInvalidRequest(req, res, basicValidation);
          return;
        }

        // Validate headers
        const headerValidation = this.validateHeaders(req);
        if (!headerValidation.valid) {
          this.handleInvalidRequest(req, res, headerValidation);
          return;
        }

        // Validate URL and parameters
        const urlValidation = this.validateURL(req);
        if (!urlValidation.valid) {
          this.handleInvalidRequest(req, res, urlValidation);
          return;
        }

        // Validate query parameters
        const queryValidation = this.validateQueryParameters(req);
        if (!queryValidation.valid) {
          this.handleInvalidRequest(req, res, queryValidation);
          return;
        }

        // Validate body if present
        const bodyValidation = this.validateBody(req);
        if (!bodyValidation.valid) {
          this.handleInvalidRequest(req, res, bodyValidation);
          return;
        }

        // Check for attack patterns
        const securityValidation = this.checkSecurityPatterns(req);
        if (!securityValidation.valid) {
          this.handleSecurityViolation(req, res, securityValidation);
          return;
        }

        // Sanitize request data
        this.sanitizeRequest(req);

        this.stats.validRequests++;
        next();

      } catch (error) {
        this.logSecurity(`Validation error: ${error.message}`);
        this.handleValidationError(req, res, error);
      }
    };
  }

  validateBasicRequest(req) {
    // Check request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > this.config.maxRequestSize) {
      return {
        valid: false,
        reason: 'Request too large',
        code: 'REQUEST_TOO_LARGE',
        maxSize: this.config.maxRequestSize,
        actualSize: contentLength
      };
    }

    // Check URL length
    if (req.url && req.url.length > this.config.maxURLLength) {
      return {
        valid: false,
        reason: 'URL too long',
        code: 'URL_TOO_LONG',
        maxLength: this.config.maxURLLength,
        actualLength: req.url.length
      };
    }

    return { valid: true };
  }

  validateHeaders(req) {
    const headers = req.headers;
    let totalHeaderSize = 0;

    // Check total header size
    for (const [name, value] of Object.entries(headers)) {
      totalHeaderSize += name.length + (value ? value.length : 0);
    }

    if (totalHeaderSize > this.config.maxHeaderSize) {
      return {
        valid: false,
        reason: 'Headers too large',
        code: 'HEADERS_TOO_LARGE',
        maxSize: this.config.maxHeaderSize,
        actualSize: totalHeaderSize
      };
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'x-cluster-client-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr'
    ];

    let proxyScore = 0;
    suspiciousHeaders.forEach(header => {
      if (headers[header]) {
        proxyScore++;
      }
    });

    if (proxyScore >= 3) {
      this.logSecurity(`High proxy score: ${proxyScore} from ${req.ip}`);
    }

    return { valid: true, proxyScore };
  }

  validateURL(req) {
    const url = req.url;
    
    // Check for null bytes
    if (url.includes('\0')) {
      return {
        valid: false,
        reason: 'Null bytes in URL',
        code: 'NULL_BYTES_IN_URL'
      };
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f]/.test(url)) {
      return {
        valid: false,
        reason: 'Control characters in URL',
        code: 'CONTROL_CHARS_IN_URL'
      };
    }

    return { valid: true };
  }

  validateQueryParameters(req) {
    const query = req.query || {};
    const paramCount = Object.keys(query).length;

    if (paramCount > this.config.parameters.maxParamCount) {
      return {
        valid: false,
        reason: 'Too many parameters',
        code: 'TOO_MANY_PARAMS',
        maxParams: this.config.parameters.maxParamCount,
        actualParams: paramCount
      };
    }

    for (const [name, value] of Object.entries(query)) {
      // Check parameter name
      if (name.length > this.config.parameters.maxParamNameLength) {
        return {
          valid: false,
          reason: 'Parameter name too long',
          code: 'PARAM_NAME_TOO_LONG',
          param: name,
          maxLength: this.config.parameters.maxParamNameLength
        };
      }

      // Check parameter value
      if (typeof value === 'string' && value.length > this.config.parameters.maxParamValueLength) {
        return {
          valid: false,
          reason: 'Parameter value too long',
          code: 'PARAM_VALUE_TOO_LONG',
          param: name,
          maxLength: this.config.parameters.maxParamValueLength
        };
      }

      // Check allowed characters in parameter name
      if (!this.config.parameters.allowedChars.test(name)) {
        return {
          valid: false,
          reason: 'Invalid characters in parameter name',
          code: 'INVALID_PARAM_CHARS',
          param: name
        };
      }
    }

    return { valid: true };
  }

  validateBody(req) {
    if (!req.body && !req.rawBody) {
      return { valid: true }; // No body to validate
    }

    const contentType = req.headers['content-type'] || '';
    
    // Check content type
    const isAllowedType = this.config.content.allowedMimeTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowedType) {
      return {
        valid: false,
        reason: 'Content type not allowed',
        code: 'INVALID_CONTENT_TYPE',
        contentType
      };
    }

    // Validate JSON if present
    if (contentType.includes('application/json') && this.config.content.validateJSON) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const depth = this.getJSONDepth(body);
        
        if (depth > this.config.content.maxJSONDepth) {
          return {
            valid: false,
            reason: 'JSON depth too large',
            code: 'JSON_DEPTH_EXCEEDED',
            maxDepth: this.config.content.maxJSONDepth,
            actualDepth: depth
          };
        }
      } catch (error) {
        return {
          valid: false,
          reason: 'Invalid JSON',
          code: 'INVALID_JSON',
          error: error.message
        };
      }
    }

    return { valid: true };
  }

  getJSONDepth(obj, depth = 0) {
    if (depth > this.config.content.maxJSONDepth) {
      return depth;
    }

    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const currentDepth = this.getJSONDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  checkSecurityPatterns(req) {
    const results = {
      valid: true,
      detections: []
    };

    // Collect all input data
    const inputData = {
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers
    };

    const inputString = this.serializeInput(inputData);

    // Check XSS patterns
    if (this.config.security.enableXSSProtection) {
      for (const pattern of this.attackPatterns.xss) {
        if (pattern.test(inputString)) {
          results.detections.push({
            type: 'xss',
            pattern: pattern.toString(),
            severity: 'high'
          });
          this.stats.xssAttempts++;
        }
      }
    }

    // Check SQL injection patterns
    if (this.config.security.enableSQLInjectionProtection) {
      for (const pattern of this.attackPatterns.sqlInjection) {
        if (pattern.test(inputString)) {
          results.detections.push({
            type: 'sql_injection',
            pattern: pattern.toString(),
            severity: 'critical'
          });
          this.stats.sqlInjectionAttempts++;
        }
      }
    }

    // Check path traversal patterns
    if (this.config.security.enablePathTraversalProtection) {
      for (const pattern of this.attackPatterns.pathTraversal) {
        if (pattern.test(inputString)) {
          results.detections.push({
            type: 'path_traversal',
            pattern: pattern.toString(),
            severity: 'high'
          });
          this.stats.pathTraversalAttempts++;
        }
      }
    }

    // Check command injection patterns
    if (this.config.security.enableCommandInjectionProtection) {
      for (const pattern of this.attackPatterns.commandInjection) {
        if (pattern.test(inputString)) {
          results.detections.push({
            type: 'command_injection',
            pattern: pattern.toString(),
            severity: 'critical'
          });
          this.stats.commandInjectionAttempts++;
        }
      }
    }

    // Determine if request should be blocked
    const hasCriticalThreats = results.detections.some(d => d.severity === 'critical');
    const hasMultipleThreats = results.detections.length >= 2;

    if (hasCriticalThreats || hasMultipleThreats) {
      results.valid = false;
      this.stats.blockedRequests++;
    }

    return results;
  }

  serializeInput(data) {
    const parts = [];
    
    const serialize = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          serialize(value, fullKey);
        } else {
          parts.push(`${fullKey}=${value}`);
        }
      }
    };

    serialize(data);
    return parts.join('&');
  }

  sanitizeRequest(req) {
    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }
  }

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  sanitizeString(str) {
    if (typeof str !== 'string') {
      return str;
    }

    // Remove null bytes
    str = str.replace(/\0/g, '');
    
    // Remove control characters except newlines and tabs
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize whitespace
    str = str.replace(/\s+/g, ' ').trim();
    
    // Escape HTML entities (basic XSS protection)
    str = str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#x27;');

    return str;
  }

  handleInvalidRequest(req, res, validation) {
    this.stats.blockedRequests++;
    this.logSecurity(`Request blocked: ${validation.reason} - IP: ${req.ip} - ${req.method} ${req.url}`);

    res.status(400).json({
      error: 'Bad Request',
      message: validation.reason,
      code: validation.code,
      details: validation
    });
  }

  handleSecurityViolation(req, res, security) {
    this.stats.blockedRequests++;
    this.stats.otherAttacks++;

    const detectionTypes = security.detections.map(d => d.type).join(', ');
    this.logSecurity(`Security violation: ${detectionTypes} - IP: ${req.ip} - ${req.method} ${req.url}`);

    res.status(403).json({
      error: 'Security Violation',
      message: 'Request contains malicious content',
      detections: security.detections
    });
  }

  handleValidationError(req, res, error) {
    this.stats.blockedRequests++;
    
    res.status(500).json({
      error: 'Validation Error',
      message: 'Request validation failed'
    });
  }

  logSecurity(message) {
    if (!this.config.logging.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] VALIDATION: ${message}\n`;
    
    const fs = require('fs');
    fs.appendFile(this.config.logging.logFile, logMessage, (err) => {
      if (err) console.error('Failed to write validation log:', err);
    });
    
    console.log(`🔍 ${message}`);
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      timestamp: Date.now()
    };
  }

  // Add custom validation rules
  addCustomRule(name, pattern, severity = 'medium') {
    this.attackPatterns.custom = this.attackPatterns.custom || [];
    this.attackPatterns.custom.push({
      name,
      pattern: pattern instanceof RegExp ? pattern : new RegExp(pattern, 'gi'),
      severity
    });
  }

  // Remove custom validation rules
  removeCustomRule(name) {
    if (this.attackPatterns.custom) {
      this.attackPatterns.custom = this.attackPatterns.custom.filter(rule => rule.name !== name);
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
}

module.exports = RequestValidator;
