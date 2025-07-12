/**
 * Simple logger for testing environment - CommonJS version
 * Compatible with both browser and Node.js environments
 */

class TestLogger {
  constructor() {
    this.enabled = true;
    this.level = 'debug';
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setLevel(level) {
    this.level = level;
  }

  shouldLog(level) {
    if (!this.enabled) return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  log(level, category, message, data) {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    // Simple console logging for tests
    const consoleMessage = `[${entry.timestamp}] ${level.toUpperCase()} [${category}]: ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(consoleMessage, data || '');
        break;
      case 'info':
        console.info(consoleMessage, data || '');
        break;
      case 'warn':
        console.warn(consoleMessage, data || '');
        break;
      case 'error':
        console.error(consoleMessage, data || '');
        break;
    }
  }

  debug(message, data) {
    this.log('debug', 'debug', message, data);
  }

  info(message, data) {
    this.log('info', 'info', message, data);
  }

  warn(message, data) {
    this.log('warn', 'warn', message, data);
  }

  error(message, data) {
    this.log('error', 'error', message, data);
  }

  auth(message, data) {
    this.log('info', 'auth', message, data);
  }

  database(message, data) {
    this.log('debug', 'database', message, data);
  }

  api(message, data) {
    this.log('info', 'api', message, data);
  }

  security(message, data) {
    this.log('warn', 'security', message, data);
  }
}

const logger = new TestLogger();

module.exports = { logger };