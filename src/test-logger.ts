/**
 * Simple logger for testing environment
 * Compatible with both browser and Node.js environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class TestLogger {
  private enabled: boolean = true;
  private level: LogLevel = 'debug';

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, category: string, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
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

  debug(message: string, data?: any) {
    this.log('debug', 'debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', 'info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', 'warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', 'error', message, data);
  }

  auth(message: string, data?: any) {
    this.log('info', 'auth', message, data);
  }

  database(message: string, data?: any) {
    this.log('debug', 'database', message, data);
  }

  api(message: string, data?: any) {
    this.log('info', 'api', message, data);
  }

  security(message: string, data?: any) {
    this.log('warn', 'security', message, data);
  }
}

export const logger = new TestLogger();
export type { LogEntry, LogLevel };