const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
  
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'enterprise_auth',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: 'auth:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    family: 4,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000
  },

  // JWT Configuration
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'enterprise-access-secret-change-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'enterprise-refresh-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'enterprise-auth-service',
    audience: process.env.JWT_AUDIENCE || 'enterprise-platform',
    algorithm: 'HS256'
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'enterprise-session-secret-change-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000, // 24 hours
    name: 'enterprise.sid'
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || 128,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION, 10) || 15 * 60 * 1000, // 15 minutes
    mfaTokenExpiry: parseInt(process.env.MFA_TOKEN_EXPIRY, 10) || 5 * 60 * 1000, // 5 minutes
    passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY, 10) || 60 * 60 * 1000, // 1 hour
    emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY, 10) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:19006'
    ]
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/api/auth/microsoft/callback'
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
    }
  },

  // SAML Configuration
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || 'enterprise-auth-service',
    callbackUrl: process.env.SAML_CALLBACK_URL || '/api/auth/saml/callback',
    cert: process.env.SAML_CERT || '',
    privateCert: process.env.SAML_PRIVATE_CERT || '',
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    signatureAlgorithm: 'sha256'
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@enterprise.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Enterprise Platform'
  },

  // SMS Configuration
  sms: {
    service: process.env.SMS_SERVICE || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM || ''
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/auth-service.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
    datePattern: 'YYYY-MM-DD'
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000
  },

  // Feature Flags
  features: {
    mfaEnabled: process.env.FEATURE_MFA_ENABLED !== 'false',
    oauthEnabled: process.env.FEATURE_OAUTH_ENABLED !== 'false',
    samlEnabled: process.env.FEATURE_SAML_ENABLED !== 'false',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
    behaviorAnalytics: process.env.FEATURE_BEHAVIOR_ANALYTICS !== 'false',
    riskScoring: process.env.FEATURE_RISK_SCORING !== 'false'
  },

  // External Services
  services: {
    userService: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      timeout: parseInt(process.env.USER_SERVICE_TIMEOUT, 10) || 5000
    },
    auditService: {
      url: process.env.AUDIT_SERVICE_URL || 'http://localhost:3003',
      timeout: parseInt(process.env.AUDIT_SERVICE_TIMEOUT, 10) || 5000
    },
    notificationService: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
      timeout: parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT, 10) || 5000
    }
  }
};

// Validation
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET'
];

if (config.env === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  });
}

module.exports = config;