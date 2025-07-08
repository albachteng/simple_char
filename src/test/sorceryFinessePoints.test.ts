import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'

describe('Sorcery and Finesse Points Calculation', () => {
  describe('Sorcery Points', () => {
    it('should give 0 sorcery points for INT < 11', () => {
      const char = new Char('str', 'dex', null)
      expect(char.int).toBe(6)
      expect(char.max_sorcery_points).toBe(0)
      expect(char.sorcery_points).toBe(0)
    })

    it('should give 3 sorcery points at level 1 for INT >= 11', () => {
      const char = new Char('int', 'str', null)
      expect(char.int).toBe(16)
      expect(char.lvl).toBe(1)
      expect(char.max_sorcery_points).toBe(3)
      expect(char.sorcery_points).toBe(3)
    })


    it('should give 5 sorcery points at level 2 for INT >= 11 (INT 18 > 14)', () => {
      const char = new Char('int', 'str', null)
      char.level_up('int')
      expect(char.int).toBe(18)
      expect(char.lvl).toBe(2)
      // Base 3 + 1 per level (1 extra) + 1 per level for INT > 14 (1 extra) = 5
      expect(char.max_sorcery_points).toBe(5)
      expect(char.sorcery_points).toBe(5)
    })


    it('should give correct sorcery points at level 3 for INT > 14', () => {
      const char = new Char('int', 'str', null)
      char.level_up('int') // Level 2, INT 18
      char.level_up('int') // Level 3, INT 20
      expect(char.int).toBe(20)
      expect(char.lvl).toBe(3)
      // Base 3 + 2 per level (2 extra) + 2 per level for INT > 14 (2 extra) = 7
      // But finalize_level_up adds +1 for >= 11 and +1 for > 14 per level = 3 + 2 + 2 = 7
      expect(char.max_sorcery_points).toBe(7)
      expect(char.sorcery_points).toBe(7)
    })
  })

  describe('Finesse Points', () => {
    it('should give 0 finesse points for DEX < 16', () => {
      const char = new Char('str', 'int', null)
      expect(char.dex).toBe(6)
      expect(char.max_finesse_points).toBe(0)
      expect(char.finesse_points).toBe(0)
    })

    it('should give 1 finesse point at level 1 for DEX >= 16', () => {
      const char = new Char('dex', 'str', null)
      expect(char.dex).toBe(16)
      expect(char.lvl).toBe(1)
      expect(char.max_finesse_points).toBe(1)
      expect(char.finesse_points).toBe(1)
    })

    it('should give 1 finesse point at level 2 for DEX >= 16 (even level)', () => {
      const char = new Char('dex', 'str', null)
      char.level_up('dex')
      expect(char.dex).toBe(18)
      expect(char.lvl).toBe(2)
      expect(char.max_finesse_points).toBe(1)
      expect(char.finesse_points).toBe(1)
    })

    it('should give 2 finesse points at level 3 for DEX >= 16 (odd level)', () => {
      const char = new Char('dex', 'str', null)
      char.level_up('dex') // Level 2, DEX 18
      char.level_up('dex') // Level 3, DEX 20
      expect(char.dex).toBe(20)
      expect(char.lvl).toBe(3)
      expect(char.max_finesse_points).toBe(2)
      expect(char.finesse_points).toBe(2)
    })

    it('should give 2 finesse points at level 4 for DEX >= 16 (even level)', () => {
      const char = new Char('dex', 'str', null)
      char.level_up('dex') // Level 2, DEX 18
      char.level_up('dex') // Level 3, DEX 20
      char.level_up('dex') // Level 4, DEX 22
      expect(char.dex).toBe(22)
      expect(char.lvl).toBe(4)
      expect(char.max_finesse_points).toBe(2)
      expect(char.finesse_points).toBe(2)
    })

    it('should give 3 finesse points at level 5 for DEX >= 16 (odd level)', () => {
      const char = new Char('dex', 'str', null)
      char.level_up('dex') // Level 2, DEX 18
      char.level_up('dex') // Level 3, DEX 20
      char.level_up('dex') // Level 4, DEX 22
      char.level_up('dex') // Level 5, DEX 24
      expect(char.dex).toBe(24)
      expect(char.lvl).toBe(5)
      expect(char.max_finesse_points).toBe(3)
      expect(char.finesse_points).toBe(3)
    })
  })
})