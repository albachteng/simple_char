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

  it('should use additive stat modifiers when overrides are enabled', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Enable overrides
    char.toggleStatOverrides()
    expect(char.isUsingStatOverrides()).toBe(true)
    
    // Modifiers should be initialized to 0 (no change)
    let effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(16)
    expect(effectiveStats.dex).toBe(10)
    expect(effectiveStats.int).toBe(6)
    
    // Set additive modifiers
    char.setStatOverride('str', 4) // 16 + 4 = 20
    char.setStatOverride('dex', -2) // 10 - 2 = 8
    char.setStatOverride('int', 8) // 6 + 8 = 14
    
    // Should now use modified values
    effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(20)
    expect(effectiveStats.dex).toBe(8)
    expect(effectiveStats.int).toBe(14)
  })

  it('should clamp final stat values between 0 and 30', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    char.toggleStatOverrides()
    
    // Test upper bound - adding 20 to STR 16 should clamp to 30
    char.setStatOverride('str', 20) // 16 + 20 = 36, clamped to 30
    expect(char.getStatOverride('str')).toBe(14) // Actual modifier is 30 - 16 = 14
    expect(char.getEffectiveStats().str).toBe(30)
    
    // Test lower bound - subtracting 15 from DEX 10 should clamp to 0
    char.setStatOverride('dex', -15) // 10 - 15 = -5, clamped to 0
    expect(char.getStatOverride('dex')).toBe(-10) // Actual modifier is 0 - 10 = -10
    expect(char.getEffectiveStats().dex).toBe(0)
  })

  it('should affect AC calculation when dex modifier is used', () => {
    const char = new Char('dex', 'str') // DEX 16, STR 10, INT 6
    const originalAC = char.ac()
    
    // Enable overrides and add to DEX
    char.toggleStatOverrides()
    char.setStatOverride('dex', 4) // 16 + 4 = 20
    
    const newAC = char.ac()
    expect(newAC).toBeGreaterThan(originalAC)
  })

  it('should affect equipment validation when str modifier is used', () => {
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
    
    // Enable overrides and add to STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 12) // 6 + 12 = 18
    
    // Should now be able to equip heavy armor
    result = char.inventory.equipItem(heavyArmor.id)
    expect(result.success).toBe(true)
    
    // Sync equipment state
    char.syncEquipmentFromInventory()
    expect(char.armor).toBe('heavy')
  })

  it('should affect weapon damage when modifier is used', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    char.equip_weapon('two-hand') // Uses STR for damage
    
    const originalDamage = char.weapon_attack()
    
    // Enable overrides and add to STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 4) // 16 + 4 = 20
    
    const newDamage = char.weapon_attack()
    expect(newDamage).toBeGreaterThan(originalDamage)
  })

  it('should affect combat maneuvers when str modifier is used', () => {
    const char = new Char('dex', 'int') // STR 6, DEX 16, INT 10 (no combat maneuvers)
    
    expect(char.maneuvers('str')).toBe(0) // STR < 16, no maneuvers
    
    // Enable overrides and add to STR
    char.toggleStatOverrides()
    char.setStatOverride('str', 12) // 6 + 12 = 18
    
    expect(char.maneuvers('str')).toBe(1) // STR >= 16, has maneuvers
  })

  it('should correctly toggle back to original stats', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Enable overrides and add modifiers
    char.toggleStatOverrides()
    char.setStatOverride('str', 4) // 16 + 4 = 20
    char.setStatOverride('dex', -2) // 10 - 2 = 8
    
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

  it('should preserve stored modifiers when re-enabling overrides', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Enable overrides and set modifiers
    char.toggleStatOverrides()
    char.setStatOverride('str', 5) // 16 + 5 = 21
    char.setStatOverride('dex', -3) // 10 - 3 = 7
    char.setStatOverride('int', 2) // 6 + 2 = 8
    
    // Verify modifiers are applied
    expect(char.getEffectiveStats().str).toBe(21)
    expect(char.getEffectiveStats().dex).toBe(7)
    expect(char.getEffectiveStats().int).toBe(8)
    
    // Disable overrides
    char.toggleStatOverrides()
    expect(char.isUsingStatOverrides()).toBe(false)
    expect(char.getEffectiveStats().str).toBe(16) // Back to original
    
    // Re-enable overrides - stored modifiers should still be preserved
    char.toggleStatOverrides()
    expect(char.isUsingStatOverrides()).toBe(true)
    
    // The stored modifiers should immediately take effect
    const effectiveStats = char.getEffectiveStats()
    expect(effectiveStats.str).toBe(21) // 16 + 5 (preserved modifier)
    expect(effectiveStats.dex).toBe(7)  // 10 - 3 (preserved modifier)
    expect(effectiveStats.int).toBe(8)  // 6 + 2 (preserved modifier)
    
    // Verify the stored modifiers are still accessible
    expect(char.getStatOverride('str')).toBe(5)
    expect(char.getStatOverride('dex')).toBe(-3)
    expect(char.getStatOverride('int')).toBe(2)
  })
})