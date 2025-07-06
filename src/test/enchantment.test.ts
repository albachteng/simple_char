import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'
import { DiceSettings } from '../utils/dice'
import type { EnchantmentLevel } from '../../types'

describe('Enchantment System', () => {
  it('should allow modifying weapon enchantment levels', () => {
    const char = new Char('str', 'dex')
    
    const sword = createInventoryItem({
      name: 'Test Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 0,
      description: 'Test weapon'
    })
    
    char.inventory.addItem(sword)
    
    // Test increasing enchantment
    let result = char.inventory.modifyEnchantment(sword.id, 1)
    expect(result.success).toBe(true)
    expect(sword.enchantmentLevel).toBe(1)
    
    // Test multiple increases up to maximum
    result = char.inventory.modifyEnchantment(sword.id, 2)
    expect(result.success).toBe(true)
    expect(sword.enchantmentLevel).toBe(3)
    
    // Test hitting maximum limit
    result = char.inventory.modifyEnchantment(sword.id, 1)
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Cannot enchant above +3 (maximum enchantment)')
    expect(sword.enchantmentLevel).toBe(3)
  })

  it('should allow cursing items with negative enchantment levels', () => {
    const char = new Char('str', 'dex')
    
    const armor = createInventoryItem({
      name: 'Test Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 0,
      description: 'Test armor'
    })
    
    char.inventory.addItem(armor)
    
    // Test decreasing enchantment to negative values (cursed)
    let result = char.inventory.modifyEnchantment(armor.id, -1)
    expect(result.success).toBe(true)
    expect(armor.enchantmentLevel).toBe(-1)
    
    // Test multiple decreases down to minimum
    result = char.inventory.modifyEnchantment(armor.id, -2)
    expect(result.success).toBe(true)
    expect(armor.enchantmentLevel).toBe(-3)
    
    // Test hitting minimum limit
    result = char.inventory.modifyEnchantment(armor.id, -1)
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Cannot enchant below -3 (maximum curse)')
    expect(armor.enchantmentLevel).toBe(-3)
  })

  it('should directly set enchantment levels', () => {
    const char = new Char('str', 'dex')
    
    const weapon = createInventoryItem({
      name: 'Test Weapon',
      type: 'weapon',
      weaponType: 'finesse',
      enchantmentLevel: 2,
      description: 'Test weapon'
    })
    
    char.inventory.addItem(weapon)
    
    // Test setting to 0 (reset)
    let result = char.inventory.setEnchantment(weapon.id, 0)
    expect(result.success).toBe(true)
    expect(weapon.enchantmentLevel).toBe(0)
    
    // Test setting to negative value
    result = char.inventory.setEnchantment(weapon.id, -2)
    expect(result.success).toBe(true)
    expect(weapon.enchantmentLevel).toBe(-2)
    
    // Test invalid range
    result = char.inventory.setEnchantment(weapon.id, 5)
    expect(result.success).toBe(false)
    expect(result.errorMessage).toBe('Enchantment level must be between -3 and +3')
    expect(weapon.enchantmentLevel).toBe(-2)
  })

  it('should add enchantment bonuses to attack rolls', () => {
    // Disable dice rolling for consistent results
    DiceSettings.setUseDiceRolls(false)
    
    const char = new Char('str', 'dex')
    char.str = 16 // For +3 modifier
    char.updateInventoryStats()
    
    const enchantedSword = createInventoryItem({
      name: 'Enchanted Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 2,
      description: 'Magical sword +2'
    })
    
    char.inventory.addItem(enchantedSword)
    char.inventory.equipItem(enchantedSword.id)
    char.syncEquipmentFromInventory()
    
    // Main-hand attack: d20(average 10.5) + STR mod(3) + level(1) + enchantment(2) = 16.5 ≈ 16
    const attackRoll = char.mainHandAttackRoll()
    expect(attackRoll).toBe(16)
  })

  it('should add enchantment bonuses to damage rolls', () => {
    // Disable dice rolling for consistent results
    DiceSettings.setUseDiceRolls(false)
    
    const char = new Char('str', 'dex')
    char.str = 16 // For +3 modifier
    char.updateInventoryStats()
    
    const enchantedSword = createInventoryItem({
      name: 'Enchanted Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 2,
      description: 'Magical sword +2'
    })
    
    char.inventory.addItem(enchantedSword)
    char.inventory.equipItem(enchantedSword.id)
    char.syncEquipmentFromInventory()
    
    // Main-hand damage: 1d8(average 4.5) + STR mod(3) + enchantment(2) = 9.5 ≈ 9
    const damageRoll = char.mainHandDamageRoll()
    expect(damageRoll).toBe(9)
  })

  it('should add enchantment bonuses to AC for armor and shields', () => {
    const char = new Char('dex', 'str')
    char.str = 12 // Meet light armor requirements
    char.updateInventoryStats()
    
    const enchantedArmor = createInventoryItem({
      name: 'Enchanted Leather',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 2,
      description: 'Magical leather armor +2'
    })
    
    const enchantedShield = createInventoryItem({
      name: 'Enchanted Shield',
      type: 'shield',
      enchantmentLevel: 1,
      description: 'Magical shield +1'
    })
    
    char.inventory.addItem(enchantedArmor)
    char.inventory.addItem(enchantedShield)
    char.inventory.equipItem(enchantedArmor.id)
    char.inventory.equipItem(enchantedShield.id)
    char.syncEquipmentFromInventory()
    
    // Base AC: 13 + DEX mod(3) + light armor(1) + shield(2) + enchantments(2+1) = 22
    const ac = char.ac()
    expect(ac).toBe(22)
  })

  it('should apply negative enchantment penalties', () => {
    // Disable dice rolling for consistent results
    DiceSettings.setUseDiceRolls(false)
    
    const char = new Char('str', 'dex')
    char.str = 16 // For +3 modifier
    char.updateInventoryStats()
    
    const cursedSword = createInventoryItem({
      name: 'Cursed Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: -2 as EnchantmentLevel,
      description: 'Cursed sword -2'
    })
    
    char.inventory.addItem(cursedSword)
    char.inventory.equipItem(cursedSword.id)
    char.syncEquipmentFromInventory()
    
    // Main-hand attack: d20(10.5) + STR mod(3) + level(1) + enchantment(-2) = 12.5 ≈ 12
    const attackRoll = char.mainHandAttackRoll()
    expect(attackRoll).toBe(12)
    
    // Main-hand damage: 1d8(4.5) + STR mod(3) + enchantment(-2) = 5.5 ≈ 5
    const damageRoll = char.mainHandDamageRoll()
    expect(damageRoll).toBe(5)
  })

  it('should apply enchantment bonuses to off-hand weapons', () => {
    // Disable dice rolling for consistent results
    DiceSettings.setUseDiceRolls(false)
    
    const char = new Char('dex', 'str') // Make DEX the high stat
    char.dex = 16 // Explicit set to 16 for +3 modifier
    char.updateInventoryStats()
    
    const mainWeapon = createInventoryItem({
      name: 'Main Sword',
      type: 'weapon',
      weaponType: 'one-hand',
      enchantmentLevel: 0,
      description: 'Main weapon'
    })
    
    const offWeapon = createInventoryItem({
      name: 'Off-hand Dagger',
      type: 'weapon',
      weaponType: 'finesse',
      enchantmentLevel: 1,
      description: 'Enchanted dagger +1'
    })
    
    char.inventory.addItem(mainWeapon)
    char.inventory.addItem(offWeapon)
    char.inventory.equipItem(mainWeapon.id) // Goes to main-hand
    char.inventory.equipItem(offWeapon.id) // Goes to off-hand
    char.syncEquipmentFromInventory()
    
    // Off-hand attack: d20(10.5) + DEX mod(3) + enchantment(1) = 14.5 ≈ 14 (no level bonus)
    const offHandAttack = char.offHandAttackRoll()
    expect(offHandAttack).toBe(14)
    
    // Off-hand damage: 1d6(3.5) + enchantment(1) = 4.5 ≈ 4 (no stat modifier)
    const offHandDamage = char.offHandDamageRoll()
    expect(offHandDamage).toBe(4)
  })
  
  it('should get enchantment AC bonus from equipped armor and shields', () => {
    const char = new Char('str', 'dex')
    
    const enchantedArmor = createInventoryItem({
      name: 'Magic Plate',
      type: 'armor',
      armorType: 'heavy',
      enchantmentLevel: 2,
      description: 'Enchanted plate armor'
    })
    
    const enchantedShield = createInventoryItem({
      name: 'Magic Shield',
      type: 'shield',
      enchantmentLevel: 1,
      description: 'Enchanted shield'
    })
    
    const unequippedArmor = createInventoryItem({
      name: 'Backup Armor',
      type: 'armor',
      armorType: 'light',
      enchantmentLevel: 3,
      description: 'Not equipped'
    })
    
    char.inventory.addItem(enchantedArmor)
    char.inventory.addItem(enchantedShield)
    char.inventory.addItem(unequippedArmor)
    
    // Before equipping
    expect(char.inventory.getEquippedEnchantmentAcBonus()).toBe(0)
    
    // Equip armor and shield
    char.inventory.equipItem(enchantedArmor.id)
    char.inventory.equipItem(enchantedShield.id)
    
    // Should get +2 from armor and +1 from shield = +3 total
    expect(char.inventory.getEquippedEnchantmentAcBonus()).toBe(3)
  })
})