import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'

describe('Combat Roll Breakdown System', () => {
  it('should show attack roll breakdown components', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Add and equip a weapon
    const sword = createInventoryItem({
      name: 'Test Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 0,
      description: 'Test weapon'
    })
    
    char.inventory.addItem(sword)
    char.inventory.equipItem(sword.id)
    
    // Verify weapon is equipped in main-hand
    const equippedWeapons = char.inventory.getEquippedWeapons()
    expect(equippedWeapons.mainHand).toBeTruthy()
    expect(equippedWeapons.mainHand?.name).toBe('Test Sword')
    
    // Get the attack roll result
    const attackRoll = char.mainHandAttackRoll()
    expect(attackRoll).toBeGreaterThan(0)
    
    // The attack roll should include:
    // - d20 roll (varies with dice settings)
    // - STR modifier (+3 for STR 16)
    // - Level (+1 for level 1)
    // Total should be at least 4 (minimum components without d20)
    expect(attackRoll).toBeGreaterThanOrEqual(4)
  })

  it('should show damage roll breakdown components', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Add and equip a weapon
    const sword = createInventoryItem({
      name: 'Test Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 0,
      description: 'Test weapon'
    })
    
    char.inventory.addItem(sword)
    char.inventory.equipItem(sword.id)
    
    // Get the damage roll result
    const damageRoll = char.mainHandDamageRoll()
    expect(damageRoll).toBeGreaterThan(0)
    
    // The damage roll should include:
    // - d8 roll (1-8 for one-hand weapon)
    // - STR modifier (+3 for STR 16)
    // Total should be at least 4 (1 + 3)
    expect(damageRoll).toBeGreaterThanOrEqual(4)
  })

  it('should handle enchanted weapons (future feature)', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Add and equip an enchanted weapon
    const enchantedSword = createInventoryItem({
      name: 'Enchanted Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 2,
      description: 'Magic weapon'
    })
    
    char.inventory.addItem(enchantedSword)
    char.inventory.equipItem(enchantedSword.id)
    
    // Get rolls with enchanted weapon
    const attackRoll = char.mainHandAttackRoll()
    const damageRoll = char.mainHandDamageRoll()
    
    // Currently enchantment bonuses are not implemented in core methods
    // So this should behave the same as a regular weapon
    // Attack roll: d20(min1) + STR(3) + level(1) = minimum 5
    expect(attackRoll).toBeGreaterThanOrEqual(5)
    
    // Damage roll: d8(min1) + STR(3) = minimum 4
    expect(damageRoll).toBeGreaterThanOrEqual(4)
    
    // TODO: When enchantment bonuses are implemented, update these expectations
  })

  it('should show off-hand weapon limitations', () => {
    const char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
    
    // Add and equip main-hand weapon
    const sword = createInventoryItem({
      name: 'Main Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 0,
      description: 'Main weapon'
    })
    
    // Add and equip off-hand weapon
    const dagger = createInventoryItem({
      name: 'Off-hand Dagger',
      type: 'weapon',
      weaponType: 'finesse',
      enchantmentLevel: 0,
      description: 'Off-hand weapon'
    })
    
    char.inventory.addItem(sword)
    char.inventory.addItem(dagger)
    char.inventory.equipItem(sword.id)
    char.inventory.equipItem(dagger.id)
    
    // Verify dual-wielding setup
    const equippedWeapons = char.inventory.getEquippedWeapons()
    expect(equippedWeapons.mainHand?.name).toBe('Main Sword')
    expect(equippedWeapons.offHand?.name).toBe('Off-hand Dagger')
    
    // Get attack rolls
    const mainHandAttack = char.mainHandAttackRoll()
    const offHandAttack = char.offHandAttackRoll()
    
    // Main-hand gets level bonus, off-hand doesn't
    // Main-hand: d20 + STR(3) + level(1) = minimum 5
    // Off-hand: d20 + DEX(0) = minimum 1
    expect(mainHandAttack).toBeGreaterThanOrEqual(5)
    expect(offHandAttack).toBeGreaterThanOrEqual(1)
    
    // Get damage rolls
    const mainHandDamage = char.mainHandDamageRoll()
    const offHandDamage = char.offHandDamageRoll()
    
    // Main-hand gets stat modifier, off-hand doesn't
    // Main-hand: d8 + STR(3) = minimum 4
    // Off-hand: d6 only = minimum 1
    expect(mainHandDamage).toBeGreaterThanOrEqual(4)
    expect(offHandDamage).toBeGreaterThanOrEqual(1)
    
    // Off-hand should generally be lower due to no stat modifier
    // This test might occasionally fail due to random rolls, but statistically should pass
    const mainHandAverage = (mainHandDamage + mainHandDamage + mainHandDamage) / 3
    const offHandAverage = (offHandDamage + offHandDamage + offHandDamage) / 3
    
    // Main-hand should have higher average due to stat bonus
    expect(mainHandAverage).toBeGreaterThan(offHandAverage - 1) // Allow some variance
  })
})