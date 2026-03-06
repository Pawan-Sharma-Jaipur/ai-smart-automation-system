const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/environment');
const logger = require('../utils/logger');
const { connectRedis } = require('../config/redis');

class TokenService {
  constructor() {
    this.redisClient = null;
    this.init();
  }

  async init() {
    this.redisClient = await connectRedis();
  }

  /**
   * Generate Access Token with Enterprise Claims
   */
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        // Standard JWT claims
        iss: config.jwt.issuer,
        aud: config.jwt.audience,
        sub: payload.userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(config.jwt.accessTokenExpiry),
        jti: uuidv4(),

        // Custom claims
        userId: payload.userId,
        sessionId: payload.sessionId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
        organizationId: payload.organizationId,
        departmentId: payload.departmentId,
        
        // Security claims
        tokenType: 'access',
        securityLevel: payload.securityLevel || 'standard',
        mfaVerified: payload.mfaVerified || false,
        
        // Context claims
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        deviceFingerprint: payload.deviceFingerprint
      };

      const token = jwt.sign(tokenPayload, config.jwt.accessTokenSecret, {
        algorithm: config.jwt.algorithm,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        expiresIn: config.jwt.accessTokenExpiry
      });

      logger.debug(`Access token generated for user: ${payload.userId}`);
      return token;

    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate Refresh Token with Enhanced Security
   */
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        // Standard JWT claims
        iss: config.jwt.issuer,
        aud: config.jwt.audience,
        sub: payload.userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(config.jwt.refreshTokenExpiry),
        jti: uuidv4(),

        // Custom claims
        userId: payload.userId,
        sessionId: payload.sessionId,
        tokenType: 'refresh',
        
        // Security claims
        tokenFamily: uuidv4(), // For token rotation
        version: 1
      };

      const token = jwt.sign(tokenPayload, config.jwt.refreshTokenSecret, {
        algorithm: config.jwt.algorithm,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        expiresIn: config.jwt.refreshTokenExpiry
      });

      logger.debug(`Refresh token generated for user: ${payload.userId}`);
      return token;

    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Verify Access Token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });

      // Validate token type
      if (decoded.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expired');
        return null;
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid access token:', error.message);
        return null;
      } else {
        logger.error('Error verifying access token:', error);
        return null;
      }
    }
  }

  /**
   * Verify Refresh Token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshTokenSecret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });

      // Validate token type
      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Refresh token expired');
        return null;
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid refresh token:', error.message);
        return null;
      } else {
        logger.error('Error verifying refresh token:', error);
        return null;
      }
    }
  }

  /**
   * Store Refresh Token in Redis with Security Metadata
   */
  async storeRefreshToken(userId, sessionId, token, metadata = {}) {
    try {
      const key = `refresh_token:${userId}:${sessionId}`;
      const tokenData = {
        token,
        userId,
        sessionId,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        useCount: 0,
        metadata
      };

      // Store with expiration
      const expiry = this.parseExpiry(config.jwt.refreshTokenExpiry);
      await this.redisClient.setex(key, expiry, JSON.stringify(tokenData));

      // Add to user's token list for management
      const userTokensKey = `user_tokens:${userId}`;
      await this.redisClient.sadd(userTokensKey, sessionId);
      await this.redisClient.expire(userTokensKey, expiry);

      logger.debug(`Refresh token stored for user: ${userId}, session: ${sessionId}`);

    } catch (error) {
      logger.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Get Refresh Token from Redis
   */
  async getRefreshToken(userId, sessionId) {
    try {
      const key = `refresh_token:${userId}:${sessionId}`;
      const tokenData = await this.redisClient.get(key);

      if (!tokenData) {
        return null;
      }

      const parsed = JSON.parse(tokenData);
      
      // Update usage statistics
      parsed.lastUsed = new Date().toISOString();
      parsed.useCount = (parsed.useCount || 0) + 1;
      
      // Update in Redis
      const expiry = this.parseExpiry(config.jwt.refreshTokenExpiry);
      await this.redisClient.setex(key, expiry, JSON.stringify(parsed));

      return parsed.token;

    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Revoke Refresh Token
   */
  async revokeRefreshToken(userId, sessionId) {
    try {
      const key = `refresh_token:${userId}:${sessionId}`;
      await this.redisClient.del(key);

      // Remove from user's token list
      const userTokensKey = `user_tokens:${userId}`;
      await this.redisClient.srem(userTokensKey, sessionId);

      logger.debug(`Refresh token revoked for user: ${userId}, session: ${sessionId}`);

    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke All Refresh Tokens for User
   */
  async revokeAllRefreshTokens(userId) {
    try {
      const userTokensKey = `user_tokens:${userId}`;
      const sessionIds = await this.redisClient.smembers(userTokensKey);

      // Delete all refresh tokens
      const pipeline = this.redisClient.pipeline();
      sessionIds.forEach(sessionId => {
        pipeline.del(`refresh_token:${userId}:${sessionId}`);
      });
      pipeline.del(userTokensKey);
      
      await pipeline.exec();

      logger.info(`All refresh tokens revoked for user: ${userId}`);

    } catch (error) {
      logger.error('Error revoking all refresh tokens:', error);
      throw new Error('Failed to revoke all refresh tokens');
    }
  }

  /**
   * Generate Email Verification Token
   */
  generateEmailVerificationToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'email_verification',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + config.security.emailVerificationExpiry / 1000
      };

      return jwt.sign(payload, config.jwt.accessTokenSecret, {
        algorithm: config.jwt.algorithm
      });

    } catch (error) {
      logger.error('Error generating email verification token:', error);
      throw new Error('Failed to generate email verification token');
    }
  }

  /**
   * Verify Email Verification Token
   */
  verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
        algorithms: [config.jwt.algorithm]
      });

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      return decoded;

    } catch (error) {
      logger.error('Error verifying email verification token:', error);
      return null;
    }
  }

  /**
   * Generate Password Reset Token
   */
  generatePasswordResetToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'password_reset',
        nonce: crypto.randomBytes(16).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + config.security.passwordResetExpiry / 1000
      };

      return jwt.sign(payload, config.jwt.accessTokenSecret, {
        algorithm: config.jwt.algorithm
      });

    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * Verify Password Reset Token
   */
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
        algorithms: [config.jwt.algorithm]
      });

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return decoded;

    } catch (error) {
      logger.error('Error verifying password reset token:', error);
      return null;
    }
  }

  /**
   * Generate API Key for Service-to-Service Authentication
   */
  generateApiKey(serviceId, permissions = []) {
    try {
      const payload = {
        serviceId,
        permissions,
        type: 'api_key',
        iat: Math.floor(Date.now() / 1000),
        // API keys don't expire by default, but can be revoked
      };

      return jwt.sign(payload, config.jwt.accessTokenSecret, {
        algorithm: config.jwt.algorithm
      });

    } catch (error) {
      logger.error('Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Verify API Key
   */
  verifyApiKey(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
        algorithms: [config.jwt.algorithm]
      });

      if (decoded.type !== 'api_key') {
        throw new Error('Invalid token type');
      }

      return decoded;

    } catch (error) {
      logger.error('Error verifying API key:', error);
      return null;
    }
  }

  /**
   * Token Rotation for Enhanced Security
   */
  async rotateRefreshToken(oldToken) {
    try {
      const decoded = this.verifyRefreshToken(oldToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }

      // Revoke old token
      await this.revokeRefreshToken(decoded.userId, decoded.sessionId);

      // Generate new token with incremented version
      const newToken = this.generateRefreshToken({
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        tokenFamily: decoded.tokenFamily,
        version: (decoded.version || 1) + 1
      });

      // Store new token
      await this.storeRefreshToken(decoded.userId, decoded.sessionId, newToken, {
        rotatedFrom: decoded.jti,
        rotatedAt: new Date().toISOString()
      });

      return newToken;

    } catch (error) {
      logger.error('Error rotating refresh token:', error);
      throw new Error('Failed to rotate refresh token');
    }
  }

  /**
   * Get Token Statistics for Monitoring
   */
  async getTokenStatistics(userId) {
    try {
      const userTokensKey = `user_tokens:${userId}`;
      const sessionIds = await this.redisClient.smembers(userTokensKey);

      const statistics = {
        totalSessions: sessionIds.length,
        sessions: []
      };

      for (const sessionId of sessionIds) {
        const key = `refresh_token:${userId}:${sessionId}`;
        const tokenData = await this.redisClient.get(key);
        
        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          statistics.sessions.push({
            sessionId,
            createdAt: parsed.createdAt,
            lastUsed: parsed.lastUsed,
            useCount: parsed.useCount,
            metadata: parsed.metadata
          });
        }
      }

      return statistics;

    } catch (error) {
      logger.error('Error getting token statistics:', error);
      return null;
    }
  }

  /**
   * Cleanup Expired Tokens (Background Job)
   */
  async cleanupExpiredTokens() {
    try {
      // This would typically be run as a background job
      // Redis handles expiration automatically, but we can clean up orphaned references
      
      const pattern = 'user_tokens:*';
      const keys = await this.redisClient.keys(pattern);

      let cleanedCount = 0;
      for (const key of keys) {
        const userId = key.split(':')[2];
        const sessionIds = await this.redisClient.smembers(key);

        for (const sessionId of sessionIds) {
          const tokenKey = `refresh_token:${userId}:${sessionId}`;
          const exists = await this.redisClient.exists(tokenKey);
          
          if (!exists) {
            await this.redisClient.srem(key, sessionId);
            cleanedCount++;
          }
        }
      }

      logger.info(`Cleaned up ${cleanedCount} orphaned token references`);
      return cleanedCount;

    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Helper Methods
   */
  parseExpiry(expiry) {
    if (typeof expiry === 'number') {
      return expiry;
    }

    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800
    };

    const match = expiry.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Extract Token from Request Headers
   */
  extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for API key in headers
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return apiKey;
    }

    return null;
  }

  /**
   * Validate Token Context (IP, User Agent, etc.)
   */
  validateTokenContext(token, req) {
    try {
      // Check if IP address matches (if stored in token)
      if (token.ipAddress && token.ipAddress !== req.ip) {
        logger.warn(`IP address mismatch for token: ${token.jti}`);
        return false;
      }

      // Check if User Agent matches (if stored in token)
      if (token.userAgent && token.userAgent !== req.get('User-Agent')) {
        logger.warn(`User Agent mismatch for token: ${token.jti}`);
        return false;
      }

      // Check device fingerprint (if available)
      const deviceFingerprint = req.get('X-Device-Fingerprint');
      if (token.deviceFingerprint && deviceFingerprint && 
          token.deviceFingerprint !== deviceFingerprint) {
        logger.warn(`Device fingerprint mismatch for token: ${token.jti}`);
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Error validating token context:', error);
      return false;
    }
  }
}

module.exports = new TokenService();