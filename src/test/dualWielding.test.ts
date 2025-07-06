import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'
import { DiceSettings } from '../utils/dice'

describe('Dual-Wielding Combat System', () => {
  let char: Char

  beforeEach(() => {
    char = new Char('str', 'dex') // STR 16, DEX 10, INT 6
  })

  describe('Equipment Slot Assignment', () => {
    it('should equip first weapon to main-hand', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      char.inventory.addItem(sword)
      const result = char.inventory.equipItem(sword.id)
      
      expect(result.success).toBe(true)
      expect(sword.equipped).toBe(true)
      expect(sword.equipmentSlot).toBe('main-hand')
      
      const { mainHand, offHand } = char.inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(sword.id)
      expect(offHand).toBeNull()
    })

    it('should equip second weapon to off-hand', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      const dagger = createInventoryItem({
        name: 'Dagger',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 0,
        description: 'Finesse dagger'
      })

      char.inventory.addItem(sword)
      char.inventory.addItem(dagger)
      
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(dagger.id)
      
      expect(sword.equipped).toBe(true)
      expect(sword.equipmentSlot).toBe('main-hand')
      expect(dagger.equipped).toBe(true)
      expect(dagger.equipmentSlot).toBe('off-hand')
      
      const { mainHand, offHand } = char.inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(sword.id)
      expect(offHand?.id).toBe(dagger.id)
    })

    it('should replace main-hand weapon when both slots are occupied', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      const dagger = createInventoryItem({
        name: 'Dagger',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 0,
        description: 'Finesse dagger'
      })

      const axe = createInventoryItem({
        name: 'Axe',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed axe'
      })

      char.inventory.addItem(sword)
      char.inventory.addItem(dagger)
      char.inventory.addItem(axe)
      
      // Equip first two weapons
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(dagger.id)
      
      // Equip third weapon - should replace main-hand
      char.inventory.equipItem(axe.id)
      
      expect(sword.equipped).toBe(false) // Unequipped
      expect(sword.equipmentSlot).toBeUndefined()
      expect(dagger.equipped).toBe(true) // Still equipped in off-hand
      expect(dagger.equipmentSlot).toBe('off-hand')
      expect(axe.equipped).toBe(true) // New main-hand weapon
      expect(axe.equipmentSlot).toBe('main-hand')
      
      const { mainHand, offHand } = char.inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(axe.id)
      expect(offHand?.id).toBe(dagger.id)
    })

    it('should handle two-handed weapons correctly', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      const dagger = createInventoryItem({
        name: 'Dagger',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 0,
        description: 'Finesse dagger'
      })

      const greatsword = createInventoryItem({
        name: 'Greatsword',
        type: 'weapon',
        weaponType: 'two-hand',
        enchantmentLevel: 0,
        description: 'Two-handed sword'
      })

      char.inventory.addItem(sword)
      char.inventory.addItem(dagger)
      char.inventory.addItem(greatsword)
      
      // Equip dual weapons first
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(dagger.id)
      
      // Equip two-handed weapon - should fail with 'Cannot equip two-handed weapon while dual-wielding. Unequip one weapon first.'
      char.inventory.equipItem(greatsword.id)
      
      expect(sword.equipped).toBe(true)
      expect(sword.equipmentSlot).toBe('main-hand');
      expect(dagger.equipped).toBe(true)
      expect(dagger.equipmentSlot).toBe('off-hand')
      expect(greatsword.equipped).toBe(false)
      expect(greatsword.equipmentSlot).toBeUndefined()
      
      const { mainHand, offHand } = char.inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(sword.id)
      expect(offHand?.id).toBe(dagger.id)
    })
  })

  describe('Attack Rolls', () => {
    beforeEach(() => {
      // Disable dice rolling for consistent test results
      DiceSettings.setUseDiceRolls(false)
    })

    it('should calculate main-hand attack roll with level bonus', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand', // Uses STR
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      char.inventory.addItem(sword)
      char.inventory.equipItem(sword.id)
      
      const attackRoll = char.mainHandAttackRoll()
      
      // d20 (average 10.5) + STR mod (3) + level (1) = 14.5
      expect(attackRoll).toBe(14)
    })

    it('should calculate off-hand attack roll without level bonus', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      const dagger = createInventoryItem({
        name: 'Dagger',
        type: 'weapon',
        weaponType: 'finesse', // Uses DEX
        enchantmentLevel: 0,
        description: 'Finesse dagger'
      })

      char.inventory.addItem(sword)
      char.inventory.addItem(dagger)
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(dagger.id)
      
      const attackRoll = char.offHandAttackRoll()
      
      // d20 (average 10.5) + DEX mod (0) + no level bonus = 10.5
      expect(attackRoll).toBe(10)
    })

    it('should return 0 when no weapon is equipped', () => {
      expect(char.mainHandAttackRoll()).toBe(0)
      expect(char.offHandAttackRoll()).toBe(0)
    })

    it('should use correct stat for different weapon types', () => {
      const staff = createInventoryItem({
        name: 'Staff',
        type: 'weapon',
        weaponType: 'staff', // Uses INT
        enchantmentLevel: 0,
        description: 'Magic staff'
      })

      char.inventory.addItem(staff)
      char.inventory.equipItem(staff.id)
      
      const attackRoll = char.mainHandAttackRoll()
      
      // d20 (average 10.5) + INT mod (-2) + level (1) = 9.5
      expect(attackRoll).toBe(9)
    })
  })

  describe('Damage Rolls', () => {
    beforeEach(() => {
      // Disable dice rolling for consistent test results
      DiceSettings.setUseDiceRolls(false)
    })

    it('should calculate main-hand damage with stat modifier', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand', // d8 damage, uses STR
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      char.inventory.addItem(sword)
      char.inventory.equipItem(sword.id)
      
      const damage = char.mainHandDamageRoll()
      
      // d8 (average 4.5) + STR mod (3) = 7.5
      expect(damage).toBe(7)
    })

    it('should calculate off-hand damage without stat modifier', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      const dagger = createInventoryItem({
        name: 'Dagger',
        type: 'weapon',
        weaponType: 'finesse', // d6 damage
        enchantmentLevel: 0,
        description: 'Finesse dagger'
      })

      char.inventory.addItem(sword)
      char.inventory.addItem(dagger)
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(dagger.id)
      
      const damage = char.offHandDamageRoll()
      
      // d6 (average 3.5) + no stat modifier = 3.5
      expect(damage).toBe(3)
    })

    it('should return 0 when no weapon is equipped', () => {
      expect(char.mainHandDamageRoll()).toBe(0)
      expect(char.offHandDamageRoll()).toBe(0)
    })

    it('should use correct weapon die for different weapon types', () => {
      const greatsword = createInventoryItem({
        name: 'Greatsword',
        type: 'weapon',
        weaponType: 'two-hand', // d12 damage
        enchantmentLevel: 0,
        description: 'Two-handed sword'
      })

      char.inventory.addItem(greatsword)
      char.inventory.equipItem(greatsword.id)
      
      const damage = char.mainHandDamageRoll()
      
      // d12 (average 6.5) + STR mod (3) = 9.5
      expect(damage).toBe(9)
    })
  })

  describe('Unequipping Items', () => {
    it('should clear equipment slot when unequipping', () => {
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })

      char.inventory.addItem(sword)
      char.inventory.equipItem(sword.id)
      
      expect(sword.equipped).toBe(true)
      expect(sword.equipmentSlot).toBe('main-hand')
      
      char.inventory.unequipItem(sword.id)
      
      expect(sword.equipped).toBe(false)
      expect(sword.equipmentSlot).toBeUndefined()
      
      const { mainHand, offHand } = char.inventory.getEquippedWeapons()
      expect(mainHand).toBeNull()
      expect(offHand).toBeNull()
    })
  })
})
