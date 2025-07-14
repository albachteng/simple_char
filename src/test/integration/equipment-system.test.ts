import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../../useChar'
import { InventoryManager } from '../../inventory/InventoryManager'

describe('Equipment System Integration Tests', () => {
  let character: Char
  let inventoryManager: InventoryManager

  beforeEach(() => {
    character = new Char('str', 'dex')
    character.setName('EquipmentTest')
    inventoryManager = new InventoryManager({ items: [] })
    inventoryManager.setCharacterStats({
      str: character.str,
      dex: character.dex,
      int: character.int
    })
  })

  describe('Item Addition & Equipment Integration', () => {
    it('should add items and affect character stats', () => {
      // Add a weapon
      inventoryManager.addItem({
        id: 'iron-sword',
        name: 'Iron Sword',
        type: 'weapon',
        weaponType: 'sword',
        equipped: false,
        enchantmentLevel: 0,
        attack_bonus: 1,
        damage_dice: '1d8'
      })

      expect(inventoryManager.getItems()).toHaveLength(1)
      
      // Equip the weapon
      inventoryManager.equipItem('iron-sword')
      
      const equippedWeapon = inventoryManager.getEquippedWeapon('main-hand')
      expect(equippedWeapon).toBeDefined()
      expect(equippedWeapon?.name).toBe('Iron Sword')
      
      // Sync equipment with character
      inventoryManager.syncEquipmentToCharacter(character)
      
      expect(character.weapon).toBe('sword')
      expect(character.attackBonus).toBe(1)
    })

    it('should enforce equipment requirements', () => {
      // Create a character with low stats
      const weakCharacter = new Char('dex', 'int') // STR will be 6
      inventoryManager.setCharacterStats({
        str: weakCharacter.str,
        dex: weakCharacter.dex,
        int: weakCharacter.int
      })

      // Try to add a heavy weapon requiring STR 16
      const heavyWeapon = {
        id: 'heavy-weapon',
        name: 'Great Sword',
        type: 'weapon' as const,
        weaponType: 'sword' as any,
        equipped: false,
        enchantmentLevel: 0,
        str_requirement: 16,
        attack_bonus: 3,
        damage_dice: '2d6'
      }

      inventoryManager.addItem(heavyWeapon)
      
      // Should be able to add but not equip
      expect(inventoryManager.getItems()).toHaveLength(1)
      
      const canEquip = inventoryManager.canEquipItem('heavy-weapon')
      expect(canEquip).toBe(false)
      
      // Attempt to equip should fail
      const result = inventoryManager.equipItem('heavy-weapon')
      expect(result).toBe(false)
      
      const equipped = inventoryManager.getEquippedWeapon('main-hand')
      expect(equipped).toBeNull()
    })
  })

  describe('Dual Wielding & Slot Management', () => {
    it('should handle dual wielding mechanics correctly', () => {
      // Add two weapons
      const mainWeapon = {
        id: 'main-sword',
        name: 'Main Sword',
        type: 'weapon' as const,
        weaponType: 'sword' as any,
        equipped: false,
        enchantmentLevel: 0,
        attack_bonus: 1,
        damage_dice: '1d8'
      }

      const offWeapon = {
        id: 'off-sword',
        name: 'Off-hand Sword',
        type: 'weapon' as const,
        weaponType: 'sword' as any,
        equipped: false,
        enchantmentLevel: 0,
        attack_bonus: 1,
        damage_dice: '1d6'
      }

      inventoryManager.addItem(mainWeapon)
      inventoryManager.addItem(offWeapon)

      // Equip to main-hand
      inventoryManager.equipItem('main-sword', 'main-hand')
      expect(inventoryManager.getEquippedWeapon('main-hand')?.name).toBe('Main Sword')

      // Equip to off-hand
      inventoryManager.equipItem('off-sword', 'off-hand')
      expect(inventoryManager.getEquippedWeapon('off-hand')?.name).toBe('Off-hand Sword')

      // Both should be equipped
      const equipped = inventoryManager.getEquippedItems()
      expect(equipped).toHaveLength(2)
    })

    it('should handle equipment conflicts properly', () => {
      // Add a two-handed weapon
      const twoHandedWeapon = {
        id: 'two-handed',
        name: 'Two-Handed Sword',
        type: 'weapon' as const,
        weaponType: 'sword' as any,
        equipped: false,
        enchantmentLevel: 0,
        conflicts_with: ['off-hand'],
        valid_slots: ['main-hand'],
        attack_bonus: 3,
        damage_dice: '2d6'
      }

      // Add off-hand weapon first
      const offWeapon = {
        id: 'dagger',
        name: 'Dagger',
        type: 'weapon' as const,
        weaponType: 'dagger' as any,
        equipped: false,
        enchantmentLevel: 0,
        valid_slots: ['main-hand', 'off-hand']
      }

      inventoryManager.addItem(offWeapon)
      inventoryManager.addItem(twoHandedWeapon)

      // Equip dagger to off-hand
      inventoryManager.equipItem('dagger', 'off-hand')
      expect(inventoryManager.getEquippedWeapon('off-hand')).toBeDefined()

      // Equip two-handed weapon (should unequip off-hand)
      inventoryManager.equipItem('two-handed', 'main-hand')
      
      expect(inventoryManager.getEquippedWeapon('main-hand')?.name).toBe('Two-Handed Sword')
      expect(inventoryManager.getEquippedWeapon('off-hand')).toBeNull()
    })
  })

  describe('Enchantment System Integration', () => {
    it('should apply enchantment bonuses to character stats', () => {
      const enchantedArmor = {
        id: 'enchanted-armor',
        name: 'Enchanted Leather',
        type: 'armor' as const,
        armorType: 'light' as any,
        equipped: false,
        enchantmentLevel: 2,
        ac_bonus: 2,
        dex_bonus: 1
      }

      inventoryManager.addItem(enchantedArmor)
      inventoryManager.equipItem('enchanted-armor')

      // Sync with character
      inventoryManager.syncEquipmentToCharacter(character)

      expect(character.armor).toBe('light')
      
      // Calculate AC with enchantments
      const calculatedAC = character.calculateAC()
      const expectedAC = 13 + character.getModifier(character.dex + 1) + 2 + 2 // base + dex(+enchanted) + armor + enchantment
      expect(calculatedAC).toBe(expectedAC)
    })

    it('should handle cursed items (negative enchantments)', () => {
      const cursedWeapon = {
        id: 'cursed-sword',
        name: 'Cursed Sword',
        type: 'weapon' as const,
        weaponType: 'sword' as any,
        equipped: false,
        enchantmentLevel: -2,
        attack_bonus: 1,
        damage_dice: '1d8'
      }

      inventoryManager.addItem(cursedWeapon)
      inventoryManager.equipItem('cursed-sword')

      inventoryManager.syncEquipmentToCharacter(character)

      // Attack bonus should be reduced by enchantment
      expect(character.attackBonus).toBe(1 - 2) // base - curse
    })
  })
})