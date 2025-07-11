/**
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp - Log entry timestamp
 * @property {LogLevel} level - Log level
 * @property {string} category - Log category
 * @property {string} message - Log message
 * @property {any} [data] - Optional additional data
 */

/**
 * Server-side logger for API operations
 * Logs to console with structured format suitable for production monitoring
 */
class Logger {
  /**
   * @param {LogLevel} [level='info'] - Minimum log level to output
   */
  constructor(level = 'info') {
    this.level = level;
    this.enabled = true;
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether logging is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set minimum log level
   * @param {LogLevel} level - Minimum log level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Check if a log level should be output
   * @param {LogLevel} level - Log level to check
   * @returns {boolean} Whether this level should be logged
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  /**
   * Internal log method
   * @param {LogLevel} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} [data] - Additional data
   */
  log(level, category, message, data) {
    if (!this.shouldLog(level)) return;

    /** @type {LogEntry} */
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...(data && { data })
    };

    // Format for console output
    const formattedMessage = `[${entry.timestamp}] ${level.toUpperCase()} [${category}]: ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {any} [data] - Additional data
   */
  debug(message, data) {
    this.log('debug', 'debug', message, data);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {any} [data] - Additional data
   */
  info(message, data) {
    this.log('info', 'info', message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {any} [data] - Additional data
   */
  warn(message, data) {
    this.log('warn', 'warn', message, data);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {any} [data] - Additional data
   */
  error(message, data) {
    this.log('error', 'error', message, data);
  }

  /**
   * Log authentication related message
   * @param {string} message - Auth message
   * @param {any} [data] - Additional data
   */
  auth(message, data) {
    this.log('info', 'auth', message, data);
  }

  /**
   * Log database related message
   * @param {string} message - Database message
   * @param {any} [data] - Additional data
   */
  database(message, data) {
    this.log('debug', 'database', message, data);
  }

  /**
   * Log API request/response
   * @param {string} message - API message
   * @param {any} [data] - Additional data
   */
  api(message, data) {
    this.log('info', 'api', message, data);
  }

  /**
   * Log security related message
   * @param {string} message - Security message
   * @param {any} [data] - Additional data
   */
  security(message, data) {
    this.log('warn', 'security', message, data);
  }
}

// Create default logger instance
const logger = new Logger(process.env.LOG_LEVEL || 'info');

module.exports = {
  logger,
  Logger
};