import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'

describe('Stat Override System', () => {
  it('should use original stats when overrides are disabled', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    const effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(16)
    expect(effectiveStats.dex).toBe(10)
    expect(effectiveStats.int).toBe(6)
    expect(char.isUsingStatOverrides()).toBe(false)
  })

  it('should use override stats when overrides are enabled', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Enable overrides
    char.toggleStatOverrides()
    expect(char.isUsingStatOverrides()).toBe(true)
    
    // Override stats should be initialized to current stats
    let effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(16)
    expect(effectiveStats.dex).toBe(10)
    expect(effectiveStats.int).toBe(6)
    
    // Set custom overrides
    char.setStatOverride('str', 20)
    char.setStatOverride('dex', 8)
    char.setStatOverride('int', 14)
    
    // Should now use override values
    effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(20)
    expect(effectiveStats.dex).toBe(8)
    expect(effectiveStats.int).toBe(14)
  })

  it('should clamp override values between 1 and 30', () => {
    const char = new Char('str', 'dex')
    char.toggleStatOverrides()
    
    // Test upper bound
    char.setStatOverride('str', 35)
    expect(char.getStatOverride('str')).toBe(30)
    expect(char.getEffectiveStats().str).toBe(30)
    
    // Test lower bound
    char.setStatOverride('dex', -5)
    expect(char.getStatOverride('dex')).toBe(1)
    expect(char.getEffectiveStats().dex).toBe(1)
  })

  it('should affect AC calculation when dex override is used', () => {
    const char = new Char('dex', 'str') // DEX 16, STR 10, INT 6
    const originalAC = char.ac()
    
    // Enable overrides and set higher DEX
    char.toggleStatOverrides()
    char.setStatOverride('dex', 20)
    
    const newAC = char.ac()
    expect(newAC).toBeGreaterThan(originalAC)
  })

  it('should affect equipment validation when str override is used', () => {
    const char = new Char('dex', 'int') // STR 6, DEX 16, INT 10
    
    // Create heavy armor item
    const heavyArmor = createInventoryItem({
      name: 'Test Plate Armor',
      type: 'armor',
      armorType: 'heavy',
      enchantmentLevel: 0,
      description: 'Test heavy armor'
    })
    
    // Should not be able to equip heavy armor normally (requires 16 STR)
    char.inventory.addItem(heavyArmor)
    let result = char.inventory.equipItem(heavyArmor.id)
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Requires 16 STR (you have 6)')
    
    // Enable overrides and set high STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 18)
    
    // Should now be able to equip heavy armor
    result = char.inventory.equipItem(heavyArmor.id)
    expect(result.success).toBe(true)
    
    // Sync equipment state
    char.syncEquipmentFromInventory()
    expect(char.armor).toBe('heavy')
  })

  it('should affect weapon damage when override is used', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    char.equip_weapon('two-hand') // Uses STR for damage
    
    const originalDamage = char.weapon_attack()
    
    // Enable overrides and set higher STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 20)
    
    const newDamage = char.weapon_attack()
    expect(newDamage).toBeGreaterThan(originalDamage)
  })

  it('should affect combat maneuvers when str override is used', () => {
    const char = new Char('dex', 'int') // STR 6, DEX 16, INT 10 (no combat maneuvers)
    
    expect(char.maneuvers('str')).toBe(0) // STR < 16, no maneuvers
    
    // Enable overrides and set high STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 18)
    
    expect(char.maneuvers('str')).toBe(1) // STR >= 16, has maneuvers
  })

  it('should correctly toggle back to original stats', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Enable overrides and change stats
    char.toggleStatOverrides()
    char.setStatOverride('str', 20)
    char.setStatOverride('dex', 8)
    
    expect(char.getEffectiveStats().str).toBe(20)
    expect(char.getEffectiveStats().dex).toBe(8)
    
    // Disable overrides
    char.toggleStatOverrides()
    expect(char.isUsingStatOverrides()).toBe(false)
    
    // Should return to original stats
    const effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(16)
    expect(effectiveStats.dex).toBe(10)
    expect(effectiveStats.int).toBe(6)
  })
})