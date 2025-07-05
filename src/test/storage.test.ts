import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageCharacterStorage } from '../storage/LocalStorageCharacterStorage'
import { CharacterManager } from '../storage/CharacterManager'
import { CharacterHasher } from '../storage/CharacterHasher'
import { Char } from '../useChar'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Character Storage System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('CharacterHasher', () => {
    it('should create consistent hashes for same character data', () => {
      const char1 = new Char('str', 'dex', 'elf', ['int'])
      const char2 = new Char('str', 'dex', 'elf', ['int'])
      
      const hash1 = CharacterHasher.createHash(char1, 'TestChar')
      const hash2 = CharacterHasher.createHash(char2, 'TestChar')
      
      expect(hash1).toBe(hash2)
    })

    it('should create different hashes for different characters', () => {
      const char1 = new Char('str', 'dex', 'elf', ['int'])
      const char2 = new Char('int', 'str', 'dwarf', [])
      
      const hash1 = CharacterHasher.createHash(char1, 'TestChar1')
      const hash2 = CharacterHasher.createHash(char2, 'TestChar2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should validate character hashes correctly', () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const hash = CharacterHasher.createHash(char, 'TestChar')
      
      expect(CharacterHasher.validateHash(char, 'TestChar', hash)).toBe(true)
      expect(CharacterHasher.validateHash(char, 'DifferentName', hash)).toBe(false)
    })

    it('should create saved character object correctly', () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      
      expect(savedChar.name).toBe('TestChar')
      expect(savedChar.hash).toBeTruthy()
      expect(savedChar.data.high).toBe('str')
      expect(savedChar.data.mid).toBe('dex')
      expect(savedChar.data.race).toBe('elf')
      expect(savedChar.data.racialBonuses).toEqual(['int'])
      expect(savedChar.timestamp).toBeTruthy()
    })
  })

  describe('LocalStorageCharacterStorage', () => {
    let storage: LocalStorageCharacterStorage

    beforeEach(() => {
      storage = new LocalStorageCharacterStorage()
    })

    it('should save character to localStorage', async () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])

      await storage.saveCharacter(savedChar)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'simple_char_saved_characters',
        JSON.stringify([savedChar])
      )
    })

    it('should load character from localStorage', async () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedChar]))

      const result = await storage.loadCharacter('TestChar')

      expect(result).toEqual(savedChar)
    })

    it('should return null for non-existent character', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      const result = await storage.loadCharacter('NonExistent')

      expect(result).toBeNull()
    })

    it('should list all characters', async () => {
      const char1 = new Char('str', 'dex', 'elf', ['int'])
      const char2 = new Char('int', 'str', 'dwarf', [])
      const savedChar1 = CharacterHasher.createSavedCharacter(char1, 'TestChar1', 'str', 'dex', ['int'])
      // Add small delay to ensure different timestamps
      const savedChar2 = {
        ...CharacterHasher.createSavedCharacter(char2, 'TestChar2', 'int', 'str', []),
        timestamp: Date.now() + 1000
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedChar1, savedChar2]))

      const result = await storage.listCharacters()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('TestChar2') // Should be sorted by timestamp (most recent first)
    })

    it('should delete character', async () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedChar]))

      const result = await storage.deleteCharacter('TestChar')

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'simple_char_saved_characters',
        JSON.stringify([])
      )
    })

    it('should handle empty localStorage gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = await storage.listCharacters()

      expect(result).toEqual([])
    })
  })

  describe('CharacterManager', () => {
    let manager: CharacterManager
    let storage: LocalStorageCharacterStorage

    beforeEach(() => {
      storage = new LocalStorageCharacterStorage()
      manager = new CharacterManager(storage)
    })

    it('should save and load character through manager', async () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      
      // Mock localStorage for save
      localStorageMock.getItem.mockReturnValue(null)
      
      await manager.saveCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      
      // Verify save was called
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      // Mock localStorage for load
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedChar]))
      
      const result = await manager.loadCharacter('TestChar')
      
      expect(result).toBeTruthy()
      expect(result?.char.race).toBe('elf')
      expect(result?.high).toBe('str')
      expect(result?.mid).toBe('dex')
      expect(result?.racialBonuses).toEqual(['int'])
    })

    it('should load character by hash', async () => {
      const char = new Char('str', 'dex', 'elf', ['int'])
      const savedChar = CharacterHasher.createSavedCharacter(char, 'TestChar', 'str', 'dex', ['int'])
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedChar]))

      const result = await manager.loadCharacterByHash(savedChar.hash)

      expect(result).toBeTruthy()
      expect(result?.char.race).toBe('elf')
    })

    it('should handle character not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

      const result = await manager.loadCharacter('NonExistent')

      expect(result).toBeNull()
    })
  })
})