import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { CharacterManager } from '../storage/CharacterManager'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { createInventoryItem, BASE_WEAPONS, BASE_ARMOR } from '../inventory/InventoryConstants'

describe('Inventory Integration', () => {
  it('should save and load inventory with character', async () => {
    const storage = new LocalStorageCharacterStorage()
    const manager = new CharacterManager(storage)
    
    // Create a character
    const char = new Char('str', 'dex')
    
    // Add some items to inventory
    const sword = createInventoryItem(BASE_WEAPONS[0]) // Greatsword
    const armor = createInventoryItem(BASE_ARMOR[0]) // Plate Armor
    
    char.inventory.addItem(sword)
    char.inventory.addItem(armor)
    char.inventory.equipItem(sword.id)
    char.inventory.equipItem(armor.id)
    
    // Level up to test level choices
    char.level_up('str')
    char.level_up('dex')
    
    // Save the character
    const characterName = 'TestInventoryChar'
    await manager.saveCharacter(char, characterName, 'str', 'dex', [])
    
    // Load the character
    const loaded = await manager.loadCharacter(characterName)
    expect(loaded).not.toBeNull()
    
    if (loaded) {
      const { char: loadedChar } = loaded
      
      // Verify basic stats
      expect(loadedChar.lvl).toBe(3)
      expect(loadedChar.str).toBe(18) // 16 + 2 (one level up)
      expect(loadedChar.dex).toBe(12)  // 10 + 2 (one level up)
      
      // Verify level-up choices were preserved
      expect(loadedChar.level_up_choices).toEqual(['str', 'dex'])
      
      // Verify inventory was preserved
      const items = loadedChar.inventory.getItems()
      expect(items).toHaveLength(2)
      
      const equippedItems = loadedChar.inventory.getEquippedItems()
      expect(equippedItems).toHaveLength(2)
      
      // Verify equipment sync
      expect(loadedChar.weapon).toBe('two-hand')
      expect(loadedChar.armor).toBe('heavy')
    }
    
    // Clean up
    await manager.deleteCharacter(characterName)
  })
  
  it('should calculate AC with equipped item bonuses', () => {
    // Create a character with sufficient STR for light armor (requires 12 STR)
    const char = new Char('dex', 'str')
    char.str = 12 // Manually set STR to meet requirement
    char.updateInventoryStats() // Update inventory with new stats
    
    // Create an armor item with stat bonuses
    const enchantedArmor = createInventoryItem({
      name: 'Enchanted Leather',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 1,
      description: 'Magical leather armor',
      statBonuses: [{ stat: 'dex', bonus: 2 }]
    })
    
    char.inventory.addItem(enchantedArmor)
    const equipResult = char.inventory.equipItem(enchantedArmor.id)
    expect(equipResult.success).toBe(true) // Should succeed now
    char.syncEquipmentFromInventory()
    
    // Base AC calculation: 13 (base) + 3 (dex mod from 16) + 1 (light armor) = 17
    // With equipment bonus: 13 (base) + 4 (dex mod from 16+2) + 1 (light armor) + 1 (enchantment) = 19
    const ac = char.ac()
    expect(ac).toBe(19)
  })

  it('should prevent equipping armor with insufficient strength', () => {
    const char = new Char('dex', 'str') // STR 10, DEX 16
    
    // Create light armor (requires 12 STR)
    const lightArmor = createInventoryItem({
      name: 'Light Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 0,
      description: 'Basic light armor'
    })
    
    char.inventory.addItem(lightArmor)
    const equipResult = char.inventory.equipItem(lightArmor.id)
    
    expect(equipResult.success).toBe(false)
    expect(equipResult.errorMessage).toBe('Requires 12 STR (you have 10)')
    
    // Armor should not be equipped
    const equippedArmor = char.inventory.getEquippedItemByType('armor')
    expect(equippedArmor).toBeNull()
  })
})