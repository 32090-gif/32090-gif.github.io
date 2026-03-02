/**
 * Advanced Bot Detection and Challenge System
 * ระบบตรวจจับและท้าทาย Bot ขั้นสูง
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class BotDetection extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Detection thresholds
      thresholds: {
        userAgentScore: options.userAgentThreshold || 30,
        behaviorScore: options.behaviorThreshold || 40,
        requestPatternScore: options.requestPatternThreshold || 35,
        totalScore: options.totalThreshold || 50
      },
      
      // Challenge system
      challenges: {
        enable: options.enableChallenges !== false,
        types: options.challengeTypes || ['math', 'captcha', 'puzzle'],
        difficulty: options.challengeDifficulty || 'medium',
        expiration: options.challengeExpiration || 10 * 60 * 1000, // 10 minutes
        maxAttempts: options.maxChallengeAttempts || 3
      },
      
      // Honeypot
      honeypot: {
        enable: options.enableHoneypot !== false,
        fieldName: options.honeypotFieldName || 'confirm_email',
        trapUrls: options.honeypotUrls || ['/wp-admin', '/admin', '/robots.txt']
      },
      
      // Behavioral analysis
      behavior: {
        enableBehaviorAnalysis: options.enableBehaviorAnalysis !== false,
        trackingWindow: options.behaviorTrackingWindow || 30 * 60 * 1000, // 30 minutes
        minHumanActions: options.minHumanActions || 3,
        suspiciousPatterns: options.suspiciousPatterns || true
      },
      
      // Machine learning (simplified)
      ml: {
        enable: options.enableML !== false,
        modelUpdateInterval: options.modelUpdateInterval || 60 * 60 * 1000, // 1 hour
        trainingDataSize: options.trainingDataSize || 1000
      }
    };

    // Storage
    this.sessionData = new Map(); // sessionID -> session data
    this.ipProfiles = new Map(); // IP -> behavioral profile
    this.activeChallenges = new Map(); // sessionID -> challenge data
    this.verifiedSessions = new Set(); // Verified human sessions
    this.blockedSessions = new Set(); // Blocked bot sessions
    
    // Statistics
    this.stats = {
      totalSessions: 0,
      detectedBots: 0,
      verifiedHumans: 0,
      challengesIssued: 0,
      challengesPassed: 0,
      challengesFailed: 0,
      honeypotTriggers: 0,
      falsePositives: 0
    };

    // Bot signatures
    this.botSignatures = {
      userAgents: [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /java/i,
        /go-http/i, /node/i, /ruby/i, /php/i,
        /perl/i, /lwp/i, /mechanize/i, /selenium/i,
        /phantom/i, /headless/i, /chromeless/i
      ],
      
      suspiciousUserAgents: [
        /^$/, // Empty user agent
        /^[a-z]+$/, // Only lowercase letters
        /^[A-Z]+$/, // Only uppercase letters
        /^\d+$/, // Only numbers
        /^(.{0,5}|.{50,})$/ // Too short or too long
      ],
      
      knownBots: [
        'googlebot', 'bingbot', 'slurp', 'duckduckbot',
        'baiduspider', 'yandexbot', 'facebookexternalhit',
        'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot'
      ]
    };

    // Initialize
    this.init();
  }

  init() {
    // Setup ML model update interval
    if (this.config.ml.enable) {
      setInterval(() => this.updateMLModel(), this.config.ml.modelUpdateInterval);
    }
    
    // Cleanup expired data
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    
    console.log('🤖 Bot Detection System initialized');
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      const sessionId = this.getSessionId(req);
      const clientIP = this.getClientIP(req);
      
      // Initialize session if needed
      if (!this.sessionData.has(sessionId)) {
        this.initializeSession(sessionId, clientIP, req);
      }

      const session = this.sessionData.get(sessionId);
      
      // Skip detection for verified humans
      if (this.verifiedSessions.has(sessionId)) {
        this.updateSessionActivity(session, req);
        return next();
      }

      // Skip detection for blocked sessions
      if (this.blockedSessions.has(sessionId)) {
        this.handleBlockedSession(req, res, sessionId);
        return;
      }

      // Update session data
      this.updateSessionActivity(session, req);

      // Check honeypot
      if (this.config.honeypot.enable && this.checkHoneypot(req)) {
        this.handleHoneypotTrigger(req, res, sessionId);
        return;
      }

      // Perform bot detection
      const detectionResult = this.detectBot(req, sessionId, clientIP);
      
      if (detectionResult.isBot) {
        if (this.config.challenges.enable) {
          this.issueChallenge(req, res, sessionId, detectionResult);
        } else {
          this.blockSession(sessionId, detectionResult.reason);
          this.handleBotDetected(req, res, detectionResult);
        }
        return;
      }

      // Request appears to be from a human
      next();
    };
  }

  getSessionId(req) {
    // Try to get existing session ID from various sources
    let sessionId = req.headers['x-session-id'] ||
                   req.cookies?.sessionId ||
                   req.query?.sessionId;

    // Generate new session ID if needed
    if (!sessionId) {
      sessionId = crypto.randomBytes(16).toString('hex');
    }

    return sessionId;
  }

  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  initializeSession(sessionId, ip, req) {
    const session = {
      id: sessionId,
      ip: ip,
      startTime: Date.now(),
      lastActivity: Date.now(),
      requests: [],
      userAgents: new Set(),
      endpoints: new Set(),
      behaviors: {
        mouseMovements: 0,
        keyboardEvents: 0,
        clicks: 0,
        scrolls: 0,
        touches: 0
      },
      scores: {
        userAgent: 0,
        behavior: 0,
        requestPattern: 0,
        total: 0
      },
      verified: false,
      blocked: false,
      challenges: []
    };

    this.sessionData.set(sessionId, session);
    this.stats.totalSessions++;
  }

  updateSessionActivity(session, req) {
    const now = Date.now();
    
    session.lastActivity = now;
    session.requests.push({
      timestamp: now,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers.referer || ''
    });

    session.userAgents.add(req.headers['user-agent'] || '');
    session.endpoints.add(req.path);

    // Keep only recent requests (within tracking window)
    const windowStart = now - this.config.behavior.trackingWindow;
    session.requests = session.requests.filter(req => req.timestamp > windowStart);
  }

  detectBot(req, sessionId, ip) {
    const session = this.sessionData.get(sessionId);
    const result = {
      isBot: false,
      confidence: 0,
      reasons: [],
      scores: {}
    };

    // User Agent Analysis
    const userAgentScore = this.analyzeUserAgent(req.headers['user-agent'] || '');
    result.scores.userAgent = userAgentScore;
    session.scores.userAgent = userAgentScore;

    // Request Pattern Analysis
    const requestPatternScore = this.analyzeRequestPattern(session);
    result.scores.requestPattern = requestPatternScore;
    session.scores.requestPattern = requestPatternScore;

    // Behavioral Analysis
    const behaviorScore = this.analyzeBehavior(session);
    result.scores.behavior = behaviorScore;
    session.scores.behavior = behaviorScore;

    // Machine Learning Analysis (if enabled)
    let mlScore = 0;
    if (this.config.ml.enable) {
      mlScore = this.analyzeWithML(session, req);
      result.scores.ml = mlScore;
    }

    // Calculate total score
    const totalScore = this.calculateTotalScore(result.scores);
    result.scores.total = totalScore;
    session.scores.total = totalScore;

    // Determine if bot
    result.isBot = totalScore >= this.config.thresholds.totalScore;
    result.confidence = Math.min(totalScore / 100, 1);

    // Generate reasons
    if (userAgentScore >= this.config.thresholds.userAgentScore) {
      result.reasons.push(`Suspicious user agent (${userAgentScore})`);
    }
    if (requestPatternScore >= this.config.thresholds.requestPatternScore) {
      result.reasons.push(`Suspicious request pattern (${requestPatternScore})`);
    }
    if (behaviorScore >= this.config.thresholds.behaviorScore) {
      result.reasons.push(`Suspicious behavior (${behaviorScore})`);
    }
    if (mlScore >= 70) {
      result.reasons.push(`ML model detected bot (${mlScore})`);
    }

    // Update statistics
    if (result.isBot) {
      this.stats.detectedBots++;
      this.emit('bot-detected', { sessionId, ip, result });
    }

    return result;
  }

  analyzeUserAgent(userAgent) {
    let score = 0;

    // Check against known bot signatures
    for (const pattern of this.botSignatures.userAgents) {
      if (pattern.test(userAgent)) {
        score += 40;
        break;
      }
    }

    // Check suspicious patterns
    for (const pattern of this.botSignatures.suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        score += 25;
      }
    }

    // Check for known legitimate bots (lower score)
    const lowerAgent = userAgent.toLowerCase();
    for (const knownBot of this.botSignatures.knownBots) {
      if (lowerAgent.includes(knownBot)) {
        score += 10;
        break;
      }
    }

    // Length analysis
    if (userAgent.length < 10 || userAgent.length > 200) {
      score += 15;
    }

    // Character analysis
    const hasSpecialChars = /[^\w\s\.\-\/\(\)\;:]/.test(userAgent);
    if (!hasSpecialChars && userAgent.length > 5) {
      score += 10; // Too clean
    }

    // Missing common browser identifiers
    const hasBrowser = /chrome|firefox|safari|edge|opera|msie/i.test(userAgent);
    if (!hasBrowser && userAgent.length > 20) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  analyzeRequestPattern(session) {
    let score = 0;
    const requests = session.requests;

    if (requests.length < 2) return score;

    // Request frequency analysis
    const recentRequests = requests.filter(req => 
      Date.now() - req.timestamp < 60000 // Last minute
    );

    if (recentRequests.length > 30) {
      score += 25; // Too many requests
    }

    // Request timing analysis (too consistent)
    if (recentRequests.length >= 3) {
      const intervals = [];
      for (let i = 1; i < recentRequests.length; i++) {
        intervals.push(recentRequests[i].timestamp - recentRequests[i-1].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => 
        sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;

      // Low variance = bot-like behavior
      if (variance < 1000) { // Very consistent timing
        score += 30;
      }
    }

    // Endpoint diversity analysis
    const uniqueEndpoints = session.endpoints.size;
    if (uniqueEndpoints === 1 && requests.length > 10) {
      score += 20; // Only hitting one endpoint
    }

    // User agent consistency
    if (session.userAgents.size === 1 && requests.length > 5) {
      score += 15; // Same user agent for all requests
    }

    // Sequential access patterns
    const endpoints = Array.from(session.endpoints);
    const isSequential = this.checkSequentialPattern(endpoints);
    if (isSequential) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  analyzeBehavior(session) {
    let score = 0;
    const behaviors = session.behaviors;
    const requestCount = session.requests.length;

    if (requestCount === 0) return score;

    // Human interaction indicators
    const totalInteractions = behaviors.mouseMovements + 
                             behaviors.keyboardEvents + 
                             behaviors.clicks + 
                             behaviors.scrolls + 
                             behaviors.touches;

    // Low interaction for many requests = suspicious
    if (requestCount > 10 && totalInteractions < 5) {
      score += 35;
    }

    // Perfect interaction patterns (too regular) = suspicious
    if (totalInteractions > 0) {
      const interactionRatio = totalInteractions / requestCount;
      if (interactionRatio > 2 && interactionRatio < 2.5) {
        score += 20; // Too perfect
      }
    }

    // No mouse movements but many clicks = suspicious
    if (behaviors.clicks > 5 && behaviors.mouseMovements === 0) {
      score += 30;
    }

    // Instant page transitions (no time spent) = suspicious
    const pageViews = session.requests.filter(req => 
      req.method === 'GET' && req.url.endsWith('.html')
    );

    if (pageViews.length > 5) {
      const avgPageTime = this.calculateAveragePageTime(pageViews);
      if (avgPageTime < 1000) { // Less than 1 second per page
        score += 25;
      }
    }

    return Math.min(score, 100);
  }

  analyzeWithML(session, req) {
    // Simplified ML analysis
    // In production, use actual ML models like TensorFlow.js
    
    const features = [
      session.requests.length,
      session.endpoints.size,
      session.userAgents.size,
      session.scores.userAgent,
      session.scores.requestPattern,
      this.getRequestFrequency(session),
      this.getUserAgentEntropy(req.headers['user-agent'] || '')
    ];

    // Simple weighted scoring (mock ML)
    const weights = [0.15, 0.10, 0.10, 0.25, 0.20, 0.10, 0.10];
    let score = 0;

    for (let i = 0; i < features.length; i++) {
      score += features[i] * weights[i];
    }

    return Math.min(score, 100);
  }

  calculateTotalScore(scores) {
    const weights = {
      userAgent: 0.3,
      behavior: 0.25,
      requestPattern: 0.25,
      ml: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [component, score] of Object.entries(scores)) {
      if (weights[component] && score !== undefined) {
        totalScore += score * weights[component];
        totalWeight += weights[component];
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  checkSequentialPattern(endpoints) {
    if (endpoints.length < 3) return false;

    // Check if endpoints follow a numeric or alphabetical pattern
    const numericPattern = /^\/\d+$/;
    const numericEndpoints = endpoints.filter(ep => numericPattern.test(ep));
    
    if (numericEndpoints.length >= 3) {
      const numbers = numericEndpoints.map(ep => parseInt(ep.slice(1)));
      numbers.sort((a, b) => a - b);
      
      // Check if they form a sequence
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] - numbers[i-1] !== 1) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  getRequestFrequency(session) {
    const requests = session.requests;
    if (requests.length < 2) return 0;

    const timeSpan = requests[requests.length - 1].timestamp - requests[0].timestamp;
    return timeSpan > 0 ? requests.length / (timeSpan / 1000) : 0; // Requests per second
  }

  getUserAgentEntropy(userAgent) {
    // Calculate character entropy (higher = more random/human-like)
    const chars = {};
    for (const char of userAgent) {
      chars[char] = (chars[char] || 0) + 1;
    }

    const entropy = Object.values(chars).reduce((sum, count) => {
      const prob = count / userAgent.length;
      return sum - prob * Math.log2(prob);
    }, 0);

    return entropy;
  }

  calculateAveragePageTime(pageViews) {
    if (pageViews.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < pageViews.length; i++) {
      totalTime += pageViews[i].timestamp - pageViews[i-1].timestamp;
    }

    return totalTime / (pageViews.length - 1);
  }

  checkHoneypot(req) {
    // Check honeypot field
    if (req.body && req.body[this.config.honeypot.fieldName]) {
      return true;
    }

    // Check honeypot URLs
    if (this.config.honeypot.trapUrls.includes(req.path)) {
      return true;
    }

    return false;
  }

  issueChallenge(req, res, sessionId, detectionResult) {
    const challenge = this.generateChallenge();
    
    this.activeChallenges.set(sessionId, {
      challenge,
      issuedAt: Date.now(),
      attempts: 0,
      detectionResult
    });

    this.stats.challengesIssued++;

    res.status(403).json({
      error: 'Challenge Required',
      message: 'Please complete the challenge to continue',
      challengeId: sessionId,
      challenge: challenge,
      endpoint: '/api/security/challenge',
      expiresAt: Date.now() + this.config.challenges.expiration
    });
  }

  generateChallenge() {
    const types = this.config.challenges.types;
    const type = types[Math.floor(Math.random() * types.length)];
    const difficulty = this.config.challenges.difficulty;

    switch (type) {
      case 'math':
        return this.generateMathChallenge(difficulty);
      case 'captcha':
        return this.generateCaptchaChallenge(difficulty);
      case 'puzzle':
        return this.generatePuzzleChallenge(difficulty);
      default:
        return this.generateMathChallenge(difficulty);
    }
  }

  generateMathChallenge(difficulty) {
    let num1, num2, operation, answer;

    switch (difficulty) {
      case 'easy':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        operation = '+';
        answer = num1 + num2;
        break;
      case 'medium':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        operation = Math.random() > 0.5 ? '+' : '×';
        answer = operation === '+' ? num1 + num2 : num1 * num2;
        break;
      case 'hard':
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 20) + 1;
        operation = Math.random() > 0.5 ? '-' : '÷';
        answer = operation === '-' ? num1 - num2 : Math.floor(num1 / num2);
        break;
      default:
        return this.generateMathChallenge('medium');
    }

    return {
      type: 'math',
      question: `What is ${num1} ${operation} ${num2}?`,
      answer: answer.toString(),
      options: this.generateMathOptions(answer, difficulty)
    };
  }

  generateCaptchaChallenge(difficulty) {
    const text = crypto.randomBytes(difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 6)
                      .toString('hex')
                      .substring(0, difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 6)
                      .toUpperCase();

    return {
      type: 'captcha',
      text: text,
      image: `/api/security/captcha/${text}`,
      instruction: 'Enter the characters you see in the image'
    };
  }

  generatePuzzleChallenge(difficulty) {
    const puzzles = [
      {
        question: 'What comes next in the sequence: 2, 4, 6, 8, ?',
        answer: '10',
        type: 'sequence'
      },
      {
        question: 'If you have 3 apples and you give away 1, how many do you have left?',
        answer: '2',
        type: 'word'
      },
      {
        question: 'What color do you get when you mix red and blue?',
        answer: 'purple',
        type: 'common'
      }
    ];

    return puzzles[Math.floor(Math.random() * puzzles.length)];
  }

  generateMathOptions(correct, difficulty) {
    const options = [correct];
    const variance = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;

    while (options.length < 4) {
      const wrong = correct + Math.floor(Math.random() * variance * 2) - variance;
      if (wrong !== correct && wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }

    return options.sort(() => Math.random() - 0.5);
  }

  // Challenge verification endpoint
  verifyChallenge(sessionId, answer) {
    const challengeData = this.activeChallenges.get(sessionId);
    
    if (!challengeData) {
      return { success: false, reason: 'No active challenge' };
    }

    // Check expiration
    if (Date.now() - challengeData.issuedAt > this.config.challenges.expiration) {
      this.activeChallenges.delete(sessionId);
      return { success: false, reason: 'Challenge expired' };
    }

    // Check attempts
    if (challengeData.attempts >= this.config.challenges.maxAttempts) {
      this.activeChallenges.delete(sessionId);
      this.blockSession(sessionId, 'Too many failed challenge attempts');
      return { success: false, reason: 'Too many attempts' };
    }

    challengeData.attempts++;

    // Verify answer
    const isCorrect = this.verifyAnswer(challengeData.challenge, answer);

    if (isCorrect) {
      this.activeChallenges.delete(sessionId);
      this.verifiedSessions.add(sessionId);
      this.stats.challengesPassed++;
      this.emit('challenge-passed', { sessionId });
      
      // Update session
      const session = this.sessionData.get(sessionId);
      if (session) {
        session.verified = true;
        session.challenges.push({
          passed: true,
          timestamp: Date.now()
        });
      }
      
      return { success: true, reason: 'Challenge passed' };
    } else {
      this.stats.challengesFailed++;
      this.emit('challenge-failed', { sessionId, attempts: challengeData.attempts });
      
      if (challengeData.attempts >= this.config.challenges.maxAttempts) {
        this.blockSession(sessionId, 'Failed challenge attempts');
      }
      
      return { success: false, reason: 'Incorrect answer', attemptsLeft: this.config.challenges.maxAttempts - challengeData.attempts };
    }
  }

  verifyAnswer(challenge, answer) {
    switch (challenge.type) {
      case 'math':
        return challenge.answer === answer;
      case 'captcha':
        return challenge.text.toUpperCase() === answer.toUpperCase();
      case 'puzzle':
        return challenge.answer.toLowerCase() === answer.toLowerCase();
      default:
        return false;
    }
  }

  blockSession(sessionId, reason) {
    this.blockedSessions.add(sessionId);
    this.stats.detectedBots++;
    
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.blocked = true;
      session.blockedAt = Date.now();
      session.blockReason = reason;
    }
    
    this.emit('session-blocked', { sessionId, reason });
  }

  handleBlockedSession(req, res, sessionId) {
    res.status(403).json({
      error: 'Access Denied',
      message: 'Your session has been blocked due to suspicious activity'
    });
  }

  handleBotDetected(req, res, detectionResult) {
    res.status(403).json({
      error: 'Bot Detected',
      message: 'Automated access is not allowed',
      confidence: detectionResult.confidence,
      reasons: detectionResult.reasons
    });
  }

  handleHoneypotTrigger(req, res, sessionId) {
    this.stats.honeypotTriggers++;
    this.blockSession(sessionId, 'Honeypot triggered');
    
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  }

  // Behavioral tracking endpoints
  trackBehavior(sessionId, behaviorType, data = {}) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    switch (behaviorType) {
      case 'mouse':
        session.behaviors.mouseMovements += data.movements || 1;
        break;
      case 'keyboard':
        session.behaviors.keyboardEvents += data.events || 1;
        break;
      case 'click':
        session.behaviors.clicks += data.clicks || 1;
        break;
      case 'scroll':
        session.behaviors.scrolls += data.scrolls || 1;
        break;
      case 'touch':
        session.behaviors.touches += data.touches || 1;
        break;
    }

    session.lastActivity = Date.now();
  }

  // Cleanup expired data
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean expired sessions
    for (const [sessionId, session] of this.sessionData.entries()) {
      if (now - session.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
        this.sessionData.delete(sessionId);
        this.verifiedSessions.delete(sessionId);
        this.blockedSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    // Clean expired challenges
    for (const [sessionId, challenge] of this.activeChallenges.entries()) {
      if (now - challenge.issuedAt > this.config.challenges.expiration) {
        this.activeChallenges.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.emit('cleanup', { cleanedCount, timestamp: now });
    }
  }

  // Update ML model (simplified)
  updateMLModel() {
    // In production, implement actual ML model training
    this.emit('ml-model-updated', { timestamp: Date.now() });
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      activeSessions: this.sessionData.size,
      verifiedSessions: this.verifiedSessions.size,
      blockedSessions: this.blockedSessions.size,
      activeChallenges: this.activeChallenges.size,
      timestamp: Date.now()
    };
  }

  // Get session information
  getSessionInfo(sessionId) {
    const session = this.sessionData.get(sessionId);
    const challenge = this.activeChallenges.get(sessionId);
    
    return {
      session,
      isVerified: this.verifiedSessions.has(sessionId),
      isBlocked: this.blockedSessions.has(sessionId),
      hasActiveChallenge: !!challenge,
      challenge
    };
  }
}

module.exports = BotDetection;
