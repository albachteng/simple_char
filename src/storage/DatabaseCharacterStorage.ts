import type { ICharacterStorage, SavedCharacter } from './ICharacterStorage'

/**
 * Database character storage implementation
 * Implements ICharacterStorage interface for database operations
 */
export class DatabaseCharacterStorage implements ICharacterStorage {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async saveCharacter(character: SavedCharacter): Promise<void> {
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(character),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to save character to database')
    }
  }

  async loadCharacter(name: string): Promise<SavedCharacter | null> {
    try {
      const response = await fetch(`/api/characters/${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error('Database character load error:', error)
      return null
    }
  }

  async loadCharacterByHash(hash: string): Promise<SavedCharacter | null> {
    // For now, we'll load all characters and find by hash
    // This could be optimized with a dedicated API endpoint
    try {
      const characters = await this.listCharacters()
      return characters.find(char => char.hash === hash) || null
    } catch (error) {
      console.error('Database character load by hash error:', error)
      return null
    }
  }

  async listCharacters(): Promise<SavedCharacter[]> {
    try {
      const response = await fetch('/api/characters', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.success ? data.data : []
    } catch (error) {
      console.error('Database character list error:', error)
      return []
    }
  }

  async deleteCharacter(name: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/characters/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      const data = await response.json()
      return data.success || false
    } catch (error) {
      console.error('Database character delete error:', error)
      return false
    }
  }

  async characterExists(name: string): Promise<boolean> {
    const character = await this.loadCharacter(name)
    return character !== null
  }
}