import { ICharacterStorage, SavedCharacter } from './ICharacterStorage'
import { logger } from '../logger'

export class LocalStorageCharacterStorage implements ICharacterStorage {
  private readonly STORAGE_KEY = 'simple_char_saved_characters'

  private getStoredCharacters(): SavedCharacter[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const characters = JSON.parse(stored) as SavedCharacter[]
      logger.storage(`Loaded ${characters.length} characters from localStorage`)
      return characters
    } catch (error) {
      logger.storage(`Error loading characters from localStorage: ${error}`)
      return []
    }
  }

  private setStoredCharacters(characters: SavedCharacter[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters))
      logger.storage(`Saved ${characters.length} characters to localStorage`)
    } catch (error) {
      logger.storage(`Error saving characters to localStorage: ${error}`)
      throw new Error('Failed to save character to localStorage')
    }
  }

  async saveCharacter(character: SavedCharacter): Promise<void> {
    const characters = this.getStoredCharacters()
    
    // Remove existing character with same name
    const filteredCharacters = characters.filter(c => c.name !== character.name)
    
    // Add new character
    filteredCharacters.push(character)
    
    this.setStoredCharacters(filteredCharacters)
    
    logger.storage(`Character "${character.name}" saved successfully`, {
      name: character.name,
      hash: character.hash,
      timestamp: character.timestamp
    })
  }

  async loadCharacter(name: string): Promise<SavedCharacter | null> {
    const characters = this.getStoredCharacters()
    const character = characters.find(c => c.name === name)
    
    if (character) {
      logger.storage(`Character "${name}" loaded successfully`, {
        name: character.name,
        hash: character.hash,
        timestamp: character.timestamp
      })
    } else {
      logger.storage(`Character "${name}" not found`)
    }
    
    return character || null
  }

  async loadCharacterByHash(hash: string): Promise<SavedCharacter | null> {
    const characters = this.getStoredCharacters()
    const character = characters.find(c => c.hash === hash)
    
    if (character) {
      logger.storage(`Character with hash "${hash}" loaded successfully`, {
        name: character.name,
        hash: character.hash,
        timestamp: character.timestamp
      })
    } else {
      logger.storage(`Character with hash "${hash}" not found`)
    }
    
    return character || null
  }

  async listCharacters(): Promise<SavedCharacter[]> {
    const characters = this.getStoredCharacters()
    logger.storage(`Listed ${characters.length} characters`)
    return characters.sort((a, b) => b.timestamp - a.timestamp) // Most recent first
  }

  async deleteCharacter(name: string): Promise<boolean> {
    const characters = this.getStoredCharacters()
    const initialLength = characters.length
    const filteredCharacters = characters.filter(c => c.name !== name)
    
    if (filteredCharacters.length === initialLength) {
      logger.storage(`Character "${name}" not found for deletion`)
      return false
    }
    
    this.setStoredCharacters(filteredCharacters)
    logger.storage(`Character "${name}" deleted successfully`)
    return true
  }

  async characterExists(name: string): Promise<boolean> {
    const characters = this.getStoredCharacters()
    const exists = characters.some(c => c.name === name)
    logger.storage(`Character "${name}" exists: ${exists}`)
    return exists
  }
}
