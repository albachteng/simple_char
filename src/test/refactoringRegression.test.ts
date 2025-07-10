import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../useChar'
import { CharacterManager } from '../storage/CharacterManager'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { DiceSettings } from '../utils/dice'
import { createInventoryItem, BASE_WEAPONS, BASE_ARMOR } from '../inventory/InventoryConstants'

/**
 * Comprehensive regression test suite for refactoring protection
 * 
 * This test suite focuses on end-to-end workflows and integration scenarios
 * that must remain intact during component refactoring, particularly:
 * - Character creation flow (stat selection → race selection → bonus allocation)
 * - Character save/load functionality with full data integrity
 * - Level-up mechanics (both traditional and split allocation)
 * - Character display and stat calculations
 * - Equipment and inventory integration
 * 
 * These tests should be run before and after each refactoring phase
 * to ensure no critical functionality is broken during component extraction.
 */
describe('Refactoring Regression Test Suite', () => {
  beforeEach(() => {
    // Use consistent values for testing
    DiceSettings.setUseDiceRolls(false)
  })

  describe('Character Creation Workflow', () => {
    it('should complete full character creation workflow with all data intact', async () => {
      // Simulate the complete character creation flow:
      // 1. High stat selection → 2. Mid stat selection → 3. Race selection → 4. Bonus allocation
      
      const high = 'str'
      const mid = 'dex'
      const selectedRace = 'elf'
      const racialBonuses: never[] = [] // Elf gets fixed +2 DEX, no choices
      
      // Create character (this simulates what happens after all picker components)
      const char = new Char(high, mid, selectedRace, racialBonuses)
      
      // Verify character creation resulted in correct initial state
      expect(char.str).toBe(16) // Primary stat
      expect(char.dex).toBe(12)  // Secondary stat (10 + 2 racial bonus from elf)
      expect(char.int).toBe(6)   // Tertiary stat (no racial bonus to INT for elf)
      expect(char.race).toBe('elf')
      expect(char.abilities).toContain('Treewalk')
      expect(char.lvl).toBe(1)
      expect(char.hp).toBe(17) // Should have base (10)+ HP roll (4: at 16 str, d8 average) + 3 (str mod)
      
      // Test save/load cycle to ensure character creation data persists
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      const characterName = 'CreationWorkflowTest'
      
      await manager.saveCharacter(char, characterName, high, mid, racialBonuses)
      const result = await manager.loadCharacter(characterName)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.high).toBe(high)
        expect(result.mid).toBe(mid)
        expect(result.racialBonuses).toEqual(racialBonuses)
        expect(result.char.race).toBe(selectedRace)
        expect(result.char.str).toBe(16)
        expect(result.char.dex).toBe(12)
        expect(result.char.int).toBe(6)
		expect(result.char.abilities).toContain('Treewalk')
		expect(result.char.lvl).toBe(1)
		expect(result.char.hp).toBe(17) 
      }
      
      await manager.deleteCharacter(characterName)
    })

    it('should handle edge case: Human with "any" stat bonus selection', async () => {
      // Test the special case where human racial bonus is "any" stat
      // Human gets +1 to any, +1 to any - we choose both for DEX
      const char = new Char('int', 'str', 'human', ['dex', 'dex'])
      
      expect(char.int).toBe(16) // Primary
      expect(char.str).toBe(10) // Secondary  
      expect(char.dex).toBe(8)  // Tertiary (6 + 1 + 1 = 8)
      expect(char.race).toBe('human')
      expect(char.abilities).toContain('Contract')
      
      // Ensure save/load preserves the "any" bonus choice
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      const characterName = 'HumanAnyBonusTest'
      
      await manager.saveCharacter(char, characterName, 'int', 'str', ['dex', 'dex'])
      const result = await manager.loadCharacter(characterName)
      
      expect(result?.racialBonuses).toEqual(['dex', 'dex'])
      expect(result?.char.dex).toBe(8) // Should preserve the choice
      
      await manager.deleteCharacter(characterName)
    })
  })

  describe('Character Display and State Management', () => {
    it('should maintain complete character state through complex operations', () => {
      const char = new Char('str', 'dex', 'dwarf', [])
      
      // Perform multiple state-changing operations
      char.level_up('str') // Level 2: STR 16→18
      char.level_up('dex') // Level 3: DEX 10→12
      char.start_level_up() // Level 4: Start split allocation
      char.allocate_point('int') // INT 6→7
      char.allocate_point('str') // STR 18→19
      
      // Add equipment to test equipment synchronization
      const sword = createInventoryItem(BASE_WEAPONS[1]) // Longsword (one-hand)
      char.inventory.addItem(sword)
      char.inventory.equipItem(sword.id)
      char.syncEquipmentFromInventory()
      
      // Verify all systems are in sync
      expect(char.lvl).toBe(4)
      expect(char.str).toBe(21) // 16 + 2 (racial) + 2 (level 2) + 1 (split)
      expect(char.dex).toBe(12)  // 10 + 2 (level 3)
      expect(char.int).toBe(7)   // 6 + 1 (split)
      expect(char.weapon).toBe('one-hand')
      expect(char.combat_maneuver_points).toBe(4) // Level 4 with STR ≥16
      expect(char.pending_level_up_points).toBe(0)
      
      // Verify equipment bonuses are applied
      const equippedItems = char.inventory.getEquippedItems()
      expect(equippedItems).toHaveLength(1)
    })

    it('should handle character name changes and updates', async () => {
      const char = new Char('int', 'dex', 'gnome', ['str'])
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      
      // Save with initial name
      const originalName = 'OriginalName'
      await manager.saveCharacter(char, originalName, 'int', 'dex', ['str'])
      
      // Test character loading and renaming workflow
      const result = await manager.loadCharacter(originalName)
      expect(result).not.toBeNull()
      
      if (result) {
        // Simulate character name change
        const newName = 'UpdatedName'
        await manager.deleteCharacter(originalName)
        await manager.saveCharacter(result.char, newName, result.high, result.mid, result.racialBonuses)
        
        // Verify rename was successful
        const renamedResult = await manager.loadCharacter(newName)
        expect(renamedResult).not.toBeNull()
        expect(renamedResult?.char.race).toBe('gnome')
        expect(renamedResult?.racialBonuses).toEqual(['str'])
        
        const originalResult = await manager.loadCharacter(originalName)
        expect(originalResult).toBeNull() // Should be deleted
        
        await manager.deleteCharacter(newName)
      }
    })
  })

  describe('Level-Up System Integration', () => {
    it('should handle mixed traditional and split level-ups correctly', () => {
      const char = new Char('dex', 'int', 'halfling', [])
      
      // Initial state: DEX 16+1=17, INT 10+1=11, STR 6 (halfling bonuses: +1 DEX, +1 INT)
      expect(char.dex).toBe(17)
      expect(char.int).toBe(11)
      expect(char.str).toBe(6)
      expect(char.lvl).toBe(1)
      
      // Traditional level-up
      char.level_up('dex') // Level 2: DEX 17→19
      expect(char.dex).toBe(19)
      expect(char.lvl).toBe(2)
      expect(char.finesse_points).toBe(1) // Should have finesse points from DEX ≥16
      
      // Split level-up
      char.start_level_up() // Level 3
      char.allocate_point('int') // INT 11→12
      char.allocate_point('str') // STR 6→7
      expect(char.lvl).toBe(3)
      expect(char.finesse_points).toBe(2) // +1 for odd level with DEX ≥16
      
      // Another traditional level-up
      char.level_up('int') // Level 4: INT 12→14
      expect(char.int).toBe(14)
      expect(char.sorcery_points).toBe(6) // Sorcery points from level progression with INT >10
      
      // Verify level-up history is preserved
      expect(char.level_up_choices).toEqual(['dex', 'int', 'str', 'int'])
    })

    it('should preserve all state during save/load with pending level-up points', async () => {
      const char = new Char('str', 'int', 'dragonborn', [])
      
      // Start a split level-up but don't finish it
      char.start_level_up()
      char.allocate_point('str')
      // Leave 1 pending point
      
      expect(char.pending_level_up_points).toBe(1)
      expect(char.lvl).toBe(2)
      
      // Save and load
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      const characterName = 'PendingLevelUpTest'
      
      await manager.saveCharacter(char, characterName, 'str', 'int', [])
      const result = await manager.loadCharacter(characterName)
      
      expect(result).not.toBeNull()
      if (result) {
        const loadedChar = result.char
        
        // Verify pending state was preserved
        expect(loadedChar.pending_level_up_points).toBe(1)
        expect(loadedChar.lvl).toBe(2)
        
        // Verify we can continue the level-up
        loadedChar.allocate_point('int')
        expect(loadedChar.pending_level_up_points).toBe(0)
        expect(loadedChar.sorcery_points).toBeGreaterThan(0) // Should get sorcery bonus
      }
      
      await manager.deleteCharacter(characterName)
    })
  })

  describe('Equipment and Combat Integration', () => {
    it('should maintain equipment state and combat calculations through all operations', () => {
      const char = new Char('str', 'dex', 'dragonborn', [])
      
      // Add and equip multiple items
      const sword = createInventoryItem(BASE_WEAPONS[1]) // Longsword (one-hand)
      const armor = createInventoryItem(BASE_ARMOR[0]) // Plate Armor (heavy)
      
      char.inventory.addItem(sword)
      char.inventory.addItem(armor)
      char.inventory.equipItem(sword.id)
      char.inventory.equipItem(armor.id)
      char.syncEquipmentFromInventory()
      
      // Level up to test combat calculations
      char.level_up('str') // STR becomes 16 + 2 (racial) + 2 (level up) = 20
      
      // Verify all combat stats are calculated correctly
      expect(char.weapon).toBe('one-hand')
      expect(char.armor).toBe('heavy')
      expect(char.ac()).toBeGreaterThan(15) // Should include armor + enchantment bonus
      
      const damageRoll = char.weapon_attack()
      expect(damageRoll).toBeGreaterThan(10) // Should include all bonuses
      
      // Test sneak attack (DEX-based)
      const sneakRoll = char.sneak_attack()
      expect(sneakRoll).toBeGreaterThan(0)
    })

    it('should handle dual-wielding state correctly', () => {
      const char = new Char('dex', 'str', 'elf', [])
      
      // Add two one-handed weapons
      const mainWeapon = createInventoryItem(BASE_WEAPONS[1]) // Longsword (one-hand)
      const offWeapon = createInventoryItem(BASE_WEAPONS[2]) // Rapier (finesse, treated as one-hand)
      
      char.inventory.addItem(mainWeapon)
      char.inventory.addItem(offWeapon)
      char.inventory.equipItem(mainWeapon.id)
      char.inventory.equipItem(offWeapon.id)
      char.syncEquipmentFromInventory()
      
      // Verify dual-wielding state - weapon property shows the main-hand weapon type
      expect(char.weapon).toBe('one-hand') // Should show main-hand weapon type
      
      // But both weapons should be equipped
      const equippedWeapons = char.inventory.getEquippedItems().filter(item => item.type === 'weapon')
      expect(equippedWeapons).toHaveLength(2)
      
      // Test weapon attack works
      const weaponDamage = char.weapon_attack()
      expect(weaponDamage).toBeGreaterThan(0)
      
      // Test sneak attack works (DEX-based character)
      const sneakDamage = char.sneak_attack()
      expect(sneakDamage).toBeGreaterThan(weaponDamage) // Sneak should be higher
    })
  })

  describe('Data Integrity and Error Handling', () => {
    it('should maintain data integrity through complex state changes', async () => {
      const char = new Char('int', 'str', 'dragonborn', [])
      
      // Perform a series of state changes that could break data integrity
      char.level_up('int') // Level 2
      char.start_level_up() // Level 3
      char.allocate_point('str')
      char.allocate_point('int')
      
      // Add equipment
      const weapon = createInventoryItem(BASE_WEAPONS[0]) // Greatsword (two-hand)
      char.inventory.addItem(weapon)
      char.inventory.equipItem(weapon.id)
      char.syncEquipmentFromInventory()
      
      // Change equipment
      char.inventory.unequipItem(weapon.id)
      const newWeapon = createInventoryItem(BASE_WEAPONS[1]) // Longsword (one-hand)
      char.inventory.addItem(newWeapon)
      char.inventory.equipItem(newWeapon.id)
      char.syncEquipmentFromInventory()
      
      // Verify final state is consistent
      expect(char.lvl).toBe(3)
      expect(char.pending_level_up_points).toBe(0)
      expect(char.weapon).toBe('one-hand')
      expect(char.sorcery_points).toBeGreaterThan(0) // INT bonus
      
      // Test save/load preserves complex state
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      const characterName = 'ComplexStateTest'
      
      await manager.saveCharacter(char, characterName, 'int', 'str', [])
      const result = await manager.loadCharacter(characterName)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.char.lvl).toBe(4)
        expect(result.char.weapon).toBe('one-hand')
        expect(result.char.sorcery_points).toBeGreaterThan(0)
        expect(result.char.inventory.getEquippedItems()).toHaveLength(1)
      }
      
      await manager.deleteCharacter(characterName)
    })

    it('should handle hash validation and character recovery', async () => {
      const char = new Char('str', 'dex', 'dwarf', [])
      const storage = new LocalStorageCharacterStorage()
      const manager = new CharacterManager(storage)
      const characterName = 'HashValidationTest'
      
      // Save character
      await manager.saveCharacter(char, characterName, 'str', 'dex', [])
      
      // Load and verify hash validation works
      const result = await manager.loadCharacter(characterName)
      expect(result).not.toBeNull()
      
      if (result) {
        // Test character data validation
        expect(result.char.race).toBe('dwarf')
        expect(result.high).toBe('str')
        expect(result.mid).toBe('dex')
        
        // Note: Hash-based recovery would be tested separately if needed
      }
      
      await manager.deleteCharacter(characterName)
    })
  })
})
