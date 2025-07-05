import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { RACIAL_BONUS } from '../constants'

describe('Racial Bonus System', () => {
  describe('Character creation with racial bonuses', () => {
    it('should apply elf racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      
      expect(char.race).toBe('elf')
      expect(char.abilities).toContain('Dark Vision: See in darkness up to 60 feet')
      expect(char.dex).toBe(12) // 10 (medium) + 2 (racial)
      expect(char.int).toBe(7) // 6 (low) + 1 (any bonus)
    })

    it('should apply dwarf racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'dwarf', [])
      
      expect(char.race).toBe('dwarf')
      expect(char.abilities).toContain('Darkvision: See in darkness up to 60 feet')
      expect(char.str).toBe(18) // 16 (high) + 2 (racial)
      expect(char.hp).toBeGreaterThan(10) // Should have bonus HP
    })

    it('should apply human racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'human', ['str', 'int'])
      
      expect(char.race).toBe('human')
      expect(char.abilities).toContain('Versatile: Extra skill proficiency')
      expect(char.str).toBe(17) // 16 (high) + 1 (any bonus)
      expect(char.int).toBe(7) // 6 (low) + 1 (any bonus)
    })

    it('should apply gnome racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'gnome', ['dex'])
      
      expect(char.race).toBe('gnome')
      expect(char.abilities).toContain('Tinker: Proficiency with tinker tools')
      expect(char.int).toBe(8) // 6 (low) + 2 (racial)
      expect(char.dex).toBe(11) // 10 (medium) + 1 (any bonus)
    })

    it('should apply dragonborn racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'dragonborn', [])
      
      expect(char.race).toBe('dragonborn')
      expect(char.abilities).toContain('Breath Weapon: 15-foot cone, 2d6 damage')
      expect(char.str).toBe(18) // 16 (high) + 2 (racial)
    })

    it('should apply halfling racial bonuses correctly', () => {
      const char = new Char('str', 'dex', 'halfling', [])
      
      expect(char.race).toBe('halfling')
      expect(char.abilities).toContain('Lucky: Reroll 1s on d20 rolls')
      expect(char.dex).toBe(12) // 10 (medium) + 2 (racial)
    })
  })

  describe('Multiple "any" bonuses', () => {
    it('should handle multiple "any" bonuses correctly', () => {
      const char = new Char('str', 'dex', 'human', ['str', 'int'])
      
      expect(char.str).toBe(17) // 16 (high) + 1 (any bonus)
      expect(char.int).toBe(7) // 6 (low) + 1 (any bonus)
      expect(char.dex).toBe(10) // 10 (medium) - no bonus
    })
  })

  describe('No racial bonuses', () => {
    it('should work without race selection', () => {
      const char = new Char('str', 'dex', null, [])
      
      expect(char.race).toBeNull()
      expect(char.abilities).toHaveLength(0)
      expect(char.str).toBe(16) // Just base stats
      expect(char.dex).toBe(10)
      expect(char.int).toBe(6)
    })
  })

  describe('Racial bonus data validation', () => {
    it('should have valid racial bonus data for all races', () => {
      const races = ['elf', 'dwarf', 'human', 'gnome', 'dragonborn', 'halfling']
      
      races.forEach(race => {
        const raceData = RACIAL_BONUS[race as keyof typeof RACIAL_BONUS]
        expect(raceData).toBeDefined()
        expect(raceData.ability).toBeTruthy()
        expect(raceData.bonus).toBeInstanceOf(Array)
        expect(raceData.bonus.length).toBeGreaterThan(0)
        
        raceData.bonus.forEach(bonus => {
          expect(bonus.stat).toBeTruthy()
          expect(bonus.plus).toBeGreaterThan(0)
        })
      })
    })
  })
})