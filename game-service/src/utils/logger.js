// Structured Logging Utility

const logLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  formatLog(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message,
      ...data
    };
  }

  debug(message, data = {}) {
    console.log(JSON.stringify(this.formatLog(logLevels.DEBUG, message, data)));
  }

  info(message, data = {}) {
    console.log(JSON.stringify(this.formatLog(logLevels.INFO, message, data)));
  }

  warn(message, data = {}) {
    console.warn(JSON.stringify(this.formatLog(logLevels.WARN, message, data)));
  }

  error(message, error = null, data = {}) {
    const errorData = error ? {
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    } : {};

    console.error(JSON.stringify(this.formatLog(logLevels.ERROR, message, { ...data, ...errorData })));
  }

  request(method, path, statusCode, duration, userId = null) {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      durationMs: duration,
      userId
    });
  }

  database(operation, collection, duration, success = true) {
    const level = success ? logLevels.INFO : logLevels.WARN;
    this.info(`Database ${operation}`, {
      collection,
      durationMs: duration,
      success
    });
  }

  socketEvent(event, data = {}) {
    this.info(`Socket Event: ${event}`, data);
  }
}

module.exports = Logger;
