import { LogEntry, LogLevel } from '../logger'

export interface CharacterLogEntry extends LogEntry {
  characterName: string
  characterHash?: string
}

export class CharacterLogManager {
  private readonly STORAGE_KEY = 'character_generator_per_char_logs'
  private characterLogs: Map<string, CharacterLogEntry[]> = new Map()

  constructor() {
    this.loadLogs()
  }

  private loadLogs() {
    try {
      const storedLogs = localStorage.getItem(this.STORAGE_KEY)
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs)
        // Convert object back to Map
        this.characterLogs = new Map(Object.entries(parsedLogs))
      }
    } catch (error) {
      console.warn('Failed to load character logs from localStorage:', error)
      this.characterLogs = new Map()
    }
  }

  private saveLogs() {
    try {
      // Convert Map to object for storage
      const logsObject = Object.fromEntries(this.characterLogs)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logsObject))
    } catch (error) {
      console.warn('Failed to save character logs to localStorage:', error)
    }
  }

  /**
   * Add a log entry for a specific character
   */
  addLog(characterName: string, logEntry: LogEntry, characterHash?: string) {
    if (!characterName || characterName.trim() === '') {
      // Fall back to global logging if no character name
      return
    }

    const characterLogEntry: CharacterLogEntry = {
      ...logEntry,
      characterName,
      characterHash
    }

    if (!this.characterLogs.has(characterName)) {
      this.characterLogs.set(characterName, [])
    }

    const logs = this.characterLogs.get(characterName)!
    logs.push(characterLogEntry)
    
    // Limit logs per character to prevent memory issues (keep last 500 entries)
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500)
    }

    this.saveLogs()
  }

  /**
   * Get all logs for a specific character
   */
  getCharacterLogs(characterName: string): CharacterLogEntry[] {
    return this.characterLogs.get(characterName) || []
  }

  /**
   * Get all character names that have logs
   */
  getCharacterNames(): string[] {
    return Array.from(this.characterLogs.keys()).sort()
  }

  /**
   * Get logs for a character filtered by level and category
   */
  getFilteredCharacterLogs(
    characterName: string,
    level?: LogLevel | 'all',
    category?: string
  ): CharacterLogEntry[] {
    const logs = this.getCharacterLogs(characterName)
    
    return logs.filter(log => {
      const levelMatch = !level || level === 'all' || log.level === level
      const categoryMatch = !category || category === 'all' || log.category === category
      return levelMatch && categoryMatch
    })
  }

  /**
   * Get recent logs for a character
   */
  getRecentCharacterLogs(characterName: string, count: number = 50): CharacterLogEntry[] {
    const logs = this.getCharacterLogs(characterName)
    return logs.slice(-count)
  }

  /**
   * Clear logs for a specific character
   */
  clearCharacterLogs(characterName: string) {
    this.characterLogs.delete(characterName)
    this.saveLogs()
  }

  /**
   * Clear all character logs
   */
  clearAllLogs() {
    this.characterLogs.clear()
    this.saveLogs()
  }

  /**
   * Get total number of logs across all characters
   */
  getTotalLogCount(): number {
    let total = 0
    for (const logs of this.characterLogs.values()) {
      total += logs.length
    }
    return total
  }

  /**
   * Get unique categories from all logs for a character
   */
  getCharacterCategories(characterName: string): string[] {
    const logs = this.getCharacterLogs(characterName)
    const categories = new Set(logs.map(log => log.category))
    return Array.from(categories).sort()
  }

  /**
   * Rename a character's logs (useful when character name changes)
   */
  renameCharacterLogs(oldName: string, newName: string) {
    const logs = this.characterLogs.get(oldName)
    if (logs) {
      // Update character name in each log entry
      logs.forEach(log => {
        log.characterName = newName
      })
      
      // Move logs to new key
      this.characterLogs.set(newName, logs)
      this.characterLogs.delete(oldName)
      this.saveLogs()
    }
  }

  /**
   * Get all logs across all characters (for debugging)
   */
  getAllLogs(): CharacterLogEntry[] {
    const allLogs: CharacterLogEntry[] = []
    for (const logs of this.characterLogs.values()) {
      allLogs.push(...logs)
    }
    // Sort by timestamp
    return allLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }
}

export const characterLogManager = new CharacterLogManager()