import { ICharacterStorage, SavedCharacter } from './ICharacterStorage'
import { CharacterHasher } from './CharacterHasher'
import { Char } from '../useChar'
import { logger } from '../logger'
import { Stat, Race } from '../../types'

export class CharacterManager {
  constructor(private storage: ICharacterStorage) {}

  /**
   * Save a character with a given name
   */
  async saveCharacter(char: Char, name: string, high: Stat, mid: Stat, racialBonuses: Stat[]): Promise<void> {
    try {
      const savedChar = CharacterHasher.createSavedCharacter(
        char, 
        name, 
        high, 
        mid, 
        racialBonuses
      )
      
      await this.storage.saveCharacter(savedChar)
      
      logger.storage(`Character "${name}" saved successfully through CharacterManager`, {
        name,
        hash: savedChar.hash,
        level: char.lvl,
        race: char.race
      })
    } catch (error) {
      logger.storage(`Error saving character "${name}": ${error}`)
      throw new Error(`Failed to save character: ${error}`)
    }
  }

  /**
   * Load a character by name
   */
  async loadCharacter(name: string): Promise<{ char: Char; high: Stat; mid: Stat; racialBonuses: Stat[]; name: string } | null> {
    try {
      const savedChar = await this.storage.loadCharacter(name)
      if (!savedChar) return null
      
      return this.reconstructCharacter(savedChar)
    } catch (error) {
      logger.storage(`Error loading character "${name}": ${error}`)
      return null
    }
  }

  /**
   * Load a character by its hash
   */
  async loadCharacterByHash(hash: string): Promise<{ char: Char; high: Stat; mid: Stat; racialBonuses: Stat[]; name: string } | null> {
    try {
      const savedChar = await this.storage.loadCharacterByHash(hash)
      if (!savedChar) return null
      
      return this.reconstructCharacter(savedChar)
    } catch (error) {
      logger.storage(`Error loading character by hash "${hash}": ${error}`)
      return null
    }
  }

  /**
   * List all saved characters
   */
  async listCharacters(): Promise<SavedCharacter[]> {
    try {
      return await this.storage.listCharacters()
    } catch (error) {
      logger.storage(`Error listing characters: ${error}`)
      return []
    }
  }

  /**
   * Delete a character by name
   */
  async deleteCharacter(name: string): Promise<boolean> {
    try {
      return await this.storage.deleteCharacter(name)
    } catch (error) {
      logger.storage(`Error deleting character "${name}": ${error}`)
      return false
    }
  }

  /**
   * Check if a character exists
   */
  async characterExists(name: string): Promise<boolean> {
    try {
      return await this.storage.characterExists(name)
    } catch (error) {
      logger.storage(`Error checking if character "${name}" exists: ${error}`)
      return false
    }
  }

  /**
   * Validate a character's hash
   */
  validateCharacterHash(char: Char, name: string, expectedHash: string): boolean {
    return CharacterHasher.validateHash(char, name, expectedHash)
  }

  /**
   * Reconstruct a character from saved data
   */
  private reconstructCharacter(savedChar: SavedCharacter): { char: Char; high: Stat; mid: Stat; racialBonuses: Stat[]; name: string } {
    const { data } = savedChar
    
    // Create initial character
    const char = new Char(
      data.high as Stat,
      data.mid as Stat,
      data.race as Race,
      data.racialBonuses as Stat[]
    )
    
    // Restore level progression using actual choices
    if (data.level_up_choices && data.level_up_choices.length > 0) {
      data.level_up_choices.forEach(choice => {
        char.level_up(choice as Stat)
      })
    } else {
      // Fallback for older saves without level_up_choices
      const targetLevel = data.level
      while (char.lvl < targetLevel) {
        char.level_up(data.high as Stat)
      }
    }
    
    // Restore equipment
    if (data.armor !== 'none') {
      char.equip_armor(data.armor as any)
    }
    if (data.weapon !== 'none') {
      char.equip_weapon(data.weapon as any)
    }
    if (data.shield) {
      char.equip_shield()
    }
    
    // Restore inventory
    if (data.inventory) {
      char.inventory.setInventory(data.inventory)
      // Sync equipment state after loading inventory
      char.syncEquipmentFromInventory()
    }
    
    // Restore stat modifiers
    if (data.useStatOverrides && data.statModifiers) {
      char.toggleStatOverrides() // Enable overrides
      char.setStatModifier('str', data.statModifiers.str)
      char.setStatModifier('dex', data.statModifiers.dex)
      char.setStatModifier('int', data.statModifiers.int)
    }
    
    // Validate the reconstruction
    const isValid = this.validateCharacterHash(char, savedChar.name, savedChar.hash)
    if (!isValid) {
      logger.storage(`Warning: Character "${savedChar.name}" hash validation failed during reconstruction`)
    }
    
    logger.storage(`Character "${savedChar.name}" reconstructed successfully`, {
      name: savedChar.name,
      level: char.lvl,
      race: char.race,
      hash_valid: isValid
    })
    
    return {
      char,
      high: data.high as Stat,
      mid: data.mid as Stat,
      racialBonuses: data.racialBonuses as Stat[],
      name: savedChar.name
    }
  }
}