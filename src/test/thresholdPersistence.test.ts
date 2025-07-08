import { describe, it, expect, beforeEach } from 'vitest'
import { CharacterManager } from '../storage/CharacterManager'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { Char } from '../useChar'

describe('Threshold Persistence', () => {
  let manager: CharacterManager
  let storage: LocalStorageCharacterStorage

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    storage = new LocalStorageCharacterStorage()
    manager = new CharacterManager(storage)
  })

  it('should save and load threshold tracking for sorcery', async () => {
    // Create character that reaches sorcery threshold at level 4
    const char = new Char('str', 'dex', null)
    char.level_up('int') // Level 2, INT 8
    char.level_up('int') // Level 3, INT 10
    char.level_up('int') // Level 4, INT 12 - crosses threshold!
    
    expect(char.getSorceryThresholdLevel()).toBe(4)
    expect(char.getDoubleSorceryThresholdLevel()).toBe(null)
    expect(char.max_sorcery_points).toBe(3)
    
    // Save character
    await manager.saveCharacter(char, 'test-char', 'str', 'dex', [])
    
    // Load character
    const loaded = await manager.loadCharacter('test-char')
    expect(loaded).not.toBeNull()
    
    if (loaded) {
      const { char: loadedChar } = loaded
      
      // Verify threshold tracking was preserved
      expect(loadedChar.getSorceryThresholdLevel()).toBe(4)
      expect(loadedChar.getDoubleSorceryThresholdLevel()).toBe(null)
      expect(loadedChar.max_sorcery_points).toBe(3)
      expect(loadedChar.sorcery_points).toBe(3)
      
      // Verify level progression still works correctly
      loadedChar.level_up('int') // Level 5, INT 14
      expect(loadedChar.max_sorcery_points).toBe(4) // Base 3 + 1 for level after threshold
      
      loadedChar.level_up('int') // Level 6, INT 16 - crosses double threshold!
      expect(loadedChar.getDoubleSorceryThresholdLevel()).toBe(6)
      expect(loadedChar.max_sorcery_points).toBe(5) // Base 3 + 2 for levels after threshold + 0 for double threshold
    }
  })

  it('should save and load threshold tracking for finesse', async () => {
    // Create character that reaches finesse threshold at level 6
    const char = new Char('str', 'int', null)
    char.level_up('dex') // Level 2, DEX 8
    char.level_up('dex') // Level 3, DEX 10
    char.level_up('dex') // Level 4, DEX 12
    char.level_up('dex') // Level 5, DEX 14
    char.level_up('dex') // Level 6, DEX 16 - crosses threshold!
    
    expect(char.getFinesseThresholdLevel()).toBe(6)
    expect(char.max_finesse_points).toBe(1)
    
    // Save character
    await manager.saveCharacter(char, 'test-finesse', 'str', 'int', [])
    
    // Load character
    const loaded = await manager.loadCharacter('test-finesse')
    expect(loaded).not.toBeNull()
    
    if (loaded) {
      const { char: loadedChar } = loaded
      
      // Verify threshold tracking was preserved
      expect(loadedChar.getFinesseThresholdLevel()).toBe(6)
      expect(loadedChar.max_finesse_points).toBe(1)
      expect(loadedChar.finesse_points).toBe(1)
      
      // Verify level progression still works correctly
      loadedChar.level_up('dex') // Level 7, DEX 18 - odd level after threshold
      expect(loadedChar.max_finesse_points).toBe(2) // Base 1 + 1 for odd level after threshold
    }
  })

  it('should save and load multiple threshold levels', async () => {
    // Create character with high INT from the start
    const char = new Char('int', 'str', null)
    expect(char.getSorceryThresholdLevel()).toBe(1)
    expect(char.getDoubleSorceryThresholdLevel()).toBe(1)
    expect(char.max_sorcery_points).toBe(3)
    
    // Level up to see progression
    char.level_up('int') // Level 2, INT 18
    expect(char.max_sorcery_points).toBe(5) // Base 3 + 1 for level after threshold + 1 for level after double threshold
    
    // Save character
    await manager.saveCharacter(char, 'test-multi', 'int', 'str', [])
    
    // Load character
    const loaded = await manager.loadCharacter('test-multi')
    expect(loaded).not.toBeNull()
    
    if (loaded) {
      const { char: loadedChar } = loaded
      
      // Verify both threshold levels were preserved
      expect(loadedChar.getSorceryThresholdLevel()).toBe(1)
      expect(loadedChar.getDoubleSorceryThresholdLevel()).toBe(1)
      expect(loadedChar.max_sorcery_points).toBe(5)
      expect(loadedChar.sorcery_points).toBe(5)
      
      // Verify progression continues correctly
      loadedChar.level_up('int') // Level 3, INT 20
      expect(loadedChar.max_sorcery_points).toBe(7) // Base 3 + 2 for levels after threshold + 2 for levels after double threshold
    }
  })

  it('should handle null thresholds correctly', async () => {
    // Create character with no thresholds met
    const char = new Char('str', 'dex', null)
    expect(char.getSorceryThresholdLevel()).toBe(null)
    expect(char.getDoubleSorceryThresholdLevel()).toBe(null)
    expect(char.getFinesseThresholdLevel()).toBe(null)
    expect(char.max_sorcery_points).toBe(0)
    expect(char.max_finesse_points).toBe(0)
    
    // Save character
    await manager.saveCharacter(char, 'test-null', 'str', 'dex', [])
    
    // Load character
    const loaded = await manager.loadCharacter('test-null')
    expect(loaded).not.toBeNull()
    
    if (loaded) {
      const { char: loadedChar } = loaded
      
      // Verify null thresholds were preserved
      expect(loadedChar.getSorceryThresholdLevel()).toBe(null)
      expect(loadedChar.getDoubleSorceryThresholdLevel()).toBe(null)
      expect(loadedChar.getFinesseThresholdLevel()).toBe(null)
      expect(loadedChar.max_sorcery_points).toBe(0)
      expect(loadedChar.max_finesse_points).toBe(0)
      
      // Verify progression still works when thresholds are reached
      loadedChar.level_up('int') // Level 2, INT 8
      loadedChar.level_up('int') // Level 3, INT 10
      loadedChar.level_up('int') // Level 4, INT 12 - crosses threshold!
      
      expect(loadedChar.getSorceryThresholdLevel()).toBe(4)
      expect(loadedChar.max_sorcery_points).toBe(3)
    }
  })

  it('should preserve threshold data across multiple save/load cycles', async () => {
    // Create character and reach thresholds
    const char = new Char('dex', 'int', null)
    char.level_up('int') // Level 2, INT 12 - crosses sorcery threshold!
    
    expect(char.getSorceryThresholdLevel()).toBe(2)
    expect(char.getFinesseThresholdLevel()).toBe(1) // DEX 16 from start
    
    // Save character
    await manager.saveCharacter(char, 'test-cycles', 'dex', 'int', [])
    
    // Load and modify
    const loaded1 = await manager.loadCharacter('test-cycles')
    expect(loaded1).not.toBeNull()
    
    if (loaded1) {
      const { char: char1 } = loaded1
      char1.level_up('int') // Level 3, INT 14
      
      // Save again
      await manager.saveCharacter(char1, 'test-cycles', 'dex', 'int', [])
      
      // Load again
      const loaded2 = await manager.loadCharacter('test-cycles')
      expect(loaded2).not.toBeNull()
      
      if (loaded2) {
        const { char: char2 } = loaded2
        
        // Verify thresholds are still correct
        expect(char2.getSorceryThresholdLevel()).toBe(2)
        expect(char2.getFinesseThresholdLevel()).toBe(1)
        expect(char2.max_sorcery_points).toBe(4) // Base 3 + 1 for level after threshold
        expect(char2.max_finesse_points).toBe(2) // Base 1 + 1 for odd level after threshold
      }
    }
  })
})