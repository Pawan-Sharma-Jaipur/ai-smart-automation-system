const { ForbiddenError } = require('../../../shared/errors');
const logger = require('../../../shared/logger');

const ROLES = {
  SYSTEM_ADMIN: {
    level: 5,
    permissions: ['*']
  },
  ORG_ADMIN: {
    level: 4,
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'roles.assign', 'org.manage', 'reports.view', 'analytics.view',
      'predictions.create', 'predictions.read', 'predictions.delete'
    ]
  },
  TEAM_LEAD: {
    level: 3,
    permissions: [
      'users.read', 'team.manage', 'predictions.create', 'predictions.read',
      'reports.view', 'analytics.view', 'dashboard.view'
    ]
  },
  DEVELOPER: {
    level: 2,
    permissions: [
      'predictions.create', 'predictions.read',
      'dashboard.view', 'profile.update'
    ]
  },
  VIEWER: {
    level: 1,
    permissions: ['dashboard.view', 'predictions.read', 'profile.read']
  }
};

const hasPermission = (userRole, requiredPermission) => {
  const role = ROLES[userRole];
  if (!role) return false;

  if (role.permissions.includes('*')) return true;
  if (role.permissions.includes(requiredPermission)) return true;

  const [resource, action] = requiredPermission.split('.');
  const wildcardPerm = `${resource}.*`;
  return role.permissions.includes(wildcardPerm);
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userRole = req.user.role;
      
      if (!hasPermission(userRole, requiredPermission)) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          role: userRole,
          requiredPermission,
          path: req.path
        });
        throw new ForbiddenError(`Permission '${requiredPermission}' required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Role check failed', {
          userId: req.user.id,
          role: userRole,
          allowedRoles,
          path: req.path
        });
        throw new ForbiddenError('Insufficient role privileges');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const checkResourceOwnership = (req, res, next) => {
  try {
    const resourceOwnerId = req.params.userId || req.body.userId;
    const requesterId = req.user.id;
    const userRole = req.user.role;

    if (requesterId === resourceOwnerId) {
      return next();
    }

    if (ROLES[userRole].level >= 4) {
      return next();
    }

    throw new ForbiddenError('Cannot access other users resources');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ROLES,
  hasPermission,
  checkPermission,
  checkRole,
  checkResourceOwnership
};
