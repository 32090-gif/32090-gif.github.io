/**
 * Advanced Security Monitoring and Alerting System
 * ระบบตรวจสอบความปลอดภัยและแจ้งเตือนขั้นสูง
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring settings
      monitoring: {
        enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
        metricsRetentionPeriod: options.metricsRetentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
        aggregationInterval: options.aggregationInterval || 60 * 1000, // 1 minute
        batchSize: options.batchSize || 100
      },
      
      // Alert thresholds
      alerts: {
        enableAlerts: options.enableAlerts !== false,
        thresholds: {
          requestsPerMinute: options.requestsPerMinuteThreshold || 1000,
          errorRate: options.errorRateThreshold || 0.05, // 5%
          blockedRequestsRate: options.blockedRequestsRateThreshold || 0.1, // 10%
          uniqueIPsPerMinute: options.uniqueIPsPerMinuteThreshold || 100,
          suspiciousActivityScore: options.suspiciousActivityScoreThreshold || 50
        },
        cooldownPeriod: options.alertCooldownPeriod || 5 * 60 * 1000, // 5 minutes
        escalationThreshold: options.escalationThreshold || 3 // Escalate after 3 alerts
      },
      
      // Logging
      logging: {
        enableFileLogging: options.enableFileLogging !== false,
        logDirectory: options.logDirectory || path.join(__dirname, '../logs'),
        logLevel: options.logLevel || 'info',
        maxLogFileSize: options.maxLogFileSize || 10 * 1024 * 1024, // 10MB
        logRetention: options.logRetention || 30 // days
      },
      
      // Notifications
      notifications: {
        enableWebhook: options.enableWebhook !== false,
        webhookURL: options.webhookURL,
        webhookTimeout: options.webhookTimeout || 5000,
        enableEmail: options.enableEmail !== false,
        emailSettings: options.emailSettings || {},
        enableSlack: options.enableSlack !== false,
        slackWebhook: options.slackWebhook
      }
    };

    // Data storage
    this.metrics = new Map(); // timestamp -> metrics data
    this.alerts = new Map(); // alertId -> alert data
    this.activeAlerts = new Map(); // alertType -> last alert time
    this.alertHistory = []; // All alerts history
    this.systemHealth = {
      status: 'healthy',
      lastCheck: Date.now(),
      issues: []
    };

    // Real-time counters
    this.counters = {
      totalRequests: 0,
      blockedRequests: 0,
      errorRequests: 0,
      suspiciousRequests: 0,
      uniqueIPs: new Set(),
      currentMinuteRequests: 0,
      currentMinuteStart: Math.floor(Date.now() / 60000) * 60000
    };

    // Statistics
    this.stats = {
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      infoAlerts: 0,
      falsePositives: 0,
      averageResponseTime: 0,
      uptime: Date.now()
    };

    // Initialize
    this.init();
  }

  init() {
    // Create log directory
    if (this.config.logging.enableFileLogging && !fs.existsSync(this.config.logging.logDirectory)) {
      fs.mkdirSync(this.config.logging.logDirectory, { recursive: true });
    }

    // Setup event handlers
    this.setupEventHandlers();

    // Setup periodic tasks
    this.setupPeriodicTasks();

    // Load historical data
    this.loadHistoricalData();

    console.log('📊 Security Monitoring System initialized');
  }

  setupPeriodicTasks() {
    // Aggregate metrics every minute
    setInterval(() => this.aggregateMetrics(), this.config.monitoring.aggregationInterval);

    // Check system health every 30 seconds
    setInterval(() => this.checkSystemHealth(), 30 * 1000);

    // Cleanup old data every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);

    // Rotate logs daily
    setInterval(() => this.rotateLogs(), 24 * 60 * 60 * 1000);
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const clientIP = this.getClientIP(req);

      // Update counters
      this.updateCounters(clientIP);

      // Monitor request
      this.monitorRequest(req, res, startTime);

      // Setup response monitoring
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Monitor response
        this.emit('response', {
          req,
          res,
          responseTime,
          statusCode: res.statusCode,
          size: data ? data.length || 0 : 0
        });

        return originalSend.call(this, data);
      }.bind(this);

      res.json = function(data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Monitor response
        this.emit('response', {
          req,
          res,
          responseTime,
          statusCode: res.statusCode,
          size: JSON.stringify(data).length
        });

        return originalJson.call(this, data);
      }.bind(this);

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

  updateCounters(ip) {
    this.counters.totalRequests++;
    this.counters.uniqueIPs.add(ip);

    // Reset minute counter if needed
    const currentMinute = Math.floor(Date.now() / 60000) * 60000;
    if (currentMinute > this.counters.currentMinuteStart) {
      this.counters.currentMinuteStart = currentMinute;
      this.counters.currentMinuteRequests = 1;
    } else {
      this.counters.currentMinuteRequests++;
    }
  }

  monitorRequest(req, res, startTime) {
    const requestData = {
      timestamp: startTime,
      ip: this.getClientIP(req),
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers.referer || '',
      contentType: req.headers['content-type'] || '',
      contentLength: parseInt(req.headers['content-length'] || '0'),
      headers: req.headers
    };

    // Emit request event for monitoring
    this.emit('request', requestData);

    // Check for suspicious patterns
    this.checkSuspiciousPatterns(requestData);
  }

  checkSuspiciousPatterns(requestData) {
    let suspicionScore = 0;
    const reasons = [];

    // Check for unusual user agents
    if (this.isSuspiciousUserAgent(requestData.userAgent)) {
      suspicionScore += 20;
      reasons.push('Suspicious user agent');
    }

    // Check for unusual request patterns
    if (this.isSuspiciousURL(requestData.url)) {
      suspicionScore += 30;
      reasons.push('Suspicious URL pattern');
    }

    // Check for missing headers
    if (!requestData.userAgent || requestData.userAgent.length < 10) {
      suspicionScore += 15;
      reasons.push('Missing or short user agent');
    }

    // Check for large requests
    if (requestData.contentLength > 1024 * 1024) { // 1MB
      suspicionScore += 10;
      reasons.push('Large request size');
    }

    // Update suspicious counter
    if (suspicionScore > 0) {
      this.counters.suspiciousRequests++;
      
      this.emit('suspicious-activity', {
        ...requestData,
        suspicionScore,
        reasons
      });

      // Check if alert should be triggered
      if (suspicionScore >= this.config.alerts.thresholds.suspiciousActivityScore) {
        this.triggerAlert('high_suspicion', {
          score: suspicionScore,
          reasons,
          request: requestData
        });
      }
    }
  }

  isSuspiciousUserAgent(userAgent) {
    const suspiciousPatterns = [
      /^$/, // Empty
      /^[a-z]+$/, // Only lowercase
      /^[A-Z]+$/, // Only uppercase
      /^\d+$/, // Only numbers
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|java|go-http|node|ruby|php/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  isSuspiciousURL(url) {
    const suspiciousPatterns = [
      /\.\.[\/\\]/, // Path traversal
      /union\s+select|drop\s+table|insert\s+into/i, // SQL injection
      /<script|javascript:|on\w+\s*=/i, // XSS
      /\.\./, // Directory traversal
      /\/etc\/passwd|\/windows\/system32/i, // System files
      /admin|administrator|root/i // Admin paths
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  // Event handlers
  on(event, listener) {
    super.on(event, listener);
  }

  setupEventHandlers() {
    this.on('request', (data) => {
      this.logEvent('request', data);
    });

    this.on('response', (data) => {
      this.logEvent('response', data);
      
      // Update error counter
      if (data.statusCode >= 400) {
        this.counters.errorRequests++;
      }

      // Update blocked counter
      if (data.statusCode === 403 || data.statusCode === 429) {
        this.counters.blockedRequests++;
      }

      // Update average response time
      this.updateAverageResponseTime(data.responseTime);
    });

    this.on('suspicious-activity', (data) => {
      this.logEvent('suspicious', data);
    });

    this.on('bot-detected', (data) => {
      this.logEvent('bot-detected', data);
      this.triggerAlert('bot_detected', data);
    });

    this.on('security-violation', (data) => {
      this.logEvent('security-violation', data);
      this.triggerAlert('security_violation', data);
    });
  }

  // Alert system
  triggerAlert(type, data) {
    const alertId = crypto.randomBytes(8).toString('hex');
    const now = Date.now();

    // Check cooldown period
    const lastAlert = this.activeAlerts.get(type);
    if (lastAlert && now - lastAlert < this.config.alerts.cooldownPeriod) {
      return; // Still in cooldown
    }

    const alert = {
      id: alertId,
      type,
      severity: this.getAlertSeverity(type),
      timestamp: now,
      message: this.generateAlertMessage(type, data),
      data,
      acknowledged: false,
      escalated: false
    };

    // Store alert
    this.alerts.set(alertId, alert);
    this.activeAlerts.set(type, now);
    this.alertHistory.push(alert);

    // Update statistics
    this.stats.totalAlerts++;
    if (alert.severity === 'critical') this.stats.criticalAlerts++;
    else if (alert.severity === 'warning') this.stats.warningAlerts++;
    else this.stats.infoAlerts++;

    // Log alert
    this.logEvent('alert', alert);

    // Send notifications
    this.sendNotifications(alert);

    // Emit alert event
    this.emit('alert', alert);

    // Check for escalation
    this.checkEscalation(type);
  }

  getAlertSeverity(type) {
    const severityMap = {
      'high_suspicion': 'warning',
      'bot_detected': 'warning',
      'security_violation': 'critical',
      'rate_limit_exceeded': 'warning',
      'ip_blocked': 'info',
      'system_health': 'critical',
      'ddos_detected': 'critical'
    };

    return severityMap[type] || 'info';
  }

  generateAlertMessage(type, data) {
    const messages = {
      'high_suspicion': `High suspicion score detected: ${data.score}`,
      'bot_detected': `Bot detected from IP ${data.ip}`,
      'security_violation': `Security violation: ${data.reason}`,
      'rate_limit_exceeded': `Rate limit exceeded for IP ${data.ip}`,
      'ip_blocked': `IP ${data.ip} has been blocked`,
      'system_health': `System health issue: ${data.issue}`,
      'ddos_detected': `DDoS attack detected`
    };

    return messages[type] || `Security alert: ${type}`;
  }

  checkEscalation(type) {
    const typeAlerts = this.alertHistory.filter(alert => alert.type === type);
    if (typeAlerts.length >= this.config.alerts.escalationThreshold) {
      const latestAlert = typeAlerts[typeAlerts.length - 1];
      latestAlert.escalated = true;
      
      this.triggerAlert('escalated', {
        originalType: type,
        count: typeAlerts.length,
        originalAlert: latestAlert
      });
    }
  }

  // Notification system
  async sendNotifications(alert) {
    const notifications = [];

    if (this.config.notifications.enableWebhook && this.config.notifications.webhookURL) {
      notifications.push(this.sendWebhookNotification(alert));
    }

    if (this.config.notifications.enableSlack && this.config.notifications.slackWebhook) {
      notifications.push(this.sendSlackNotification(alert));
    }

    if (this.config.notifications.enableEmail) {
      notifications.push(this.sendEmailNotification(alert));
    }

    try {
      await Promise.all(notifications);
    } catch (error) {
      this.logEvent('notification-error', { alert, error: error.message });
    }
  }

  async sendWebhookNotification(alert) {
    try {
      const payload = {
        alert,
        timestamp: Date.now(),
        service: 'security-monitor'
      };

      // In production, use actual HTTP client
      this.logEvent('webhook-notification', payload);
    } catch (error) {
      this.logEvent('webhook-error', { alert, error: error.message });
    }
  }

  async sendSlackNotification(alert) {
    try {
      const payload = {
        text: `🚨 Security Alert: ${alert.message}`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 
                 alert.severity === 'warning' ? 'warning' : 'good',
          fields: [
            { title: 'Type', value: alert.type, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
          ]
        }]
      };

      // In production, use actual Slack webhook
      this.logEvent('slack-notification', payload);
    } catch (error) {
      this.logEvent('slack-error', { alert, error: error.message });
    }
  }

  async sendEmailNotification(alert) {
    try {
      const email = {
        to: this.config.notifications.emailSettings.to,
        subject: `Security Alert: ${alert.type}`,
        text: `Alert: ${alert.message}\n\nDetails: ${JSON.stringify(alert.data, null, 2)}`
      };

      // In production, use actual email service
      this.logEvent('email-notification', email);
    } catch (error) {
      this.logEvent('email-error', { alert, error: error.message });
    }
  }

  // Metrics aggregation
  aggregateMetrics() {
    const now = Date.now();
    const minuteStart = Math.floor(now / 60000) * 60000;

    const metrics = {
      timestamp: minuteStart,
      requests: this.counters.currentMinuteRequests,
      uniqueIPs: this.counters.uniqueIPs.size,
      blockedRequests: this.counters.blockedRequests,
      errorRequests: this.counters.errorRequests,
      suspiciousRequests: this.counters.suspiciousRequests,
      averageResponseTime: this.stats.averageResponseTime,
      errorRate: this.counters.totalRequests > 0 ? this.counters.errorRequests / this.counters.totalRequests : 0,
      blockRate: this.counters.totalRequests > 0 ? this.counters.blockedRequests / this.counters.totalRequests : 0
    };

    // Store metrics
    this.metrics.set(minuteStart, metrics);

    // Check thresholds
    this.checkThresholds(metrics);

    // Reset counters for next minute
    this.counters.currentMinuteRequests = 0;
    this.counters.uniqueIPs.clear();
    this.counters.blockedRequests = 0;
    this.counters.errorRequests = 0;
    this.counters.suspiciousRequests = 0;

    // Emit metrics event
    this.emit('metrics', metrics);
  }

  checkThresholds(metrics) {
    const thresholds = this.config.alerts.thresholds;

    if (metrics.requests > thresholds.requestsPerMinute) {
      this.triggerAlert('high_requests', metrics);
    }

    if (metrics.errorRate > thresholds.errorRate) {
      this.triggerAlert('high_error_rate', metrics);
    }

    if (metrics.blockRate > thresholds.blockedRequestsRate) {
      this.triggerAlert('high_block_rate', metrics);
    }

    if (metrics.uniqueIPs > thresholds.uniqueIPsPerMinute) {
      this.triggerAlert('high_unique_ips', metrics);
    }
  }

  // System health check
  checkSystemHealth() {
    const now = Date.now();
    const issues = [];

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal * 100;
    if (memUsagePercent > 90) {
      issues.push({
        type: 'memory',
        severity: 'critical',
        message: `High memory usage: ${memUsagePercent.toFixed(2)}%`
      });
    }

    // Check uptime
    const uptime = now - this.stats.uptime;
    if (uptime < 60000) { // Less than 1 minute
      issues.push({
        type: 'uptime',
        severity: 'warning',
        message: 'Service recently restarted'
      });
    }

    // Check alert rate
    const recentAlerts = this.alertHistory.filter(alert => 
      now - alert.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentAlerts.length > 10) {
      issues.push({
        type: 'alert_rate',
        severity: 'warning',
        message: `High alert rate: ${recentAlerts.length} alerts in 5 minutes`
      });
    }

    // Update system health
    this.systemHealth = {
      status: issues.length === 0 ? 'healthy' : 
              issues.some(i => i.severity === 'critical') ? 'critical' : 'degraded',
      lastCheck: now,
      issues
    };

    if (issues.length > 0) {
      this.triggerAlert('system_health', { issues });
    }
  }

  updateAverageResponseTime(responseTime) {
    const alpha = 0.1; // Smoothing factor
    this.stats.averageResponseTime = this.stats.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  // Logging system
  logEvent(level, data) {
    if (!this.config.logging.enableFileLogging) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      data
    };

    const logFile = path.join(this.config.logging.logDirectory, `security-${level}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
  }

  // Data persistence
  loadHistoricalData() {
    // Load historical metrics and alerts
    try {
      const dataFile = path.join(this.config.logging.logDirectory, 'monitoring-data.json');
      if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        
        if (data.metrics) {
          this.metrics = new Map(data.metrics);
        }
        
        if (data.alertHistory) {
          this.alertHistory = data.alertHistory;
        }
        
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  saveData() {
    try {
      const dataFile = path.join(this.config.logging.logDirectory, 'monitoring-data.json');
      const data = {
        metrics: Array.from(this.metrics.entries()),
        alertHistory: this.alertHistory,
        stats: this.stats,
        timestamp: Date.now()
      };

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save monitoring data:', error);
    }
  }

  // Cleanup old data
  cleanup() {
    const now = Date.now();
    const cutoffTime = now - this.config.monitoring.metricsRetentionPeriod;

    // Clean old metrics
    for (const [timestamp, metrics] of this.metrics.entries()) {
      if (timestamp < cutoffTime) {
        this.metrics.delete(timestamp);
      }
    }

    // Clean old alerts
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp > cutoffTime
    );

    // Clean active alerts that are too old
    for (const [type, lastAlert] of this.activeAlerts.entries()) {
      if (now - lastAlert > this.config.alerts.cooldownPeriod * 10) {
        this.activeAlerts.delete(type);
      }
    }

    // Save cleaned data
    this.saveData();
  }

  rotateLogs() {
    if (!this.config.logging.enableFileLogging) return;

    const logDir = this.config.logging.logDirectory;
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        // Rotate if file is too old or too large
        const age = Date.now() - stats.mtime.getTime();
        if (age > this.config.logging.logRetention * 24 * 60 * 60 * 1000 || 
            stats.size > this.config.logging.maxLogFileSize) {
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = path.join(logDir, `${file}.${timestamp}`);
          fs.renameSync(filePath, rotatedFile);
        }
      }
    });
  }

  // API methods
  getMetrics(timeRange = 3600000) { // Default 1 hour
    const now = Date.now();
    const startTime = now - timeRange;
    
    const filteredMetrics = [];
    for (const [timestamp, metrics] of this.metrics.entries()) {
      if (timestamp >= startTime) {
        filteredMetrics.push({ timestamp, ...metrics });
      }
    }

    return filteredMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  getAlerts(severity = null, limit = 50) {
    let alerts = [...this.alertHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts.slice(0, limit);
  }

  getSystemHealth() {
    return this.systemHealth;
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.uptime,
      currentMetrics: {
        requestsPerMinute: this.counters.currentMinuteRequests,
        uniqueIPs: this.counters.uniqueIPs.size,
        totalRequests: this.counters.totalRequests
      },
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      this.saveData();
      return true;
    }
    return false;
  }

  // Manual alert trigger
  manualAlert(type, message, data = {}) {
    this.triggerAlert(type, { message, ...data });
  }
}

module.exports = SecurityMonitor;
