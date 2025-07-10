import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryManager } from '../inventory/InventoryManager'
import type { InventoryItem } from '../../types'

describe('Equipment Slot Conflicts', () => {
  let inventory: InventoryManager
  
  // Test items
  const mainHandSword: InventoryItem = {
    id: 'sword-1',
    name: 'Iron Sword',
    type: 'weapon',
    weaponType: 'one-hand',
    equipped: false,
    enchantmentLevel: 0
  }
  
  const offHandDagger: InventoryItem = {
    id: 'dagger-1',
    name: 'Steel Dagger',
    type: 'weapon',
    weaponType: 'finesse',
    equipped: false,
    enchantmentLevel: 0
  }
  
  const twoHandedSword: InventoryItem = {
    id: 'greatsword-1',
    name: 'Greatsword',
    type: 'weapon',
    weaponType: 'two-hand',
    equipped: false,
    enchantmentLevel: 0
  }
  
  const rangedBow: InventoryItem = {
    id: 'bow-1',
    name: 'Longbow',
    type: 'weapon',
    weaponType: 'ranged',
    equipped: false,
    enchantmentLevel: 0
  }
  
  const shield: InventoryItem = {
    id: 'shield-1',
    name: 'Iron Shield',
    type: 'shield',
    equipped: false,
    enchantmentLevel: 0
  }
  
  const armor: InventoryItem = {
    id: 'armor-1',
    name: 'Chain Mail',
    type: 'armor',
    armorType: 'medium',
    equipped: false,
    enchantmentLevel: 0
  }

  beforeEach(() => {
    inventory = new InventoryManager()
    inventory.setCharacterStats({ str: 16, dex: 16, int: 16 })
    
    // Add all items to inventory
    inventory.addItem({ ...mainHandSword, equipped: false })
    inventory.addItem({ ...offHandDagger, equipped: false })
    inventory.addItem({ ...twoHandedSword, equipped: false })
    inventory.addItem({ ...rangedBow, equipped: false })
    inventory.addItem({ ...shield, equipped: false })
    inventory.addItem({ ...armor, equipped: false })
  })

  describe('Shield and Off-Hand Weapon Conflicts', () => {
    it('should unequip off-hand weapon when equipping shield', () => {
      // First equip main-hand and off-hand weapons
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(offHandDagger.id)
      
      // Verify dual-wielding setup
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(offHand?.id).toBe(offHandDagger.id)
      expect(inventory.getEquippedItemBySlot('shield')).toBeNull()
      
      // Equip shield - should unequip off-hand weapon
      const result = inventory.equipItem(shield.id)
      expect(result.success).toBe(true)
      
      // Verify shield is equipped and off-hand weapon is unequipped
      const equippedShield = inventory.getEquippedItemBySlot('shield')
      expect(equippedShield?.id).toBe(shield.id)
      
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(mainHandSword.id) // Main-hand should remain
      expect(newOffHand).toBeNull() // Off-hand should be unequipped
      
      // Verify the off-hand weapon is no longer equipped
      const offHandWeapon = inventory.getItems().find(item => item.id === offHandDagger.id)
      expect(offHandWeapon?.equipped).toBe(false)
      expect(offHandWeapon?.equipmentSlot).toBeUndefined()
    })

    it('should unequip shield when equipping off-hand weapon', () => {
      // First equip main-hand weapon and shield
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(shield.id)
      
      // Verify setup
      const { mainHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield.id)
      
      // Equip off-hand weapon - should unequip shield
      const result = inventory.equipItem(offHandDagger.id)
      expect(result.success).toBe(true)
      
      // Verify off-hand weapon is equipped and shield is unequipped
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(mainHandSword.id) // Main-hand should remain
      expect(newOffHand?.id).toBe(offHandDagger.id) // Off-hand should be equipped
      expect(inventory.getEquippedItemBySlot('shield')).toBeNull() // Shield should be unequipped
      
      // Verify the shield is no longer equipped
      const shieldItem = inventory.getItems().find(item => item.id === shield.id)
      expect(shieldItem?.equipped).toBe(false)
      expect(shieldItem?.equipmentSlot).toBeUndefined()
    })
  })

  describe('Two-Handed Weapon Conflicts', () => {
    it('should unequip shield when equipping two-handed weapon', () => {
      // First equip main-hand weapon and shield
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(shield.id)
      
      // Verify setup
      const { mainHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield.id)
      
      // Equip two-handed weapon - should unequip both main-hand and shield
      const result = inventory.equipItem(twoHandedSword.id)
      expect(result.success).toBe(true)
      
      // Verify two-handed weapon is equipped and shield/main-hand are unequipped
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(twoHandedSword.id)
      expect(newOffHand).toBeNull()
      expect(inventory.getEquippedItemBySlot('shield')).toBeNull()
      
      // Verify previous items are unequipped
      const prevMainHand = inventory.getItems().find(item => item.id === mainHandSword.id)
      expect(prevMainHand?.equipped).toBe(false)
      
      const shieldItem = inventory.getItems().find(item => item.id === shield.id)
      expect(shieldItem?.equipped).toBe(false)
    })

    it('should unequip both weapons when equipping two-handed weapon while dual-wielding', () => {
      // First equip main-hand and off-hand weapons
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(offHandDagger.id)
      
      // Verify dual-wielding setup
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(offHand?.id).toBe(offHandDagger.id)
      
      // Equip two-handed weapon - should unequip both weapons
      const result = inventory.equipItem(twoHandedSword.id)
      expect(result.success).toBe(true)
      
      // Verify two-handed weapon is equipped and both hands are cleared
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(twoHandedSword.id)
      expect(newOffHand).toBeNull()
      
      // Verify previous weapons are unequipped
      const prevMainHand = inventory.getItems().find(item => item.id === mainHandSword.id)
      expect(prevMainHand?.equipped).toBe(false)
      
      const prevOffHand = inventory.getItems().find(item => item.id === offHandDagger.id)
      expect(prevOffHand?.equipped).toBe(false)
    })

    it('should work the same way for ranged weapons (also two-handed)', () => {
      // First equip main-hand weapon and shield
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(shield.id)
      
      // Equip ranged weapon - should unequip both main-hand and shield
      const result = inventory.equipItem(rangedBow.id)
      expect(result.success).toBe(true)
      
      // Verify ranged weapon is equipped and shield/main-hand are unequipped
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(rangedBow.id)
      expect(newOffHand).toBeNull()
      expect(inventory.getEquippedItemBySlot('shield')).toBeNull()
    })
  })

  describe('Complex Equipment Scenarios', () => {
    it('should handle switching from two-handed to dual-wielding', () => {
      // First equip two-handed weapon
      inventory.equipItem(twoHandedSword.id)
      
      // Verify two-handed setup
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(twoHandedSword.id)
      expect(offHand).toBeNull()
      
      // Equip main-hand weapon - should replace two-handed weapon
      inventory.equipItem(mainHandSword.id)
      
      // Verify main-hand is equipped and two-handed is unequipped
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(mainHandSword.id)
      expect(newOffHand).toBeNull()
      
      const twoHandedWeapon = inventory.getItems().find(item => item.id === twoHandedSword.id)
      expect(twoHandedWeapon?.equipped).toBe(false)
      
      // Now equip off-hand weapon - should work normally
      inventory.equipItem(offHandDagger.id)
      
      const { mainHand: finalMainHand, offHand: finalOffHand } = inventory.getEquippedWeapons()
      expect(finalMainHand?.id).toBe(mainHandSword.id)
      expect(finalOffHand?.id).toBe(offHandDagger.id)
    })

    it('should handle switching from dual-wielding to shield', () => {
      // Start with dual-wielding
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(offHandDagger.id)
      
      // Verify dual-wielding
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(offHand?.id).toBe(offHandDagger.id)
      
      // Equip shield - should unequip off-hand weapon
      inventory.equipItem(shield.id)
      
      // Verify sword and shield setup
      const { mainHand: newMainHand, offHand: newOffHand } = inventory.getEquippedWeapons()
      expect(newMainHand?.id).toBe(mainHandSword.id)
      expect(newOffHand).toBeNull()
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield.id)
      
      // Verify off-hand weapon is unequipped
      const offHandWeapon = inventory.getItems().find(item => item.id === offHandDagger.id)
      expect(offHandWeapon?.equipped).toBe(false)
    })

    it('should handle multiple shield equips (replacing existing shield)', () => {
      // Add a second shield
      const shield2: InventoryItem = {
        id: 'shield-2',
        name: 'Steel Shield',
        type: 'shield',
        equipped: false,
        enchantmentLevel: 0
      }
      inventory.addItem(shield2)
      
      // Equip first shield
      inventory.equipItem(shield.id)
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield.id)
      
      // Equip second shield - should replace first shield
      inventory.equipItem(shield2.id)
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield2.id)
      
      // Verify first shield is unequipped
      const firstShield = inventory.getItems().find(item => item.id === shield.id)
      expect(firstShield?.equipped).toBe(false)
    })
  })

  describe('Armor Equipping (should not affect weapons/shields)', () => {
    it('should not affect weapons or shields when equipping armor', () => {
      // Set up dual-wielding
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(offHandDagger.id)
      
      // Equip armor - should not affect weapons
      inventory.equipItem(armor.id)
      
      // Verify weapons are still equipped
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(offHand?.id).toBe(offHandDagger.id)
      expect(inventory.getEquippedItemBySlot('armor')?.id).toBe(armor.id)
    })

    it('should not affect shield when equipping armor', () => {
      // Set up sword and shield
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(shield.id)
      
      // Equip armor - should not affect weapons or shield
      inventory.equipItem(armor.id)
      
      // Verify setup is unchanged
      const { mainHand, offHand } = inventory.getEquippedWeapons()
      expect(mainHand?.id).toBe(mainHandSword.id)
      expect(offHand).toBeNull()
      expect(inventory.getEquippedItemBySlot('shield')?.id).toBe(shield.id)
      expect(inventory.getEquippedItemBySlot('armor')?.id).toBe(armor.id)
    })
  })

  describe('Equipment Slot Validation', () => {
    it('should have correct equipment slots after conflicts are resolved', () => {
      // Start with dual-wielding
      inventory.equipItem(mainHandSword.id)
      inventory.equipItem(offHandDagger.id)
      
      // Verify equipment slots
      const mainHandWeapon = inventory.getItems().find(item => item.id === mainHandSword.id)
      const offHandWeapon = inventory.getItems().find(item => item.id === offHandDagger.id)
      
      expect(mainHandWeapon?.equipmentSlot).toBe('main-hand')
      expect(offHandWeapon?.equipmentSlot).toBe('off-hand')
      
      // Equip shield - should unequip off-hand and change slots
      inventory.equipItem(shield.id)
      
      // Verify slots after shield equip
      const shieldItem = inventory.getItems().find(item => item.id === shield.id)
      const unequippedOffHand = inventory.getItems().find(item => item.id === offHandDagger.id)
      
      expect(shieldItem?.equipmentSlot).toBe('shield')
      expect(unequippedOffHand?.equipmentSlot).toBeUndefined()
      expect(unequippedOffHand?.equipped).toBe(false)
    })
  })
});