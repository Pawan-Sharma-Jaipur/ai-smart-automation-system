const { Model } = require('objection');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/environment');

/**
 * Base Model with common functionality
 */
class BaseModel extends Model {
  $beforeInsert() {
    this.id = this.id || uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}

/**
 * User Model - Enterprise User Management
 */
class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        username: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        password: { type: 'string', minLength: 8, maxLength: 255 },
        firstName: { type: 'string', maxLength: 50 },
        lastName: { type: 'string', maxLength: 50 },
        phoneNumber: { type: ['string', 'null'], maxLength: 20 },
        organizationId: { type: ['string', 'null'], format: 'uuid' },
        departmentId: { type: ['string', 'null'], format: 'uuid' },
        managerId: { type: ['string', 'null'], format: 'uuid' },
        role: { 
          type: 'string', 
          enum: ['super_admin', 'admin', 'manager', 'user', 'guest'],
          default: 'user'
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended', 'pending_verification'],
          default: 'pending_verification'
        },
        emailVerified: { type: 'boolean', default: false },
        emailVerifiedAt: { type: ['string', 'null'], format: 'date-time' },
        phoneVerified: { type: 'boolean', default: false },
        phoneVerifiedAt: { type: ['string', 'null'], format: 'date-time' },
        mfaEnabled: { type: 'boolean', default: false },
        mfaSecret: { type: ['string', 'null'] },
        mfaBackupCodes: { type: ['array', 'null'] },
        passwordChangedAt: { type: ['string', 'null'], format: 'date-time' },
        lastLoginAt: { type: ['string', 'null'], format: 'date-time' },
        lastLoginIp: { type: ['string', 'null'] },
        failedLoginAttempts: { type: 'integer', default: 0 },
        lockedUntil: { type: ['string', 'null'], format: 'date-time' },
        preferences: { type: ['object', 'null'] },
        metadata: { type: ['object', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        deletedAt: { type: ['string', 'null'], format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      organization: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Organization',
        join: {
          from: 'users.organizationId',
          to: 'organizations.id'
        }
      },
      department: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Department',
        join: {
          from: 'users.departmentId',
          to: 'departments.id'
        }
      },
      manager: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'users.managerId',
          to: 'users.id'
        }
      },
      directReports: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'users.id',
          to: 'users.managerId'
        }
      },
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Role',
        join: {
          from: 'users.id',
          through: {
            from: 'user_roles.userId',
            to: 'user_roles.roleId'
          },
          to: 'roles.id'
        }
      },
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: 'Session',
        join: {
          from: 'users.id',
          to: 'sessions.userId'
        }
      },
      auditLogs: {
        relation: Model.HasManyRelation,
        modelClass: 'AuditLog',
        join: {
          from: 'users.id',
          to: 'audit_logs.userId'
        }
      }
    };
  }

  async $beforeInsert(context) {
    await super.$beforeInsert(context);
    
    if (this.password) {
      this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);
      this.passwordChangedAt = new Date();
    }
  }

  async $beforeUpdate(opt, context) {
    await super.$beforeUpdate(opt, context);
    
    if (this.password) {
      this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);
      this.passwordChangedAt = new Date();
    }
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  isLocked() {
    return this.lockedUntil && new Date() < new Date(this.lockedUntil);
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  toJSON() {
    const json = super.toJSON();
    delete json.password;
    delete json.mfaSecret;
    delete json.mfaBackupCodes;
    return json;
  }
}

/**
 * Session Model - Enterprise Session Management
 */
class Session extends BaseModel {
  static get tableName() {
    return 'sessions';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'ipAddress', 'userAgent'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        deviceFingerprint: { type: ['string', 'null'] },
        deviceInfo: { type: ['object', 'null'] },
        location: { type: ['object', 'null'] },
        riskScore: { type: 'number', minimum: 0, maximum: 1 },
        isActive: { type: 'boolean', default: true },
        lastActivityAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'sessions.userId',
          to: 'users.id'
        }
      }
    };
  }

  $beforeInsert() {
    super.$beforeInsert();
    this.lastActivityAt = new Date();
  }

  isExpired() {
    return new Date() > new Date(this.expiresAt);
  }

  updateActivity() {
    this.lastActivityAt = new Date();
  }
}

/**
 * Role Model - Enterprise Role Management
 */
class Role extends BaseModel {
  static get tableName() {
    return 'roles';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'organizationId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        displayName: { type: 'string', maxLength: 100 },
        description: { type: ['string', 'null'], maxLength: 500 },
        organizationId: { type: 'string', format: 'uuid' },
        parentRoleId: { type: ['string', 'null'], format: 'uuid' },
        level: { type: 'integer', minimum: 0, default: 0 },
        isSystem: { type: 'boolean', default: false },
        isActive: { type: 'boolean', default: true },
        metadata: { type: ['object', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      organization: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Organization',
        join: {
          from: 'roles.organizationId',
          to: 'organizations.id'
        }
      },
      parentRole: {
        relation: Model.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: 'roles.parentRoleId',
          to: 'roles.id'
        }
      },
      childRoles: {
        relation: Model.HasManyRelation,
        modelClass: Role,
        join: {
          from: 'roles.id',
          to: 'roles.parentRoleId'
        }
      },
      permissions: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Permission',
        join: {
          from: 'roles.id',
          through: {
            from: 'role_permissions.roleId',
            to: 'role_permissions.permissionId'
          },
          to: 'permissions.id'
        }
      },
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'roles.id',
          through: {
            from: 'user_roles.roleId',
            to: 'user_roles.userId'
          },
          to: 'users.id'
        }
      }
    };
  }
}

/**
 * Permission Model - Enterprise Permission Management
 */
class Permission extends BaseModel {
  static get tableName() {
    return 'permissions';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'resource', 'action'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        displayName: { type: 'string', maxLength: 100 },
        description: { type: ['string', 'null'], maxLength: 500 },
        resource: { type: 'string', maxLength: 50 },
        action: { type: 'string', maxLength: 50 },
        conditions: { type: ['object', 'null'] },
        isSystem: { type: 'boolean', default: false },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permissions.id',
          through: {
            from: 'role_permissions.permissionId',
            to: 'role_permissions.roleId'
          },
          to: 'roles.id'
        }
      }
    };
  }
}

/**
 * Organization Model - Multi-tenant Support
 */
class Organization extends BaseModel {
  static get tableName() {
    return 'organizations';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 200 },
        displayName: { type: 'string', maxLength: 200 },
        domain: { type: ['string', 'null'], maxLength: 100 },
        logo: { type: ['string', 'null'] },
        website: { type: ['string', 'null'] },
        industry: { type: ['string', 'null'], maxLength: 100 },
        size: { 
          type: ['string', 'null'],
          enum: ['startup', 'small', 'medium', 'large', 'enterprise']
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended', 'trial'],
          default: 'trial'
        },
        settings: { type: ['object', 'null'] },
        metadata: { type: ['object', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'organizations.id',
          to: 'users.organizationId'
        }
      },
      roles: {
        relation: Model.HasManyRelation,
        modelClass: Role,
        join: {
          from: 'organizations.id',
          to: 'roles.organizationId'
        }
      },
      departments: {
        relation: Model.HasManyRelation,
        modelClass: 'Department',
        join: {
          from: 'organizations.id',
          to: 'departments.organizationId'
        }
      }
    };
  }
}

/**
 * AuditLog Model - Enterprise Audit Trail
 */
class AuditLog extends BaseModel {
  static get tableName() {
    return 'audit_logs';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['action', 'ipAddress'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: ['string', 'null'], format: 'uuid' },
        sessionId: { type: ['string', 'null'], format: 'uuid' },
        action: { type: 'string', maxLength: 100 },
        resource: { type: ['string', 'null'], maxLength: 100 },
        resourceId: { type: ['string', 'null'] },
        oldValues: { type: ['object', 'null'] },
        newValues: { type: ['object', 'null'] },
        ipAddress: { type: 'string' },
        userAgent: { type: ['string', 'null'] },
        location: { type: ['object', 'null'] },
        riskScore: { type: ['number', 'null'], minimum: 0, maximum: 1 },
        success: { type: 'boolean', default: true },
        reason: { type: ['string', 'null'] },
        error: { type: ['string', 'null'] },
        metadata: { type: ['object', 'null'] },
        createdAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'audit_logs.userId',
          to: 'users.id'
        }
      },
      session: {
        relation: Model.BelongsToOneRelation,
        modelClass: Session,
        join: {
          from: 'audit_logs.sessionId',
          to: 'sessions.id'
        }
      }
    };
  }
}

/**
 * LoginAttempt Model - Security Monitoring
 */
class LoginAttempt extends BaseModel {
  static get tableName() {
    return 'login_attempts';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['ipAddress', 'userAgent', 'success'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: ['string', 'null'], format: 'uuid' },
        email: { type: ['string', 'null'] },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        location: { type: ['object', 'null'] },
        success: { type: 'boolean' },
        reason: { type: ['string', 'null'] },
        riskScore: { type: ['number', 'null'], minimum: 0, maximum: 1 },
        attemptedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'login_attempts.userId',
          to: 'users.id'
        }
      }
    };
  }
}

/**
 * SecurityEvent Model - Advanced Threat Detection
 */
class SecurityEvent extends BaseModel {
  static get tableName() {
    return 'security_events';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['type', 'severity'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: ['string', 'null'], format: 'uuid' },
        sessionId: { type: ['string', 'null'], format: 'uuid' },
        type: { 
          type: 'string',
          enum: [
            'ACCOUNT_LOCKED', 'SUSPICIOUS_LOGIN', 'MULTIPLE_FAILED_LOGINS',
            'UNUSUAL_LOCATION', 'DEVICE_CHANGE', 'PRIVILEGE_ESCALATION',
            'DATA_BREACH_ATTEMPT', 'MALICIOUS_REQUEST', 'RATE_LIMIT_EXCEEDED'
          ]
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium'
        },
        description: { type: ['string', 'null'] },
        ipAddress: { type: ['string', 'null'] },
        userAgent: { type: ['string', 'null'] },
        location: { type: ['object', 'null'] },
        details: { type: ['object', 'null'] },
        resolved: { type: 'boolean', default: false },
        resolvedAt: { type: ['string', 'null'], format: 'date-time' },
        resolvedBy: { type: ['string', 'null'], format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'security_events.userId',
          to: 'users.id'
        }
      },
      session: {
        relation: Model.BelongsToOneRelation,
        modelClass: Session,
        join: {
          from: 'security_events.sessionId',
          to: 'sessions.id'
        }
      },
      resolver: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'security_events.resolvedBy',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = {
  BaseModel,
  User,
  Session,
  Role,
  Permission,
  Organization,
  AuditLog,
  LoginAttempt,
  SecurityEvent
};