import type { ICharacterStorage, SavedCharacter } from './ICharacterStorage'
import { LocalStorageCharacterStorage } from './LocalStorageCharacterStorage'
import { DatabaseCharacterStorage } from './DatabaseCharacterStorage'

/**
 * Hybrid character storage that tries database first, then falls back to localStorage
 * Provides unified interface for both storage types
 */
export class HybridCharacterStorage implements ICharacterStorage {
  private databaseStorage: DatabaseCharacterStorage | null
  private localStorage: LocalStorageCharacterStorage

  constructor(token?: string) {
    this.databaseStorage = token ? new DatabaseCharacterStorage(token) : null
    this.localStorage = new LocalStorageCharacterStorage()
  }

  async saveCharacter(character: SavedCharacter): Promise<void> {
    if (this.databaseStorage) {
      try {
        await this.databaseStorage.saveCharacter(character)
        return
      } catch (error) {
        console.warn('Database save failed, falling back to localStorage:', error)
      }
    }
    
    // Fallback to localStorage
    await this.localStorage.saveCharacter(character)
  }

  async loadCharacter(name: string): Promise<SavedCharacter | null> {
    // Try database first if available
    if (this.databaseStorage) {
      try {
        const character = await this.databaseStorage.loadCharacter(name)
        if (character) {
          return character
        }
      } catch (error) {
        console.warn('Database load failed, trying localStorage:', error)
      }
    }
    
    // Fallback to localStorage
    return await this.localStorage.loadCharacter(name)
  }

  async loadCharacterByHash(hash: string): Promise<SavedCharacter | null> {
    // Try database first if available
    if (this.databaseStorage) {
      try {
        const character = await this.databaseStorage.loadCharacterByHash(hash)
        if (character) {
          return character
        }
      } catch (error) {
        console.warn('Database hash load failed, trying localStorage:', error)
      }
    }
    
    // Fallback to localStorage
    return await this.localStorage.loadCharacterByHash(hash)
  }

  async listCharacters(): Promise<SavedCharacter[]> {
    const databaseCharacters: SavedCharacter[] = []
    const localCharacters: SavedCharacter[] = []

    // Get database characters if available
    if (this.databaseStorage) {
      try {
        const dbChars = await this.databaseStorage.listCharacters()
        databaseCharacters.push(...dbChars.map(char => ({ ...char, storageType: 'database' as const })))
      } catch (error) {
        console.warn('Database list failed:', error)
      }
    }

    // Get local characters
    try {
      const localChars = await this.localStorage.listCharacters()
      localCharacters.push(...localChars.map(char => ({ ...char, storageType: 'local' as const })))
    } catch (error) {
      console.warn('Local storage list failed:', error)
    }

    // Combine and deduplicate by name, prioritizing database
    const combinedMap = new Map<string, SavedCharacter>()
    
    // Add local characters first
    localCharacters.forEach(char => {
      combinedMap.set(char.name, char)
    })
    
    // Add database characters, overriding local ones
    databaseCharacters.forEach(char => {
      combinedMap.set(char.name, char)
    })
    
    return Array.from(combinedMap.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  async deleteCharacter(name: string): Promise<boolean> {
    let success = true

    // Try to delete from database if available
    if (this.databaseStorage) {
      try {
        const dbSuccess = await this.databaseStorage.deleteCharacter(name)
        if (!dbSuccess) {
          success = false
        }
      } catch (error) {
        console.warn('Database delete failed:', error)
        success = false
      }
    }

    // Also try to delete from localStorage
    try {
      const localSuccess = await this.localStorage.deleteCharacter(name)
      if (!localSuccess) {
        success = false
      }
    } catch (error) {
      console.warn('Local storage delete failed:', error)
      success = false
    }

    return success
  }

  async characterExists(name: string): Promise<boolean> {
    // Check database first if available
    if (this.databaseStorage) {
      try {
        const exists = await this.databaseStorage.characterExists(name)
        if (exists) {
          return true
        }
      } catch (error) {
        console.warn('Database exists check failed:', error)
      }
    }
    
    // Check localStorage
    return await this.localStorage.characterExists(name)
  }
}