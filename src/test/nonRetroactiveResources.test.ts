import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'

describe('Non-Retroactive Resource System', () => {
  describe('Threshold Tracking', () => {
    it('should track when sorcery threshold is first reached', () => {
      // Start with DEX high, INT low
      const char = new Char('dex', 'str', null)
      expect(char.int).toBe(6)
      expect(char.getSorceryThresholdLevel()).toBe(null)
      expect(char.max_sorcery_points).toBe(0)
      
      // Level up INT to 8 (still below threshold)
      char.level_up('int')
      expect(char.int).toBe(8)
      expect(char.getSorceryThresholdLevel()).toBe(null)
      expect(char.max_sorcery_points).toBe(0)
      
      // Level up INT to 10 (still below threshold)
      char.level_up('int')
      expect(char.int).toBe(10)
      expect(char.getSorceryThresholdLevel()).toBe(null)
      expect(char.max_sorcery_points).toBe(0)
      
      // Level up INT to 12 (crosses threshold at level 4)
      char.level_up('int')
      expect(char.int).toBe(12)
      expect(char.lvl).toBe(4)
      expect(char.getSorceryThresholdLevel()).toBe(4)
      expect(char.max_sorcery_points).toBe(3) // Base 3, no bonus levels yet
      
      // Level up again - should get bonus
      char.level_up('int')
      expect(char.int).toBe(14)
      expect(char.lvl).toBe(5)
      expect(char.getSorceryThresholdLevel()).toBe(4) // Threshold level doesn't change
      expect(char.max_sorcery_points).toBe(4) // Base 3 + 1 level after threshold
    })

    it('should track when double sorcery threshold is first reached', () => {
      // Start with INT high
      const char = new Char('int', 'str', null)
      expect(char.int).toBe(16)
      expect(char.getSorceryThresholdLevel()).toBe(1)
      expect(char.getDoubleSorceryThresholdLevel()).toBe(1) // INT 16 > 14 at level 1
      expect(char.max_sorcery_points).toBe(3) // Base 3, no bonus levels yet
      
      // Level up - should get both bonuses
      char.level_up('int')
      expect(char.int).toBe(18)
      expect(char.lvl).toBe(2)
      expect(char.getSorceryThresholdLevel()).toBe(1)
      expect(char.getDoubleSorceryThresholdLevel()).toBe(1)
      expect(char.max_sorcery_points).toBe(5) // Base 3 + 1 (level after threshold) + 1 (level after double threshold)
    })

    it('should track when finesse threshold is first reached', () => {
      // Start with STR high, DEX low
      const char = new Char('str', 'int', null)
      expect(char.dex).toBe(6)
      expect(char.getFinesseThresholdLevel()).toBe(null)
      expect(char.max_finesse_points).toBe(0)
      
      // Level up DEX multiple times to reach threshold
      char.level_up('dex') // Level 2, DEX 8
      char.level_up('dex') // Level 3, DEX 10
      char.level_up('dex') // Level 4, DEX 12
      char.level_up('dex') // Level 5, DEX 14
      char.level_up('dex') // Level 6, DEX 16 - crosses threshold!
      
      expect(char.dex).toBe(16)
      expect(char.lvl).toBe(6)
      expect(char.getFinesseThresholdLevel()).toBe(6)
      expect(char.max_finesse_points).toBe(1) // Base 1, no bonus levels yet
      
      // Level up again - should not get bonus (level 7 is odd but needs to be after threshold)
      char.level_up('dex')
      expect(char.lvl).toBe(7)
      expect(char.max_finesse_points).toBe(2) // Base 1 + 1 (odd level after threshold)
    })
  })

  describe('Non-Retroactive Resource Calculation', () => {
    it('should only grant sorcery points for levels after threshold was reached', () => {
      // Character reaches INT 11 at level 5
      const char = new Char('str', 'dex', null)
      char.level_up('int') // Level 2, INT 8
      char.level_up('int') // Level 3, INT 10
      char.level_up('int') // Level 4, INT 12 - crosses threshold!
      
      expect(char.getSorceryThresholdLevel()).toBe(4)
      expect(char.max_sorcery_points).toBe(3) // Base 3, no bonus levels yet
      
      // Level up to 5 - should get 1 bonus point
      char.level_up('int')
      expect(char.max_sorcery_points).toBe(4) // Base 3 + 1 (level 5 after threshold at 4)
      
      // Level up to 6 - should get another bonus point
      char.level_up('int')
      expect(char.max_sorcery_points).toBe(5) // Base 3 + 2 (levels 5,6 after threshold at 4)
    })

    it('should only grant finesse points for odd levels after threshold was reached', () => {
      // Character reaches DEX 16 at level 6
      const char = new Char('str', 'int', null)
      char.level_up('dex') // Level 2, DEX 8
      char.level_up('dex') // Level 3, DEX 10
      char.level_up('dex') // Level 4, DEX 12
      char.level_up('dex') // Level 5, DEX 14
      char.level_up('dex') // Level 6, DEX 16 - crosses threshold!
      
      expect(char.getFinesseThresholdLevel()).toBe(6)
      expect(char.max_finesse_points).toBe(1) // Base 1, no bonus levels yet
      
      // Level up to 7 (odd level after threshold) - should get bonus
      char.level_up('dex')
      expect(char.max_finesse_points).toBe(2) // Base 1 + 1 (odd level 7 after threshold at 6)
      
      // Level up to 8 (even level) - should not get bonus
      char.level_up('dex')
      expect(char.max_finesse_points).toBe(2) // Same as before
      
      // Level up to 9 (odd level) - should get bonus
      char.level_up('dex')
      expect(char.max_finesse_points).toBe(3) // Base 1 + 2 (odd levels 7,9 after threshold at 6)
    })

    it('should handle double sorcery threshold reached later than initial threshold', () => {
      // Character reaches INT 11 at level 4, then INT 15 at level 6
      const char = new Char('str', 'dex', null)
      char.level_up('int') // Level 2, INT 8
      char.level_up('int') // Level 3, INT 10
      char.level_up('int') // Level 4, INT 12 - crosses first threshold!
      
      expect(char.getSorceryThresholdLevel()).toBe(4)
      expect(char.getDoubleSorceryThresholdLevel()).toBe(null)
      expect(char.max_sorcery_points).toBe(3) // Base 3, no bonus levels yet
      
      // Level up to 5 - should get regular bonus
      char.level_up('int') // Level 5, INT 14
      expect(char.max_sorcery_points).toBe(4) // Base 3 + 1 (level 5 after threshold at 4)
      
      // Level up to 6 - should get regular bonus AND cross double threshold
      char.level_up('int') // Level 6, INT 16 - crosses double threshold!
      expect(char.getDoubleSorceryThresholdLevel()).toBe(6)
      expect(char.max_sorcery_points).toBe(5) // Base 3 + 2 (levels 5,6 after threshold at 4) + 0 (no levels after double threshold yet)
      
      // Level up to 7 - should get both bonuses
      char.level_up('int') // Level 7, INT 18
      expect(char.max_sorcery_points).toBe(7) // Base 3 + 3 (levels 5,6,7 after threshold at 4) + 1 (level 7 after double threshold at 6)
    })
  })

  describe('Combat Maneuvers (Immediate/Retroactive)', () => {
    it('should grant combat maneuvers immediately when threshold is reached', () => {
      // Character reaches STR 16 at level 5
      const char = new Char('int', 'dex', null)
      char.level_up('str') // Level 2, STR 8
      char.level_up('str') // Level 3, STR 10
      char.level_up('str') // Level 4, STR 12
      char.level_up('str') // Level 5, STR 14
      char.level_up('str') // Level 6, STR 16 - crosses threshold!
      
      expect(char.lvl).toBe(6)
      expect(char.str).toBe(16)
      expect(char.max_combat_maneuver_points).toBe(6) // Immediate grant = current level
      
      // Level up again - should get full level value
      char.level_up('str')
      expect(char.lvl).toBe(7)
      expect(char.max_combat_maneuver_points).toBe(7) // Always equals current level when STR >= 16
    })
  })

  describe('Edge Cases', () => {
    it('should handle character starting with high INT', () => {
      // Character starts with INT 16, both thresholds met at level 1
      const char = new Char('int', 'str', null)
      expect(char.int).toBe(16)
      expect(char.getSorceryThresholdLevel()).toBe(1)
      expect(char.getDoubleSorceryThresholdLevel()).toBe(1)
      expect(char.max_sorcery_points).toBe(3) // Base 3, no bonus levels yet
      
      // Level up - should get both bonuses
      char.level_up('int')
      expect(char.max_sorcery_points).toBe(5) // Base 3 + 1 (level 2 after threshold at 1) + 1 (level 2 after double threshold at 1)
    })

    it('should handle character starting with high DEX', () => {
      // Character starts with DEX 16, threshold met at level 1
      const char = new Char('dex', 'str', null)
      expect(char.dex).toBe(16)
      expect(char.getFinesseThresholdLevel()).toBe(1)
      expect(char.max_finesse_points).toBe(1) // Base 1, no bonus levels yet
      
      // Level up to 2 (even level) - should not get bonus
      char.level_up('dex')
      expect(char.max_finesse_points).toBe(1) // Same as before
      
      // Level up to 3 (odd level) - should get bonus
      char.level_up('dex')
      expect(char.max_finesse_points).toBe(2) // Base 1 + 1 (odd level 3 after threshold at 1)
    })
  })
})