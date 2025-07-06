import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'

describe('Armor Validation System', () => {
  it('should prevent equipping armor with insufficient strength', () => {
    const char = new Char('dex', 'int') // STR 6, DEX 16, INT 10
    
    // Try to equip light armor (requires 12 STR)
    const lightArmor = createInventoryItem({
      name: 'Leather Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 0,
      description: 'Basic leather armor'
    })
    
    char.inventory.addItem(lightArmor)
    const result = char.inventory.equipItem(lightArmor.id)
    
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Requires 12 STR (you have 6)')
    
    // Armor should not be equipped
    const equippedArmor = char.inventory.getEquippedItemByType('armor')
    expect(equippedArmor).toBeNull()
  })

  it('should allow equipping armor with sufficient strength', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Equip heavy armor (requires 16 STR)
    const heavyArmor = createInventoryItem({
      name: 'Plate Armor',
      type: 'armor',
      armorType: 'heavy',
      enchantmentLevel: 0,
      description: 'Heavy plate armor'
    })
    
    char.inventory.addItem(heavyArmor)
    const result = char.inventory.equipItem(heavyArmor.id)
    
    expect(result.success).toBe(true)
    expect(result.errorMessage).toBeUndefined()
    
    // Armor should be equipped
    const equippedArmor = char.inventory.getEquippedItemByType('armor')
    expect(equippedArmor).toBeTruthy()
    expect(equippedArmor?.armorType).toBe('heavy')
  })

  it('should update validation when character stats change', () => {
    const char = new Char('dex', 'int') // STR 6, DEX 16, INT 10
    
    const lightArmor = createInventoryItem({
      name: 'Leather Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 0,
      description: 'Basic leather armor'
    })
    
    char.inventory.addItem(lightArmor)
    
    // Should fail initially
    let result = char.inventory.equipItem(lightArmor.id)
    expect(result.success).toBe(false)
    
    // Level up STR to meet requirement
    char.str = 12
    char.updateInventoryStats()
    
    // Should succeed now
    result = char.inventory.equipItem(lightArmor.id)
    expect(result.success).toBe(true)
    
    // Armor should be equipped
    const equippedArmor = char.inventory.getEquippedItemByType('armor')
    expect(equippedArmor).toBeTruthy()
  })

  it('should validate all armor types correctly', () => {
    const testCases = [
      { armorType: 'light' as const, requiredStr: 12 },
      { armorType: 'medium' as const, requiredStr: 14 }, 
      { armorType: 'heavy' as const, requiredStr: 16 },
    ]
    
    testCases.forEach(({ armorType, requiredStr }) => {
      // Test with insufficient STR
      const lowStrChar = new Char('dex', 'int') // STR 6
      const armor = createInventoryItem({
        name: `${armorType} armor`,
        type: 'armor',
        armorType,
        enchantmentLevel: 0,
        description: `${armorType} armor`
      })
      
      lowStrChar.inventory.addItem(armor)
      let result = lowStrChar.inventory.equipItem(armor.id)
      expect(result.success).toBe(false)
      expect(result.errorMessage).toBe(`Requires ${requiredStr} STR (you have 6)`)
      
      // Test with sufficient STR
      const highStrChar = new Char('str', 'dex') // STR 16
      highStrChar.inventory.addItem(armor)
      result = highStrChar.inventory.equipItem(armor.id)
      expect(result.success).toBe(true)
    })
  })
})