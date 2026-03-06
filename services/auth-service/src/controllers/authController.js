const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const config = require('../config/environment');
const logger = require('../utils/logger');
const { User, Session, LoginAttempt, SecurityEvent } = require('../models');
const tokenService = require('../services/tokenService');
const mfaService = require('../services/mfaService');
const auditService = require('../services/auditService');
const riskService = require('../services/riskService');
const { validateInput, sanitizeInput } = require('../utils/validators');
const { encrypt, decrypt } = require('../utils/encryption');

class AuthController {
  /**
   * User Registration with Enterprise Security
   */
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, organizationId } = req.body;

      // Input validation
      const validation = validateInput({
        username: { value: username, rules: ['required', 'alphanumeric', 'min:3', 'max:50'] },
        email: { value: email, rules: ['required', 'email', 'max:255'] },
        password: { value: password, rules: ['required', 'password', `min:${config.security.passwordMinLength}`] },
        firstName: { value: firstName, rules: ['required', 'alpha', 'max:50'] },
        lastName: { value: lastName, rules: ['required', 'alpha', 'max:50'] }
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Check if user already exists
      const existingUser = await User.query()
        .where('email', email.toLowerCase())
        .orWhere('username', username.toLowerCase())
        .first();

      if (existingUser) {
        await auditService.log({
          action: 'REGISTRATION_ATTEMPT_DUPLICATE',
          userId: null,
          email: email.toLowerCase(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          reason: 'User already exists'
        });

        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email or username already exists'
        });
      }

      // Hash password with enterprise-grade security
      const saltRounds = config.security.bcryptRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate secure user ID
      const userId = uuidv4();

      // Create user with encrypted sensitive data
      const user = await User.query().insert({
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: encrypt(firstName),
        lastName: encrypt(lastName),
        organizationId,
        emailVerified: false,
        mfaEnabled: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Generate email verification token
      const verificationToken = tokenService.generateEmailVerificationToken(user.id);
      
      // Send verification email (async)
      // emailService.sendVerificationEmail(user.email, verificationToken);

      // Log successful registration
      await auditService.log({
        action: 'USER_REGISTERED',
        userId: user.id,
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      logger.info(`User registered successfully: ${user.email}`);

      res.status(201).json({
        message: 'User registered successfully',
        userId: user.id,
        emailVerificationRequired: true
      });

    } catch (error) {
      logger.error('Registration error:', error);
      
      await auditService.log({
        action: 'REGISTRATION_ERROR',
        userId: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        error: error.message
      });

      res.status(500).json({
        error: 'Registration failed',
        message: 'An internal error occurred during registration'
      });
    }
  }

  /**
   * Enterprise Login with Risk Assessment
   */
  async login(req, res) {
    try {
      const { username, password, mfaToken, rememberMe } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      const deviceFingerprint = req.get('X-Device-Fingerprint');

      // Input validation
      const validation = validateInput({
        username: { value: username, rules: ['required', 'max:255'] },
        password: { value: password, rules: ['required', 'max:255'] }
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Find user
      const user = await User.query()
        .where('email', username.toLowerCase())
        .orWhere('username', username.toLowerCase())
        .first();

      if (!user) {
        await this.handleFailedLogin(null, ipAddress, userAgent, 'User not found');
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        });
      }

      // Check account status
      if (user.status !== 'active') {
        await this.handleFailedLogin(user.id, ipAddress, userAgent, `Account ${user.status}`);
        return res.status(403).json({
          error: 'Account unavailable',
          message: `Account is ${user.status}`
        });
      }

      // Check for account lockout
      const isLocked = await this.isAccountLocked(user.id);
      if (isLocked) {
        await this.handleFailedLogin(user.id, ipAddress, userAgent, 'Account locked');
        return res.status(423).json({
          error: 'Account locked',
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.id, ipAddress, userAgent, 'Invalid password');
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        });
      }

      // Risk assessment
      const riskScore = await riskService.calculateRiskScore({
        userId: user.id,
        ipAddress,
        userAgent,
        deviceFingerprint,
        location: geoip.lookup(ipAddress)
      });

      // MFA check
      if (user.mfaEnabled || riskScore > 0.7) {
        if (!mfaToken) {
          return res.status(200).json({
            requiresMFA: true,
            message: 'Multi-factor authentication required',
            riskScore: riskScore > 0.7 ? 'high' : 'normal'
          });
        }

        const isMFAValid = await mfaService.verifyToken(user.id, mfaToken);
        if (!isMFAValid) {
          await this.handleFailedLogin(user.id, ipAddress, userAgent, 'Invalid MFA token');
          return res.status(401).json({
            error: 'Invalid MFA token',
            message: 'The provided MFA token is invalid or expired'
          });
        }
      }

      // Generate session and tokens
      const sessionId = uuidv4();
      const deviceInfo = this.parseDeviceInfo(userAgent);
      
      // Create session
      await Session.query().insert({
        id: sessionId,
        userId: user.id,
        ipAddress,
        userAgent,
        deviceFingerprint,
        deviceInfo: JSON.stringify(deviceInfo),
        location: JSON.stringify(geoip.lookup(ipAddress)),
        riskScore,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
        createdAt: new Date()
      });

      // Generate JWT tokens
      const accessToken = tokenService.generateAccessToken({
        userId: user.id,
        sessionId,
        email: user.email,
        role: user.role
      });

      const refreshToken = tokenService.generateRefreshToken({
        userId: user.id,
        sessionId
      });

      // Store refresh token securely
      await tokenService.storeRefreshToken(user.id, sessionId, refreshToken);

      // Clear failed login attempts
      await LoginAttempt.query()
        .where('userId', user.id)
        .where('success', false)
        .delete();

      // Update last login
      await User.query()
        .findById(user.id)
        .patch({
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress
        });

      // Log successful login
      await auditService.log({
        action: 'USER_LOGIN',
        userId: user.id,
        sessionId,
        ipAddress,
        userAgent,
        riskScore,
        success: true
      });

      logger.info(`User logged in successfully: ${user.email} (Risk: ${riskScore})`);

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Login successful',
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: decrypt(user.firstName),
          lastName: decrypt(user.lastName),
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          emailVerified: user.emailVerified
        },
        session: {
          id: sessionId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Access token expiry
          riskScore: riskScore > 0.7 ? 'high' : riskScore > 0.3 ? 'medium' : 'low'
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      
      await auditService.log({
        action: 'LOGIN_ERROR',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        error: error.message
      });

      res.status(500).json({
        error: 'Login failed',
        message: 'An internal error occurred during login'
      });
    }
  }

  /**
   * Token Refresh with Security Validation
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          message: 'No refresh token provided'
        });
      }

      // Verify and decode refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'The refresh token is invalid or expired'
        });
      }

      // Check if refresh token exists in store
      const storedToken = await tokenService.getRefreshToken(decoded.userId, decoded.sessionId);
      if (!storedToken || storedToken !== refreshToken) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'The refresh token is not valid'
        });
      }

      // Verify session is still active
      const session = await Session.query()
        .findById(decoded.sessionId)
        .where('userId', decoded.userId)
        .where('expiresAt', '>', new Date())
        .first();

      if (!session) {
        await tokenService.revokeRefreshToken(decoded.userId, decoded.sessionId);
        return res.status(401).json({
          error: 'Session expired',
          message: 'The session has expired'
        });
      }

      // Get user details
      const user = await User.query().findById(decoded.userId);
      if (!user || user.status !== 'active') {
        await tokenService.revokeRefreshToken(decoded.userId, decoded.sessionId);
        return res.status(401).json({
          error: 'User unavailable',
          message: 'User account is not available'
        });
      }

      // Generate new access token
      const newAccessToken = tokenService.generateAccessToken({
        userId: user.id,
        sessionId: decoded.sessionId,
        email: user.email,
        role: user.role
      });

      // Log token refresh
      await auditService.log({
        action: 'TOKEN_REFRESHED',
        userId: user.id,
        sessionId: decoded.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      res.json({
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      
      res.status(500).json({
        error: 'Token refresh failed',
        message: 'An internal error occurred during token refresh'
      });
    }
  }

  /**
   * Secure Logout with Session Cleanup
   */
  async logout(req, res) {
    try {
      const { sessionId, userId } = req.user;
      const logoutAll = req.body.logoutAll === true;

      if (logoutAll) {
        // Logout from all sessions
        await Session.query()
          .where('userId', userId)
          .delete();

        await tokenService.revokeAllRefreshTokens(userId);

        await auditService.log({
          action: 'USER_LOGOUT_ALL',
          userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true
        });

        logger.info(`User logged out from all sessions: ${userId}`);
      } else {
        // Logout from current session only
        await Session.query()
          .findById(sessionId)
          .delete();

        await tokenService.revokeRefreshToken(userId, sessionId);

        await auditService.log({
          action: 'USER_LOGOUT',
          userId,
          sessionId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true
        });

        logger.info(`User logged out: ${userId}`);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        message: logoutAll ? 'Logged out from all sessions' : 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      
      res.status(500).json({
        error: 'Logout failed',
        message: 'An internal error occurred during logout'
      });
    }
  }

  /**
   * Setup Multi-Factor Authentication
   */
  async setupMFA(req, res) {
    try {
      const { userId } = req.user;

      // Generate MFA secret
      const secret = speakeasy.generateSecret({
        name: `Enterprise Platform (${req.user.email})`,
        issuer: 'Enterprise Platform',
        length: 32
      });

      // Store temporary secret (not activated yet)
      await mfaService.storeTempSecret(userId, secret.base32);

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      await auditService.log({
        action: 'MFA_SETUP_INITIATED',
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      res.json({
        message: 'MFA setup initiated',
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      });

    } catch (error) {
      logger.error('MFA setup error:', error);
      
      res.status(500).json({
        error: 'MFA setup failed',
        message: 'An internal error occurred during MFA setup'
      });
    }
  }

  /**
   * Verify and Enable MFA
   */
  async verifyMFA(req, res) {
    try {
      const { userId } = req.user;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token required',
          message: 'MFA token is required'
        });
      }

      // Verify the token with temporary secret
      const isValid = await mfaService.verifyTempToken(userId, token);
      
      if (!isValid) {
        await auditService.log({
          action: 'MFA_VERIFICATION_FAILED',
          userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });

        return res.status(400).json({
          error: 'Invalid token',
          message: 'The provided MFA token is invalid'
        });
      }

      // Activate MFA for user
      await mfaService.activateMFA(userId);
      
      // Update user record
      await User.query()
        .findById(userId)
        .patch({ mfaEnabled: true });

      // Generate backup codes
      const backupCodes = await mfaService.generateBackupCodes(userId);

      await auditService.log({
        action: 'MFA_ENABLED',
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });

      logger.info(`MFA enabled for user: ${userId}`);

      res.json({
        message: 'MFA enabled successfully',
        backupCodes
      });

    } catch (error) {
      logger.error('MFA verification error:', error);
      
      res.status(500).json({
        error: 'MFA verification failed',
        message: 'An internal error occurred during MFA verification'
      });
    }
  }

  /**
   * Helper Methods
   */
  async handleFailedLogin(userId, ipAddress, userAgent, reason) {
    try {
      // Record failed login attempt
      await LoginAttempt.query().insert({
        userId,
        ipAddress,
        userAgent,
        success: false,
        reason,
        attemptedAt: new Date()
      });

      // Log security event
      await auditService.log({
        action: 'LOGIN_FAILED',
        userId,
        ipAddress,
        userAgent,
        success: false,
        reason
      });

      // Check if account should be locked
      if (userId) {
        const failedAttempts = await LoginAttempt.query()
          .where('userId', userId)
          .where('success', false)
          .where('attemptedAt', '>', new Date(Date.now() - config.security.lockoutDuration))
          .count();

        if (failedAttempts[0].count >= config.security.maxLoginAttempts) {
          await SecurityEvent.query().insert({
            userId,
            type: 'ACCOUNT_LOCKED',
            severity: 'high',
            ipAddress,
            userAgent,
            details: JSON.stringify({ failedAttempts: failedAttempts[0].count }),
            createdAt: new Date()
          });

          logger.warn(`Account locked due to failed login attempts: ${userId}`);
        }
      }
    } catch (error) {
      logger.error('Error handling failed login:', error);
    }
  }

  async isAccountLocked(userId) {
    const recentFailedAttempts = await LoginAttempt.query()
      .where('userId', userId)
      .where('success', false)
      .where('attemptedAt', '>', new Date(Date.now() - config.security.lockoutDuration))
      .count();

    return recentFailedAttempts[0].count >= config.security.maxLoginAttempts;
  }

  parseDeviceInfo(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      device: result.device.type || 'desktop',
      model: result.device.model || 'unknown'
    };
  }
}

module.exports = new AuthController();