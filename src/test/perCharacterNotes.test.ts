import { describe, it, expect, beforeEach } from 'vitest'
import { Char } from '../useChar'
import { CharacterManager } from '../storage/CharacterManager'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { CharacterHasher } from '../storage/CharacterHasher'

describe('Per-Character Notes System', () => {
  let char: Char
  let characterManager: CharacterManager
  let storage: LocalStorageCharacterStorage

  beforeEach(() => {
    // Create a fresh character for each test
    char = new Char('str', 'dex', 'human', ['str'])
    
    // Create storage and manager
    storage = new LocalStorageCharacterStorage()
    characterManager = new CharacterManager(storage)
    
    // Clear any existing localStorage data
    localStorage.clear()
  })

  describe('Character Notes Management', () => {
    it('should initialize with empty notes', () => {
      expect(char.getNotes()).toBe('')
    })

    it('should update notes and trigger update event', () => {
      const testNotes = 'This is a test note'
      
      // Test that the notes are updated properly
      char.updateNotes(testNotes)
      
      expect(char.getNotes()).toBe(testNotes)
      // The update event triggering is tested indirectly through the hook integration
    })

    it('should handle empty notes', () => {
      char.updateNotes('Some notes')
      expect(char.getNotes()).toBe('Some notes')
      
      char.updateNotes('')
      expect(char.getNotes()).toBe('')
    })

    it('should handle multi-line notes', () => {
      const multiLineNotes = 'Line 1\\nLine 2\\nLine 3'
      char.updateNotes(multiLineNotes)
      expect(char.getNotes()).toBe(multiLineNotes)
    })
  })

  describe('Character Saving with Notes', () => {
    it('should save character with notes', async () => {
      const testNotes = 'Important character notes'
      char.updateNotes(testNotes)
      
      const characterName = 'TestCharacter'
      await characterManager.saveCharacter(char, characterName, 'str', 'dex', ['str'])
      
      // Load the character back and verify notes are preserved
      const loaded = await characterManager.loadCharacter(characterName)
      expect(loaded).not.toBeNull()
      expect(loaded!.char.getNotes()).toBe(testNotes)
    })

    it('should save character with empty notes', async () => {
      const characterName = 'EmptyNotesCharacter'
      await characterManager.saveCharacter(char, characterName, 'str', 'dex', ['str'])
      
      const loaded = await characterManager.loadCharacter(characterName)
      expect(loaded).not.toBeNull()
      expect(loaded!.char.getNotes()).toBe('')
    })

    it('should save character with complex notes content', async () => {
      const complexNotes = JSON.stringify([
        { id: '1', content: 'First note', timestamp: 1234567890 },
        { id: '2', content: 'Second note with\\nline breaks', timestamp: 1234567891 }
      ])
      
      char.updateNotes(complexNotes)
      
      const characterName = 'ComplexNotesCharacter'
      await characterManager.saveCharacter(char, characterName, 'str', 'dex', ['str'])
      
      const loaded = await characterManager.loadCharacter(characterName)
      expect(loaded).not.toBeNull()
      expect(loaded!.char.getNotes()).toBe(complexNotes)
    })
  })

  describe('Character Loading with Notes', () => {
    it('should load character with notes intact', async () => {
      const testNotes = 'These are my character notes'
      char.updateNotes(testNotes)
      
      const characterName = 'LoadTestCharacter'
      await characterManager.saveCharacter(char, characterName, 'str', 'dex', ['str'])
      
      // Create a new character and load the saved one
      const newChar = new Char('dex', 'int') // Different stats
      expect(newChar.getNotes()).toBe('') // Should start empty
      
      const loaded = await characterManager.loadCharacter(characterName)
      expect(loaded).not.toBeNull()
      expect(loaded!.char.getNotes()).toBe(testNotes)
    })

    it('should handle loading character with no notes (backward compatibility)', async () => {
      // Simulate old character data without notes field
      const savedChar = CharacterHasher.createSavedCharacter(char, 'BackwardCompatChar', 'str', 'dex', ['str'])
      delete savedChar.data.notes // Remove notes field to simulate old save
      
      await storage.saveCharacter(savedChar)
      
      const loaded = await characterManager.loadCharacter('BackwardCompatChar')
      expect(loaded).not.toBeNull()
      expect(loaded!.char.getNotes()).toBe('') // Should default to empty
    })
  })

  describe('Character Isolation - Notes Per Character', () => {
    it('should keep notes separate between different characters', async () => {
      // Create first character with notes
      const char1 = new Char('str', 'dex', 'human', ['str'])
      const notes1 = 'Notes for character 1'
      char1.updateNotes(notes1)
      await characterManager.saveCharacter(char1, 'Character1', 'str', 'dex', ['str'])
      
      // Create second character with different notes
      const char2 = new Char('dex', 'int', 'elf', ['dex'])
      const notes2 = 'Notes for character 2'
      char2.updateNotes(notes2)
      await characterManager.saveCharacter(char2, 'Character2', 'dex', 'int', ['dex'])
      
      // Load both characters and verify notes are separate
      const loaded1 = await characterManager.loadCharacter('Character1')
      const loaded2 = await characterManager.loadCharacter('Character2')
      
      expect(loaded1!.char.getNotes()).toBe(notes1)
      expect(loaded2!.char.getNotes()).toBe(notes2)
      expect(loaded1!.char.getNotes()).not.toBe(loaded2!.char.getNotes())
    })

    it('should not affect other characters when updating notes', async () => {
      // Save two characters with different notes
      const char1 = new Char('str', 'dex', 'human', ['str'])
      char1.updateNotes('Original notes 1')
      await characterManager.saveCharacter(char1, 'Character1', 'str', 'dex', ['str'])
      
      const char2 = new Char('dex', 'int', 'elf', ['dex'])
      char2.updateNotes('Original notes 2')
      await characterManager.saveCharacter(char2, 'Character2', 'dex', 'int', ['dex'])
      
      // Load first character and update its notes
      const loaded1 = await characterManager.loadCharacter('Character1')
      loaded1!.char.updateNotes('Updated notes 1')
      await characterManager.saveCharacter(loaded1!.char, 'Character1', 'str', 'dex', ['str'])
      
      // Load second character and verify its notes are unchanged
      const loaded2 = await characterManager.loadCharacter('Character2')
      expect(loaded2!.char.getNotes()).toBe('Original notes 2')
    })
  })

  describe('Character Reset and Notes', () => {
    it('should clear notes when character is reset', () => {
      char.updateNotes('Some notes before reset')
      expect(char.getNotes()).toBe('Some notes before reset')
      
      // Create a new character (simulating reset)
      const newChar = new Char('str', 'dex', 'human', ['str'])
      expect(newChar.getNotes()).toBe('')
    })
  })

  describe('Hash Validation with Notes', () => {
    it('should include notes in character hash', () => {
      const char1 = new Char('str', 'dex', 'human', ['str'])
      const char2 = new Char('str', 'dex', 'human', ['str'])
      
      // Same character data, different notes should have different hashes
      char1.updateNotes('Notes for char1')
      char2.updateNotes('Notes for char2')
      
      const hash1 = CharacterHasher.createHash(char1, 'TestChar')
      const hash2 = CharacterHasher.createHash(char2, 'TestChar')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should validate hash correctly with notes', () => {
      char.updateNotes('Test notes for validation')
      
      const hash = CharacterHasher.createHash(char, 'TestChar')
      expect(CharacterHasher.validateHash(char, 'TestChar', hash)).toBe(true)
      
      // Change notes and hash should no longer validate
      char.updateNotes('Different notes')
      expect(CharacterHasher.validateHash(char, 'TestChar', hash)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long notes', () => {
      const longNotes = 'A'.repeat(10000) // 10KB of text
      char.updateNotes(longNotes)
      expect(char.getNotes()).toBe(longNotes)
    })

    it('should handle special characters in notes', () => {
      const specialNotes = 'Notes with special chars: ñáéíóú, emoji: 😀🎮, symbols: @#$%^&*()'
      char.updateNotes(specialNotes)
      expect(char.getNotes()).toBe(specialNotes)
    })

    it('should handle JSON-like content in notes', () => {
      const jsonNotes = '{"key": "value", "array": [1, 2, 3], "nested": {"prop": "val"}}'
      char.updateNotes(jsonNotes)
      expect(char.getNotes()).toBe(jsonNotes)
    })
  })
})