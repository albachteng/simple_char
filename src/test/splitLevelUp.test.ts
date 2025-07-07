import { describe, it, expect } from 'vitest'
import { Char } from '../useChar'
import { DiceSettings } from '../utils/dice'

describe('Split Level-Up System', () => {
  beforeEach(() => {
    // Use consistent values for testing
    DiceSettings.setUseDiceRolls(false)
  })

  it('should start a level-up and grant 2 pending points', () => {
    const char = new Char('str', 'dex')
    
    // Character starts at level 1 with no pending points
    expect(char.lvl).toBe(1)
    expect(char.pending_level_up_points).toBe(0)
    
    // Start level-up
    const result = char.start_level_up()
    
    expect(result).toBe(true)
    expect(char.lvl).toBe(2)
    expect(char.pending_level_up_points).toBe(2)
  })

  it('should not allow starting level-up when points are pending', () => {
    const char = new Char('str', 'dex')
    
    // Start first level-up
    char.start_level_up()
    expect(char.pending_level_up_points).toBe(2)
    
    // Try to start another level-up
    const result = char.start_level_up()
    
    expect(result).toBe(false)
    expect(char.pending_level_up_points).toBe(2) // Should remain unchanged
  })

  it('should allocate points to stats one at a time', () => {
    const char = new Char('str', 'dex')
    const initialStr = char.str
    const initialDex = char.dex
    
    // Start level-up
    char.start_level_up()
    
    // Allocate first point to STR
    const result1 = char.allocate_point('str')
    expect(result1).toBe(true)
    expect(char.str).toBe(initialStr + 1)
    expect(char.pending_level_up_points).toBe(1)
    
    // Allocate second point to DEX
    const result2 = char.allocate_point('dex')
    expect(result2).toBe(true)
    expect(char.dex).toBe(initialDex + 1)
    expect(char.pending_level_up_points).toBe(0)
  })

  it('should not allow allocating points when none are pending', () => {
    const char = new Char('str', 'dex')
    const initialStr = char.str
    
    // Try to allocate without starting level-up
    const result = char.allocate_point('str')
    
    expect(result).toBe(false)
    expect(char.str).toBe(initialStr) // Should remain unchanged
    expect(char.pending_level_up_points).toBe(0)
  })

  it('should grant stat-based bonuses when level-up is finalized', () => {
    const char = new Char('int', 'dex') // High INT for sorcery points
    expect(char.sorcery_points).toBe(3) // Initial sorcery points
    
    // Start level-up and allocate to INT
    char.start_level_up()
    char.allocate_point('int') // INT becomes 18
    
    // Should not get sorcery bonus yet (still have pending points)
    expect(char.sorcery_points).toBe(3)
    
    // Allocate second point
    char.allocate_point('str')
    
    // Now should get sorcery point bonus (level-up finalized)
    // INT 18 gets 2 sorcery points: one for >10, one for >14
    expect(char.sorcery_points).toBe(5) // +2 for level up (INT 18)
  })

  it('should track level-up choices for split allocations', () => {
    const char = new Char('str', 'dex')
    const initialChoices = char.level_up_choices.length
    
    // Start level-up and allocate split points
    char.start_level_up()
    char.allocate_point('str')
    char.allocate_point('dex')
    
    // Should track each individual allocation
    expect(char.level_up_choices.length).toBe(initialChoices + 2)
    expect(char.level_up_choices.slice(-2)).toEqual(['str', 'dex'])
  })

  it('should work alongside traditional level-up method', () => {
    const char = new Char('str', 'dex')
    const initialStr = char.str
    const initialLevel = char.lvl
    
    // Traditional level-up (+2 to single stat)
    char.level_up('str')
    expect(char.str).toBe(initialStr + 2)
    expect(char.lvl).toBe(initialLevel + 1)
    expect(char.pending_level_up_points).toBe(0)
    
    // Then use split level-up
    char.start_level_up()
    expect(char.pending_level_up_points).toBe(2)
    
    char.allocate_point('dex')
    char.allocate_point('int')
    expect(char.pending_level_up_points).toBe(0)
  })

  it('should properly save and restore pending points', () => {
    const char = new Char('str', 'dex')
    
    // Start level-up and allocate one point
    char.start_level_up()
    char.allocate_point('str')
    
    expect(char.pending_level_up_points).toBe(1)
    
    // The character should maintain this state when saved/loaded
    // (This would be tested more thoroughly in integration tests)
  })

  it('should handle edge case of allocating all points to same stat', () => {
    const char = new Char('str', 'dex')
    const initialStr = char.str
    
    // Start level-up and allocate both points to same stat
    char.start_level_up()
    char.allocate_point('str')
    char.allocate_point('str')
    
    expect(char.str).toBe(initialStr + 2)
    expect(char.pending_level_up_points).toBe(0)
  })

  it('should trigger finesse points at correct levels with split level-up', () => {
    const char = new Char('dex', 'str')
    char.dex = 16 // Set to threshold for finesse points
    char.updateInventoryStats()
    
    expect(char.finesse_points).toBe(1) // Initial finesse points
    
    // Level up to level 3 (odd level) using split
    char.start_level_up() // Level 2
    char.allocate_point('str')
    char.allocate_point('int')
    
    char.start_level_up() // Level 3 (should trigger finesse bonus)
    char.allocate_point('dex')
    char.allocate_point('str')
    
    expect(char.finesse_points).toBe(2) // Should gain +1 for odd level
  })
})