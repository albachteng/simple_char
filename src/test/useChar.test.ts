import { describe, it, expect } from 'vitest'
import { mod, Char } from '../useChar'

describe('mod function', () => {
  it('should calculate modifier correctly for various stats', () => {
    expect(mod(10)).toBe(0)
    expect(mod(11)).toBe(0)
    expect(mod(12)).toBe(1)
    expect(mod(16)).toBe(3)
    expect(mod(6)).toBe(-2)
    expect(mod(8)).toBe(-1)
  })
})

describe('Char class', () => {
  it('should create a character with correct initial stats', () => {
    const char = new Char('str', 'dex')
    
    expect(char.str).toBe(16)
    expect(char.dex).toBe(10)
    expect(char.int).toBe(6)
    expect(char.lvl).toBe(1)
    expect(char.hp).toBeGreaterThan(10)
  })

  it('should calculate AC correctly', () => {
    const char = new Char('dex', 'str')
    
    expect(char.ac()).toBe(16) // BASE_AC (13) + DEX mod (3) + no armor/shield
  })

  it('should level up correctly', () => {
    const char = new Char('str', 'dex')
    const initialStr = char.str
    const initialLvl = char.lvl
    
    char.level_up('str')
    
    expect(char.str).toBe(initialStr + 2)
    expect(char.lvl).toBe(initialLvl + 1)
  })

  it('should calculate maneuvers correctly', () => {
    const char = new Char('str', 'dex')
    
    expect(char.maneuvers('str')).toBe(1) // str >= 16, so returns lvl = 1
    expect(char.maneuvers('dex')).toBe(0) // dex < 16, so no finesse points
    expect(char.maneuvers('int')).toBe(0) // int <= 10, so no sorcery points
  })
})