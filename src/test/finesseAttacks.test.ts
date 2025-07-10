import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../useChar'
import { DiceSettings } from '../utils/dice'
import { createInventoryItem } from '../inventory/InventoryConstants'

describe('Finesse Attack Mechanics', () => {
  let char: Char
  let dagger: any

  beforeEach(() => {
    // Set dice to use average values for consistent testing
    DiceSettings.setUseDiceRolls(false)
    
    // Create a character with high DEX (16) to enable finesse attacks
    char = new Char('dex', 'str') // DEX 16, STR 10, INT 6
    
    // Create and equip weapons to enable combat
    dagger = createInventoryItem({
      name: 'Dagger',
      type: 'weapon',
      weaponType: 'finesse',
      enchantmentLevel: 0,
      description: 'A finesse weapon for testing'
    })
    
    char.inventory.addItem(dagger)
    char.inventory.equipItem(dagger.id)
  })

  describe('Finesse Attack Requirements', () => {
    it('should require DEX >= 16 to perform finesse attacks', () => {
      // Character with DEX 16 should be able to perform finesse attacks
      expect(char.canPerformFinesseAttacks()).toBe(true)
      
      // Create character with low DEX
      const lowDexChar = new Char('str', 'int') // STR 16, INT 10, DEX 6
      expect(lowDexChar.canPerformFinesseAttacks()).toBe(false)
    })

    it('should require finesse points to perform finesse attacks', () => {
      // Character starts with finesse points due to DEX 16
      expect(char.finesse_points).toBeGreaterThan(0)
      expect(char.canPerformFinesseAttacks()).toBe(true)
      
      // Remove all finesse points
      char.finesse_points = 0
      expect(char.canPerformFinesseAttacks()).toBe(false)
    })
  })

  describe('Sneak Attack', () => {
    it('should perform sneak attack with main hand weapon', () => {
      const initialFinessePoints = char.finesse_points
      
      const result = char.sneakAttackMainHand()
      
      expect(result.result).toBeGreaterThan(0)
      expect(result.breakdown).toContain('sneak attack')
      expect(char.finesse_points).toBe(initialFinessePoints - 1) // Should cost 1 finesse point
    })

    it('should perform sneak attack with off hand weapon', () => {
      // Equip off-hand weapon
      const offHandDagger = createInventoryItem({
        name: 'Off-hand Dagger',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 0,
        description: 'A finesse weapon for off-hand testing'
      })
      
      char.inventory.addItem(offHandDagger)
      const equipResult = char.inventory.equipItem(offHandDagger.id)
      expect(equipResult.success).toBe(true)
      
      const initialFinessePoints = char.finesse_points
      
      const result = char.sneakAttackOffHand()
      
      expect(result.result).toBeGreaterThan(0)
      expect(result.breakdown).toContain('sneak attack')
      expect(char.finesse_points).toBe(initialFinessePoints - 1) // Should cost 1 finesse point
    })

    it('should fail sneak attack when no finesse points available', () => {
      char.finesse_points = 0
      
      const result = char.sneakAttackMainHand()
      
      expect(result.result).toBe(0)
      expect(result.breakdown).toBe('No finesse points available')
    })

    it('should fail sneak attack when no weapon equipped', () => {
      char.inventory.unequipItem(dagger.id)
      
      const result = char.sneakAttackMainHand()
      
      expect(result.result).toBe(0)
      expect(result.breakdown).toBe('No main-hand weapon equipped')
    })

    it('should add sneak attack dice based on remaining finesse points', () => {
      // Character should start with some finesse points
      const initialFinessePoints = char.finesse_points
      expect(initialFinessePoints).toBeGreaterThan(0)
      
      const result = char.sneakAttackMainHand()
      
      // Should include sneak attack dice equal to remaining finesse points after spending one
      const expectedSneakDice = initialFinessePoints - 1
      if (expectedSneakDice > 0) {
        expect(result.breakdown).toContain(`${expectedSneakDice}d8 sneak attack`)
      }
    })
  })

  describe('Assassination', () => {
    it('should perform assassination with main hand weapon', () => {
      const initialFinessePoints = char.finesse_points
      
      const result = char.assassinationMainHand()
      
      expect(result.result).toBeGreaterThan(0)
      expect(result.breakdown).toContain('critical')
      expect(result.breakdown).toContain('sneak attack')
      expect(char.finesse_points).toBe(initialFinessePoints) // Should NOT cost finesse points
    })

    it('should perform assassination with off hand weapon', () => {
      // Equip off-hand weapon
      const offHandDagger = createInventoryItem({
        name: 'Off-hand Dagger',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 0,
        description: 'A finesse weapon for off-hand testing'
      })
      
      char.inventory.addItem(offHandDagger)
      const equipResult = char.inventory.equipItem(offHandDagger.id)
      expect(equipResult.success).toBe(true)
      
      const initialFinessePoints = char.finesse_points
      
      const result = char.assassinationOffHand()
      
      expect(result.result).toBeGreaterThan(0)
      expect(result.breakdown).toContain('critical')
      expect(result.breakdown).toContain('sneak attack')
      expect(char.finesse_points).toBe(initialFinessePoints) // Should NOT cost finesse points
    })

    it('should fail assassination when no finesse points available', () => {
      char.finesse_points = 0
      
      const result = char.assassinationMainHand()
      
      expect(result.result).toBe(0)
      expect(result.breakdown).toBe('No finesse points available')
    })

    it('should fail assassination when no weapon equipped', () => {
      char.inventory.unequipItem(dagger.id)
      
      const result = char.assassinationMainHand()
      
      expect(result.result).toBe(0)
      expect(result.breakdown).toBe('No main-hand weapon equipped')
    })

    it('should double weapon dice and sneak attack dice for critical hit', () => {
      const result = char.assassinationMainHand()
      
      // Should show critical hit notation
      expect(result.breakdown).toMatch(/2d\d+ critical/)
      
      // Should double sneak attack dice
      const finessePoints = char.finesse_points
      if (finessePoints > 0) {
        expect(result.breakdown).toContain(`${finessePoints * 2}d8 critical sneak attack`)
      }
    })
  })

  describe('Rest Functionality', () => {
    it('should restore all resources to maximum', () => {
      // Spend some resources
      char.spendFinessePoint()
      char.spendSorceryPoint()
      char.spendCombatManeuverPoint()
      
      const maxSorcery = char.max_sorcery_points
      const maxFinesse = char.max_finesse_points
      const maxCombat = char.max_combat_maneuver_points
      
      // Rest should restore all resources
      char.rest()
      
      expect(char.sorcery_points).toBe(maxSorcery)
      expect(char.finesse_points).toBe(maxFinesse)
      expect(char.combat_maneuver_points).toBe(maxCombat)
    })

    it('should not change HP since there is no damage system', () => {
      const initialHp = char.hp
      
      char.rest()
      
      expect(char.hp).toBe(initialHp) // HP should remain unchanged
    })
  })

  describe('Damage Calculations', () => {
    it('should calculate sneak attack damage correctly', () => {
      // Level up the character to get more finesse points
      char.level_up('dex') // Level 2, should give more finesse points
      
      // With dice averages: finesse weapon (d6) = 3.5, d8 sneak attack = 4.5
      // DEX modifier = 3 (DEX 16), no enchantment
      const result = char.sneakAttackMainHand()
      
      // Base damage: 3.5 (d6) + 4 (DEX after level up) = 7.5, rounded to 7
      // Plus sneak attack dice based on remaining finesse points (should have 1 finesse point remaining)
      expect(result.result).toBeGreaterThan(6)
      expect(result.breakdown).toContain('1d6') // Weapon die
      expect(result.breakdown).toContain('+ 4 (DEX modifier)') // DEX modifier (18 DEX after level up)
      expect(result.breakdown).toContain('sneak attack') // Should have sneak attack dice
    })

    it('should calculate assassination damage correctly', () => {
      const result = char.assassinationMainHand()
      
      // Critical hit: 2d6 weapon dice, plus DEX modifier, plus doubled sneak attack dice
      expect(result.breakdown).toContain('2d6 critical') // Doubled weapon dice
      expect(result.breakdown).toContain('+ 3 (DEX modifier)') // DEX modifier
      expect(result.result).toBeGreaterThan(10) // Should be significantly higher than normal attack
    })

    it('should handle enchanted weapons correctly', () => {
      // Unequip current weapon first
      char.inventory.unequipItem(dagger.id)
      
      // Add enchanted weapon
      const enchantedDagger = createInventoryItem({
        name: 'Magic Dagger +2',
        type: 'weapon',
        weaponType: 'finesse',
        enchantmentLevel: 2,
        description: 'An enchanted finesse weapon'
      })
      
      char.inventory.addItem(enchantedDagger)
      const equipResult = char.inventory.equipItem(enchantedDagger.id)
      expect(equipResult.success).toBe(true)
      
      const result = char.sneakAttackMainHand()
      
      expect(result.breakdown).toContain('+ 2 (enchantment)')
    })
  })
})