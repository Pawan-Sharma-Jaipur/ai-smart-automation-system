const logger = require('../../../shared/logger');
const { ServiceUnavailableError } = require('../../../shared/errors');

class CircuitBreaker {
  constructor(name, threshold = 5, timeout = 60000, resetTimeout = 30000) {
    this.name = name;
    this.failureCount = 0;
    this.successCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        logger.warn('Circuit breaker is OPEN', {
          service: this.name,
          failureCount: this.failureCount,
          nextAttempt: new Date(this.nextAttempt).toISOString()
        });
        throw new ServiceUnavailableError(`${this.name} service is temporarily unavailable`);
      }
      this.state = 'HALF_OPEN';
      logger.info('Circuit breaker entering HALF_OPEN state', { service: this.name });
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker CLOSED', {
        service: this.name,
        successCount: this.successCount
      });
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    logger.warn('Circuit breaker failure', {
      service: this.name,
      failureCount: this.failureCount,
      threshold: this.threshold,
      state: this.state
    });

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      
      logger.error('Circuit breaker OPENED', {
        service: this.name,
        failureCount: this.failureCount,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    logger.info('Circuit breaker manually reset', { service: this.name });
  }
}

module.exports = CircuitBreaker;
