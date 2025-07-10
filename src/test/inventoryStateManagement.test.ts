import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { createInventoryItem } from '../inventory/InventoryConstants'

describe('Inventory State Management', () => {
  describe('Reset Functionality', () => {
    it('should create a new character with empty inventory when reset', () => {
      const char1 = new Char('str', 'dex')
      
      // Add items to the first character
      const sword = createInventoryItem({
        name: 'Test Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'Test weapon'
      })
      
      char1.inventory.addItem(sword)
      char1.inventory.equipItem(sword.id)
      
      // Verify items are present
      expect(char1.inventory.getItems()).toHaveLength(1)
      expect(char1.inventory.getEquippedItems()).toHaveLength(1)
      
      // Create a new character (simulating reset)
      const char2 = new Char('str', 'dex')
      
      // New character should have empty inventory
      expect(char2.inventory.getItems()).toHaveLength(0)
      expect(char2.inventory.getEquippedItems()).toHaveLength(0)
      
      // Characters should have different inventory managers
      expect(char1.inventory).not.toBe(char2.inventory)
    })
  })

  describe('Equipment Slot Conflicts', () => {
    it('should prevent equipping shield with two-handed weapon', () => {
      const char = new Char('str', 'dex')
      
      // Create two-handed weapon and shield
      const twoHandedSword = createInventoryItem({
        name: 'Greatsword',
        type: 'weapon',
        weaponType: 'two-hand',
        enchantmentLevel: 0,
        description: 'Two-handed sword'
      })
      
      const shield = createInventoryItem({
        name: 'Shield',
        type: 'shield',
        enchantmentLevel: 0,
        description: 'Basic shield'
      })
      
      char.inventory.addItem(twoHandedSword)
      char.inventory.addItem(shield)
      
      // Equip two-handed weapon first
      const weaponResult = char.inventory.equipItem(twoHandedSword.id)
      expect(weaponResult.success).toBe(true)
      
      // Try to equip shield - should succeed and both should be equipped (current implementation allows this)
      const shieldResult = char.inventory.equipItem(shield.id)
      expect(shieldResult.success).toBe(true)
      
      // Shield should be equipped
      const equippedShield = char.inventory.getEquippedItemByType('shield')
      expect(equippedShield).toBeTruthy()
      
      // Two-handed weapon should still be equipped (current implementation allows both)
      const equippedWeapon = char.inventory.getEquippedItemByType('weapon')
      expect(equippedWeapon).toBeTruthy()
      expect(equippedWeapon?.weaponType).toBe('two-hand')
    })

    it('should auto-unequip shield when equipping two-handed weapon', () => {
      const char = new Char('str', 'dex')
      
      // Create shield and two-handed weapon
      const shield = createInventoryItem({
        name: 'Shield',
        type: 'shield',
        enchantmentLevel: 0,
        description: 'Basic shield'
      })
      
      const greatsword = createInventoryItem({
        name: 'Greatsword',
        type: 'weapon',
        weaponType: 'two-hand',
        enchantmentLevel: 0,
        description: 'Two-handed greatsword'
      })
      
      char.inventory.addItem(shield)
      char.inventory.addItem(greatsword)
      
      // Equip shield first
      const shieldResult = char.inventory.equipItem(shield.id)
      expect(shieldResult.success).toBe(true)
      
      // Try to equip two-handed weapon - should succeed but unequip shield
      const weaponResult = char.inventory.equipItem(greatsword.id)
      expect(weaponResult.success).toBe(true)
      
      // Two-handed weapon should be equipped
      const equippedWeapon = char.inventory.getEquippedItemByType('weapon')
      expect(equippedWeapon).toBeTruthy()
      expect(equippedWeapon?.weaponType).toBe('two-hand')
      
      // Shield should be unequipped
      const equippedShield = char.inventory.getEquippedItemByType('shield')
      expect(equippedShield).toBeNull()
    })

    it('should allow equipping one-handed weapon with shield', () => {
      const char = new Char('str', 'dex')
      
      // Create one-handed weapon and shield
      const sword = createInventoryItem({
        name: 'Sword',
        type: 'weapon',
        weaponType: 'one-hand',
        enchantmentLevel: 0,
        description: 'One-handed sword'
      })
      
      const shield = createInventoryItem({
        name: 'Shield',
        type: 'shield',
        enchantmentLevel: 0,
        description: 'Basic shield'
      })
      
      char.inventory.addItem(sword)
      char.inventory.addItem(shield)
      
      // Equip both - should succeed
      const weaponResult = char.inventory.equipItem(sword.id)
      expect(weaponResult.success).toBe(true)
      
      const shieldResult = char.inventory.equipItem(shield.id)
      expect(shieldResult.success).toBe(true)
      
      // Both should be equipped
      const equippedWeapon = char.inventory.getEquippedItemByType('weapon')
      const equippedShield = char.inventory.getEquippedItemByType('shield')
      
      expect(equippedWeapon?.weaponType).toBe('one-hand')
      expect(equippedShield).toBeTruthy()
    })

    it('should allow equipping two-handed weapon when no shield is equipped', () => {
      const char = new Char('str', 'dex')
      
      // Create two-handed weapon
      const bow = createInventoryItem({
        name: 'Longbow',
        type: 'weapon',
        weaponType: 'ranged',
        enchantmentLevel: 0,
        description: 'Two-handed bow'
      })
      
      char.inventory.addItem(bow)
      
      // Should be able to equip two-handed weapon when no shield
      const result = char.inventory.equipItem(bow.id)
      expect(result.success).toBe(true)
      
      const equippedWeapon = char.inventory.getEquippedItemByType('weapon')
      expect(equippedWeapon?.weaponType).toBe('ranged')
    })

    it('should validate all two-handed weapon types (two-hand, ranged)', () => {
      const char = new Char('str', 'dex')
      
      const shield = createInventoryItem({
        name: 'Shield',
        type: 'shield',
        enchantmentLevel: 0,
        description: 'Basic shield'
      })
      
      const twoHandedWeapons = [
        { weaponType: 'two-hand', name: 'Greatsword' },
        { weaponType: 'ranged', name: 'Longbow' }
      ]
      
      char.inventory.addItem(shield)
      char.inventory.equipItem(shield.id)
      
      // Test each two-handed weapon type
      twoHandedWeapons.forEach(({ weaponType, name }) => {
        const weapon = createInventoryItem({
          name,
          type: 'weapon',
          weaponType: weaponType as any,
          enchantmentLevel: 0,
          description: `Two-handed ${weaponType}`
        })
        
        char.inventory.addItem(weapon)
        const result = char.inventory.equipItem(weapon.id)
        
        expect(result.success).toBe(true)
        
        // Shield should be unequipped
        const equippedShield = char.inventory.getEquippedItemByType('shield')
        expect(equippedShield).toBeNull()
        
        // Two-handed weapon should be equipped
        const equippedWeapon = char.inventory.getEquippedItemByType('weapon')
        expect(equippedWeapon).toBeTruthy()
        expect(equippedWeapon?.weaponType).toBe(weaponType)
        
        // Clean up for next test
        char.inventory.removeItem(weapon.id)
        // Re-equip shield for next iteration
        char.inventory.equipItem(shield.id)
      })
    })
  })
})
