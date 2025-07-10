import { Char } from '../useChar'
import { SavedCharacter } from './ICharacterStorage'

export class CharacterHasher {
  /**
   * Creates a hash from character data that can be used to identify/retrieve
   * characters even after browser cache is cleared
   */
  static createHash(char: Char, name: string): string {
    const hashData = {
      name,
      str: char.str,
      dex: char.dex,
      int: char.int,
      level: char.lvl,
      hp: char.hp,
      race: char.race,
      abilities: char.abilities.sort(), // Sort for consistent hashing
      armor: char.armor,
      weapon: char.weapon,
      shield: char.shield,
      hp_rolls: char.hp_rolls,
      level_up_choices: char.level_up_choices,
      pending_level_up_points: char.pending_level_up_points,
      inventory: char.inventory.getInventory(),
      useStatOverrides: char.isUsingStatOverrides(),
      statModifiers: {
        str: char.getStatModifier('str'),
        dex: char.getStatModifier('dex'),
        int: char.getStatModifier('int')
      },
      learnedAbilities: char.abilityManager.getAllAbilities(),
      // Include threshold tracking for consistent hashing
      sorceryThresholdLevel: char.getSorceryThresholdLevel(),
      doubleSorceryThresholdLevel: char.getDoubleSorceryThresholdLevel(),
      finesseThresholdLevel: char.getFinesseThresholdLevel(),
      // Include notes in hash
      notes: char.getNotes()
    }
    
    // Simple hash function using character data
    const dataString = JSON.stringify(hashData)
    return this.simpleHash(dataString)
  }

  /**
   * Creates a SavedCharacter object from a Char instance
   */
  static createSavedCharacter(char: Char, name: string, high: string, mid: string, racialBonuses: string[]): SavedCharacter {
    const hash = this.createHash(char, name)
    
    return {
      name,
      hash,
      data: {
        high,
        mid,
        race: char.race,
        racialBonuses,
        level: char.lvl,
        hp_rolls: char.hp_rolls,
        level_up_choices: char.level_up_choices,
        pending_level_up_points: char.pending_level_up_points,
        armor: char.armor,
        weapon: char.weapon,
        shield: char.shield,
        inventory: char.inventory.getInventory(),
        useStatOverrides: char.isUsingStatOverrides(),
        statModifiers: {
          str: char.getStatModifier('str'),
          dex: char.getStatModifier('dex'),
          int: char.getStatModifier('int')
        },
        learnedAbilities: char.abilityManager.getAllAbilities(),
        // Include threshold tracking for proper resource progression
        sorceryThresholdLevel: char.getSorceryThresholdLevel(),
        doubleSorceryThresholdLevel: char.getDoubleSorceryThresholdLevel(),
        finesseThresholdLevel: char.getFinesseThresholdLevel(),
        // Include notes in saved character data
        notes: char.getNotes()
      },
      timestamp: Date.now()
    }
  }

  /**
   * Validates if a character matches its hash
   */
  static validateHash(char: Char, name: string, expectedHash: string): boolean {
    const currentHash = this.createHash(char, name)
    return currentHash === expectedHash
  }

  /**
   * Simple hash function for creating character hashes
   */
  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}