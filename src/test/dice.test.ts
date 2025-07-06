import { describe, it, expect, beforeEach } from 'vitest'
import { 
  rollDie, 
  rollDice, 
  rollWithModifier, 
  getAverageValue, 
  DiceSettings,
  parseDiceNotation,
  rollFromNotation
} from '../utils/dice'

describe('Dice System', () => {
  beforeEach(() => {
    // Reset dice settings before each test
    DiceSettings.setUseDiceRolls(false)
  })

  describe('Basic dice rolling', () => {
    it('should roll die within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const roll = rollDie(6)
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(6)
      }
    })

    it('should roll multiple dice', () => {
      const rolls = rollDice(3, 6)
      expect(rolls).toHaveLength(3)
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(6)
      })
    })

    it('should apply modifiers correctly', () => {
      const result = rollWithModifier(2, 6, 3)
      expect(result.modifier).toBe(3)
      expect(result.total).toBe(result.result + 3)
      expect(result.rolls).toHaveLength(2)
    })
  })

  describe('Average calculations', () => {
    it('should calculate correct averages', () => {
      expect(getAverageValue(1, 6, 0)).toBe(3) // (6+1)/2 = 3.5, floored to 3
      expect(getAverageValue(2, 6, 2)).toBe(9) // 2*3.5 floored = 7, + 2 = 9
      expect(getAverageValue(1, 8, 1)).toBe(5) // (8+1)/2 + 1 = 5.5, floored to 5
    })
  })

  describe('DiceSettings', () => {
    it('should use average values when dice rolling is disabled', () => {
      DiceSettings.setUseDiceRolls(false)
      
      // Test multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        const result = DiceSettings.rollOrAverage(2, 6, 3)
        expect(result).toBe(10) // 2*3.5 floored = 7, + 3 = 10 (consistent average)
      }
    })

    it('should use random values when dice rolling is enabled', () => {
      DiceSettings.setUseDiceRolls(true)
      
      const results = []
      for (let i = 0; i < 50; i++) {
        results.push(DiceSettings.rollOrAverage(2, 6, 0))
      }
      
      // Should have variation in results
      const uniqueResults = [...new Set(results)]
      expect(uniqueResults.length).toBeGreaterThan(3) // Should have multiple different results
      
      // All results should be within valid range
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(2) // minimum: 1+1
        expect(result).toBeLessThanOrEqual(12) // maximum: 6+6
      })
    })
  })

  describe('Dice notation parsing', () => {
    it('should parse simple dice notation', () => {
      expect(parseDiceNotation('1d6')).toEqual({ count: 1, sides: 6, modifier: 0 })
      expect(parseDiceNotation('2d8')).toEqual({ count: 2, sides: 8, modifier: 0 })
      expect(parseDiceNotation('3d10')).toEqual({ count: 3, sides: 10, modifier: 0 })
    })

    it('should parse dice notation with positive modifiers', () => {
      expect(parseDiceNotation('1d6+3')).toEqual({ count: 1, sides: 6, modifier: 3 })
      expect(parseDiceNotation('2d8+5')).toEqual({ count: 2, sides: 8, modifier: 5 })
    })

    it('should parse dice notation with negative modifiers', () => {
      expect(parseDiceNotation('1d6-2')).toEqual({ count: 1, sides: 6, modifier: -2 })
      expect(parseDiceNotation('3d4-1')).toEqual({ count: 3, sides: 4, modifier: -1 })
    })

    it('should throw error for invalid notation', () => {
      expect(() => parseDiceNotation('invalid')).toThrow('Invalid dice notation')
      expect(() => parseDiceNotation('d6')).toThrow('Invalid dice notation')
      expect(() => parseDiceNotation('1d')).toThrow('Invalid dice notation')
    })
  })

  describe('Rolling from notation', () => {
    it('should roll correctly from notation string', () => {
      DiceSettings.setUseDiceRolls(true)
      
      for (let i = 0; i < 20; i++) {
        const result = rollFromNotation('1d6+2')
        expect(result.rolls).toHaveLength(1)
        expect(result.modifier).toBe(2)
        expect(result.total).toBeGreaterThanOrEqual(3) // 1+2
        expect(result.total).toBeLessThanOrEqual(8) // 6+2
      }
    })
  })
})