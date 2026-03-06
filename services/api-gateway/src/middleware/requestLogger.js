const logger = require('../../../shared/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      contentLength: res.get('content-length')
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Failed', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

module.exports = requestLogger;
