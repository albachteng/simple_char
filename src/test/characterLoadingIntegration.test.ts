import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { CharacterManager } from '../storage/CharacterManager'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { createInventoryItem, BASE_WEAPONS, BASE_ARMOR } from '../inventory/InventoryConstants'

describe('Character Loading Integration', () => {
  it('should load a high level character with correct stats and inventory', async () => {
    const storage = new LocalStorageCharacterStorage()
    const manager = new CharacterManager(storage)
    
    // Create a high-level character with equipment
    const char = new Char('str', 'dex')
    
    // Add some items to inventory
    const sword = createInventoryItem(BASE_WEAPONS[0]) // Greatsword
    const armor = createInventoryItem(BASE_ARMOR[0]) // Plate Armor
    
    char.inventory.addItem(sword)
    char.inventory.addItem(armor)
    char.inventory.equipItem(sword.id)
    char.inventory.equipItem(armor.id)
    
    // Level up multiple times to test high level character
    char.level_up('str') // Level 2
    char.level_up('str') // Level 3
    char.level_up('dex') // Level 4
    char.level_up('str') // Level 5
    char.level_up('int') // Level 6
    
    // Save the character
    const characterName = 'HighLevelTestChar'
    await manager.saveCharacter(char, characterName, 'str', 'dex', [])
    
    // Load the character
    const result = await manager.loadCharacter(characterName)
    expect(result).not.toBeNull()
    
    if (result) {
      const { char: loadedChar } = result
      
      // Verify the character maintained its high level and stats
      expect(loadedChar.lvl).toBe(6)
      expect(loadedChar.str).toBe(22) // 16 + 2 + 2 + 2 (three str level ups)
      expect(loadedChar.dex).toBe(12)  // 10 + 2 (one dex level up)
      expect(loadedChar.int).toBe(8)   // 6 + 2 (one int level up)
      
      // Verify level-up choices were preserved
      expect(loadedChar.level_up_choices).toEqual(['str', 'str', 'dex', 'str', 'int'])
      
      // Verify inventory was preserved
      const items = loadedChar.inventory.getItems()
      expect(items).toHaveLength(2)
      
      const equippedItems = loadedChar.inventory.getEquippedItems()
      expect(equippedItems).toHaveLength(2)
      
      // Verify equipment is properly synced
      expect(loadedChar.weapon).toBe('two-hand')
      expect(loadedChar.armor).toBe('heavy')
      
      // Verify AC calculation includes equipment
      const ac = loadedChar.ac()
      expect(ac).toBeGreaterThan(13) // Should have armor bonus
      
      // Verify HP scaling with level
      expect(loadedChar.hp).toBeGreaterThan(30) // Should be much higher than level 1
    }
    
    // Clean up
    await manager.deleteCharacter(characterName)
  })
  
  it('should preserve sorcery and finesse points at high levels', async () => {
    const storage = new LocalStorageCharacterStorage()
    const manager = new CharacterManager(storage)
    
    // Create a DEX/INT focused character
    const char = new Char('dex', 'int')
    
    // Level up to get finesse and sorcery points
    char.level_up('dex') // Level 2 (should get finesse point at odd level)
    char.level_up('int') // Level 3 (should get sorcery points)
    char.level_up('int') // Level 4 (more sorcery points)
    char.level_up('dex') // Level 5 (another finesse point at odd level)
    
    // Save the character
    const characterName = 'HighLevelMageChar'
    await manager.saveCharacter(char, characterName, 'dex', 'int', [])
    
    // Load the character
    const result = await manager.loadCharacter(characterName)
    expect(result).not.toBeNull()
    
    if (result) {
      const { char: loadedChar } = result
      
      // Verify the character maintained its level and stats
      expect(loadedChar.lvl).toBe(5)
      expect(loadedChar.dex).toBe(20) // 16 + 2 + 2 (two dex level ups)
      expect(loadedChar.int).toBe(14)  // 6 + 2 + 2 (two int level ups)
      
      // Verify maneuver points were preserved
      expect(loadedChar.sorcery_points).toBeGreaterThan(0) // Should have sorcery points from int
      expect(loadedChar.finesse_points).toBeGreaterThan(0) // Should have finesse points from dex at odd levels
      
      // Verify level-up choices were preserved
      expect(loadedChar.level_up_choices).toEqual(['dex', 'int', 'int', 'dex'])
    }
    
    // Clean up
    await manager.deleteCharacter(characterName)
  })
})