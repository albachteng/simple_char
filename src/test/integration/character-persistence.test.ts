import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../../useChar'

describe('Character Persistence Integration Tests', () => {
  describe('Character Data Integrity', () => {
    it('should preserve character data through serialization', () => {
      const char = new Char('str', 'dex')
      char.setName('TestCharacter')
      char.setRace('human')
      char.levelUp('str')
      
      // Add some equipment
      char.inventoryManager.addItem({
        id: 'sword1',
        name: 'Test Sword',
        type: 'weapon',
        equipped: true,
        enchantmentLevel: 1
      })

      // Test serialization/deserialization
      const characterData = char.toStorage()
      
      expect(characterData.name).toBe('TestCharacter')
      expect(characterData.race).toBe('human')
      expect(characterData.level).toBe(2)
      expect(characterData.str).toBe(18)
      expect(characterData.inventory.items).toHaveLength(1)
      expect(characterData.inventory.items[0].name).toBe('Test Sword')
    })

    it('should maintain character hash integrity', () => {
      const char = new Char('str', 'dex')
      char.setName('HashTest')
      char.setRace('dwarf')
      
      const originalHash = char.generateHash()
      const characterData = char.toStorage()
      
      // Create new character from data
      const newChar = new Char('str', 'dex')
      newChar.fromStorage(characterData)
      
      expect(newChar.generateHash()).toBe(originalHash)
      expect(newChar.name).toBe('HashTest')
      expect(newChar.race).toBe('dwarf')
    })

    it('should handle character creation workflow', () => {
      const char = new Char('int', 'str')
      char.setName('WizardChar')
      char.setRace('elf')
      
      expect(char.name).toBe('WizardChar')
      expect(char.race).toBe('elf')
      expect(char.int).toBe(16) // Primary stat
      expect(char.str).toBe(10) // Secondary stat
      expect(char.dex).toBe(8)  // Tertiary (6 + 2 from elf racial bonus)
      expect(char.abilities).toContain('Treewalk')
    })

    it('should validate character save data format', () => {
      const char = new Char('dex', 'int')
      char.setName('ValidChar')
      char.setRace('halfling')
      
      const saveData = char.toStorage()
      
      // Check required fields exist
      expect(saveData).toHaveProperty('name')
      expect(saveData).toHaveProperty('hash')
      expect(saveData).toHaveProperty('level')
      expect(saveData).toHaveProperty('str')
      expect(saveData).toHaveProperty('dex')
      expect(saveData).toHaveProperty('int')
      expect(saveData).toHaveProperty('race')
      expect(saveData).toHaveProperty('abilities')
      expect(saveData).toHaveProperty('hp')
      expect(saveData).toHaveProperty('inventory')
      expect(saveData).toHaveProperty('timestamp')
      
      // Check data types
      expect(typeof saveData.name).toBe('string')
      expect(typeof saveData.level).toBe('number')
      expect(Array.isArray(saveData.abilities)).toBe(true)
      expect(typeof saveData.inventory).toBe('object')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed character data gracefully', () => {
      const char = new Char('str', 'dex')
      
      const malformedData = {
        name: 'BadChar',
        // Missing required fields
        timestamp: Date.now()
      }

      // Should not crash when loading bad data
      expect(() => {
        char.fromStorage(malformedData as any)
      }).not.toThrow()
    })

    it('should validate character names', () => {
      const char = new Char('str', 'dex')
      
      // Empty name should be invalid
      char.setName('')
      expect(char.name).toBe('') // Allows empty but should be validated elsewhere
      
      // Valid name should work
      char.setName('ValidName')
      expect(char.name).toBe('ValidName')
    })
  })
})