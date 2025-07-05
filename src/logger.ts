type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private enabled: boolean = true
  private level: LogLevel = 'debug'

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false
    
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private log(level: LogLevel, category: string, message: string, data?: any) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    }

    this.logs.push(entry)
    
    // Also log to console for development
    const consoleMessage = `[${entry.timestamp}] ${category.toUpperCase()}: ${message}`
    
    switch (level) {
      case 'debug':
        console.debug(consoleMessage, data || '')
        break
      case 'info':
        console.info(consoleMessage, data || '')
        break
      case 'warn':
        console.warn(consoleMessage, data || '')
        break
      case 'error':
        console.error(consoleMessage, data || '')
        break
    }
  }

  // Character creation and stats
  charCreation(message: string, data?: any) {
    this.log('info', 'char-creation', message, data)
  }

  statCalculation(message: string, data?: any) {
    this.log('debug', 'stat-calc', message, data)
  }

  // Combat and rolls
  roll(message: string, data?: any) {
    this.log('info', 'roll', message, data)
  }

  combat(message: string, data?: any) {
    this.log('info', 'combat', message, data)
  }

  // Equipment
  equipment(message: string, data?: any) {
    this.log('info', 'equipment', message, data)
  }

  // Level up
  levelUp(message: string, data?: any) {
    this.log('info', 'level-up', message, data)
  }

  // HP calculations
  hpCalculation(message: string, data?: any) {
    this.log('debug', 'hp-calc', message, data)
  }

  // AC calculations
  acCalculation(message: string, data?: any) {
    this.log('debug', 'ac-calc', message, data)
  }

  // Maneuvers
  maneuvers(message: string, data?: any) {
    this.log('debug', 'maneuvers', message, data)
  }

  // Storage operations
  storage(message: string, data?: any) {
    this.log('info', 'storage', message, data)
  }

  // General debug
  debug(message: string, data?: any) {
    this.log('debug', 'debug', message, data)
  }

  // General info
  info(message: string, data?: any) {
    this.log('info', 'info', message, data)
  }

  // Errors
  error(message: string, data?: any) {
    this.log('error', 'error', message, data)
  }

  // Get logs
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // Get logs by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category)
  }

  // Get recent logs
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count)
  }
}

export const logger = new Logger()
export type { LogEntry, LogLevel }