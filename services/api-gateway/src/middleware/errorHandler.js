const logger = require('../../../shared/logger');
const { AppError } = require('../../../shared/errors');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new AppError(message, statusCode, false);
  }

  logger.error('Error occurred', {
    error: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    isOperational: error.isOperational
  });

  if (!error.isOperational) {
    logger.error('Non-operational error - shutting down', { error: error.message });
  }

  const response = {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
