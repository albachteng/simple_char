import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../useChar'
import { DiceSettings } from '../utils/dice'

describe('Dice Integration with Character System', () => {
  beforeEach(() => {
    // Reset dice settings before each test
    DiceSettings.setUseDiceRolls(false)
  })

  describe('HP Rolling', () => {
    it('should use consistent HP values when dice rolling is disabled', () => {
      DiceSettings.setUseDiceRolls(false)
      
      const char1 = new Char('str', 'dex')
      const char2 = new Char('str', 'dex')
      
      // Both characters should have the same HP due to using averages
      expect(char1.hp).toBe(char2.hp)
      
      // Level up both characters
      char1.level_up('str')
      char2.level_up('str')
      
      // HP should still be consistent
      expect(char1.hp).toBe(char2.hp)
    })

    it('should use variable HP values when dice rolling is enabled', () => {
      DiceSettings.setUseDiceRolls(true)
      
      const hpValues = []
      
      // Create multiple characters and track their HP after leveling
      for (let i = 0; i < 20; i++) {
        const char = new Char('str', 'dex')
        char.level_up('str')
        char.level_up('str')
        hpValues.push(char.hp)
      }
      
      // Should have variation in HP values
      const uniqueValues = [...new Set(hpValues)]
      expect(uniqueValues.length).toBeGreaterThan(3) // Should have multiple different HP values
      
      // All HP values should be within reasonable range
      hpValues.forEach(hp => {
        expect(hp).toBeGreaterThan(15) // Should be above minimum possible
        expect(hp).toBeLessThan(100) // Should be below absurd maximum
      })
    })
  })

  describe('Combat Damage', () => {
    it('should use consistent damage when dice rolling is disabled', () => {
      DiceSettings.setUseDiceRolls(false)
      
      const char = new Char('str', 'dex')
      char.equip_weapon('one-hand')
      
      const damage1 = char.weapon_attack()
      const damage2 = char.weapon_attack()
      
      // Damage should be consistent with averages
      expect(damage1).toBe(damage2)
    })

    it('should use variable damage when dice rolling is enabled', () => {
      DiceSettings.setUseDiceRolls(true)
      
      const char = new Char('str', 'dex')
      
      // Force weapon assignment since equip_weapon might have conditions
      char.weapon = 'one-hand'
      
      // Verify weapon was set
      expect(char.weapon).toBe('one-hand')
      
      const damageValues = []
      for (let i = 0; i < 30; i++) {
        damageValues.push(char.weapon_attack())
      }
      
      // Log first few values to see what's happening
      const firstFive = damageValues.slice(0, 5)
      expect(firstFive.every(val => val === firstFive[0])).toBe(false) // Should not all be the same
      
      // Should have variation in damage values
      const uniqueValues = [...new Set(damageValues)]
      expect(uniqueValues.length).toBeGreaterThan(1) // Should have multiple different damage values
      
      // All damage values should be within reasonable range
      damageValues.forEach(damage => {
        expect(damage).toBeGreaterThan(0) // Should always deal some damage
        expect(damage).toBeLessThan(50) // Should be below absurd maximum
      })
    })
  })

  describe('Sneak Attack', () => {
    it('should use consistent sneak attack damage when dice rolling is disabled', () => {
      DiceSettings.setUseDiceRolls(false)
      
      const char = new Char('dex', 'str')
      char.equip_weapon('light')
      
      // Need finesse points for sneak attack
      if (char.finesse_points > 0) {
        const damage1 = char.sneak_attack()
        const damage2 = char.sneak_attack()
        
        // Sneak attack damage should be consistent
        expect(damage1).toBe(damage2)
      }
    })

    it('should use variable sneak attack damage when dice rolling is enabled', () => {
      DiceSettings.setUseDiceRolls(true)
      
      const char = new Char('dex', 'str')
      char.equip_weapon('light')
      
      // Level up to get more finesse points for better testing
      char.level_up('dex')
      char.level_up('dex')
      
      if (char.finesse_points > 0) {
        const damageValues = []
        for (let i = 0; i < 20; i++) {
          damageValues.push(char.sneak_attack())
        }
        
        // Should have variation in sneak attack damage
        const uniqueValues = [...new Set(damageValues)]
        expect(uniqueValues.length).toBeGreaterThan(2) // Should have multiple different values
      }
    })
  })

  describe('Hide Rolls', () => {
    it('should use consistent hide values when dice rolling is disabled', () => {
      DiceSettings.setUseDiceRolls(false)
      
      const char = new Char('dex', 'str')
      
      const hide1 = char.hide()
      const hide2 = char.hide()
      
      // Hide rolls should be consistent with averages
      expect(hide1).toBe(hide2)
    })

    it('should use variable hide values when dice rolling is enabled', () => {
      DiceSettings.setUseDiceRolls(true)
      
      const char = new Char('dex', 'str')
      
      const hideValues = []
      for (let i = 0; i < 30; i++) {
        hideValues.push(char.hide())
      }
      
      // Should have variation in hide roll values
      const uniqueValues = [...new Set(hideValues)]
      expect(uniqueValues.length).toBeGreaterThan(5) // Should have many different values (d20 + modifiers)
      
      // All hide values should be within d20 range + modifiers
      hideValues.forEach(hideRoll => {
        expect(hideRoll).toBeGreaterThanOrEqual(1) // Minimum possible roll
        expect(hideRoll).toBeLessThanOrEqual(50) // Maximum reasonable roll
      })
    })
  })
})