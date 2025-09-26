const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'INFO',
      message,
      data
    };
    
    console.log(`[${timestamp}] INFO: ${message}`, data ? data : '');
    this.writeToFile('info', logEntry);
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error ? error.stack || error : null
    };
    
    console.error(`[${timestamp}] ERROR: ${message}`, error ? error : '');
    this.writeToFile('error', logEntry);
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'WARN',
      message,
      data
    };
    
    console.warn(`[${timestamp}] WARN: ${message}`, data ? data : '');
    this.writeToFile('warn', logEntry);
  }

  static writeToFile(level, logEntry) {
    const filename = `${level}-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(logDir, filename);
    
    fs.appendFileSync(filepath, JSON.stringify(logEntry) + '\n');
  }
}

module.exports = Logger;