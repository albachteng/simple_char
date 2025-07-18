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
  private readonly STORAGE_KEY = 'character_generator_logs'
  private currentCharacterName: string | null = null
  private currentCharacterHash: string | null = null

  constructor() {
    this.loadLogs()
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  private loadLogs() {
    try {
      const storedLogs = localStorage.getItem(this.STORAGE_KEY)
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs)
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error)
      this.logs = []
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs))
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error)
    }
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

    // Store in global logs (for backward compatibility)
    this.logs.push(entry)
    this.saveLogs()
    
    // Also store in per-character logs if we have a current character
    if (this.currentCharacterName) {
      // Capture character name at log time to prevent issues with async resolution
      const characterName = this.currentCharacterName
      const characterHash = this.currentCharacterHash
      
      // Lazy import to avoid circular dependencies  
      import('./logging/CharacterLogManager').then(({ characterLogManager }) => {
        characterLogManager.addLog(characterName, entry, characterHash || undefined)
      }).catch(error => {
        console.error('Failed to load CharacterLogManager:', error)
      })
    }
    
    // Also log to console for development
    const consolePrefix = this.currentCharacterName ? `[${this.currentCharacterName}] ` : ''
    const consoleMessage = `${consolePrefix}[${entry.timestamp}] ${category.toUpperCase()}: ${message}`
    
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
    this.log('info', 'creation', message, data)
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

  // Resource management (sorcery points, finesse points, combat maneuvers)
  resourceManagement(message: string, data?: any) {
    this.log('info', 'resources', message, data)
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

  // Clear logs - removed for log persistence

  // Get logs by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category)
  }

  // Get recent logs
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count)
  }

  // Character context management
  setCurrentCharacter(name: string, hash?: string) {
    this.currentCharacterName = name
    this.currentCharacterHash = hash || null
  }

  getCurrentCharacter(): { name: string | null; hash: string | null } {
    return {
      name: this.currentCharacterName,
      hash: this.currentCharacterHash
    }
  }

  clearCurrentCharacter() {
    this.currentCharacterName = null
    this.currentCharacterHash = null
  }
}

export const logger = new Logger()
export type { LogEntry, LogLevel }
