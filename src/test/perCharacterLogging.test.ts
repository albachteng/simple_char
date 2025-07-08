import { describe, it, expect, beforeEach } from 'vitest'
import { logger } from '../logger'
import { characterLogManager } from '../logging/CharacterLogManager'

describe('Per-Character Logging', () => {
  beforeEach(() => {
    // Clear character logs before each test
    characterLogManager.clearAllLogs()
    logger.clearCurrentCharacter()
  })

  it('should log to character-specific storage when character is set', async () => {
    logger.setCurrentCharacter('TestChar')
    
    logger.charCreation('Creating test character', { test: 'data' })
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const globalLogs = logger.getLogs()
    const characterLogs = characterLogManager.getCharacterLogs('TestChar')
    
    // Should be in both global and character logs
    expect(globalLogs.length).toBeGreaterThan(0)
    expect(characterLogs.length).toBeGreaterThan(0)
    
    // Character logs should have character info
    expect(characterLogs[0].characterName).toBe('TestChar')
    expect(characterLogs[0].category).toBe('creation')
    expect(characterLogs[0].message).toBe('Creating test character')
  })

  it('should separate logs by character', async () => {
    // Log for first character
    logger.setCurrentCharacter('Character1')
    logger.charCreation('Character 1 created')
    
    // Log for second character
    logger.setCurrentCharacter('Character2')
    logger.charCreation('Character 2 created')
    
    // Wait for asynchronous character log storage (multiple promises)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const char1Logs = characterLogManager.getCharacterLogs('Character1')
    const char2Logs = characterLogManager.getCharacterLogs('Character2')
    
    expect(char1Logs.length).toBe(1)
    expect(char2Logs.length).toBe(1)
    expect(char1Logs[0].message).toBe('Character 1 created')
    expect(char2Logs[0].message).toBe('Character 2 created')
  })

  it('should return empty logs for non-existent character', () => {
    const logs = characterLogManager.getCharacterLogs('NonExistent')
    expect(logs).toEqual([])
  })

  it('should get character names', async () => {
    logger.setCurrentCharacter('TestChar1')
    logger.charCreation('Test message 1')
    
    logger.setCurrentCharacter('TestChar2')
    logger.charCreation('Test message 2')
    
    // Wait for asynchronous character log storage (multiple promises)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const characterNames = characterLogManager.getCharacterNames()
    expect(characterNames).toContain('TestChar1')
    expect(characterNames).toContain('TestChar2')
    expect(characterNames).toHaveLength(2)
  })

  it('should filter character logs by level', async () => {
    logger.setCurrentCharacter('TestChar')
    logger.charCreation('Info message')
    logger.debug('Debug message')
    logger.error('Error message')
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const allLogs = characterLogManager.getCharacterLogs('TestChar')
    const infoLogs = characterLogManager.getFilteredCharacterLogs('TestChar', 'info')
    const debugLogs = characterLogManager.getFilteredCharacterLogs('TestChar', 'debug')
    
    expect(allLogs.length).toBe(3)
    expect(infoLogs.length).toBe(1)
    expect(debugLogs.length).toBe(1)
    expect(infoLogs[0].message).toBe('Info message')
    expect(debugLogs[0].message).toBe('Debug message')
  })

  it('should filter character logs by category', async () => {
    logger.setCurrentCharacter('TestChar')
    logger.charCreation('Creation message')
    logger.combat('Combat message')
    logger.equipment('Equipment message')
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const allLogs = characterLogManager.getCharacterLogs('TestChar')
    const creationLogs = characterLogManager.getFilteredCharacterLogs('TestChar', undefined, 'creation')
    const combatLogs = characterLogManager.getFilteredCharacterLogs('TestChar', undefined, 'combat')
    
    expect(allLogs.length).toBe(3)
    expect(creationLogs.length).toBe(1)
    expect(combatLogs.length).toBe(1)
    expect(creationLogs[0].message).toBe('Creation message')
    expect(combatLogs[0].message).toBe('Combat message')
  })

  it('should limit character logs to prevent memory issues', async () => {
    logger.setCurrentCharacter('TestChar')
    
    // Add more than 500 logs
    for (let i = 0; i < 510; i++) {
      logger.charCreation(`Message ${i}`)
    }
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const logs = characterLogManager.getCharacterLogs('TestChar')
    expect(logs.length).toBe(500) // Should be limited to 500
    
    // Should keep the most recent logs
    expect(logs[logs.length - 1].message).toBe('Message 509')
  })

  it('should clear character logs', async () => {
    logger.setCurrentCharacter('TestChar')
    logger.charCreation('Test message')
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(characterLogManager.getCharacterLogs('TestChar').length).toBe(1)
    
    characterLogManager.clearCharacterLogs('TestChar')
    expect(characterLogManager.getCharacterLogs('TestChar').length).toBe(0)
  })

  it('should rename character logs', async () => {
    logger.setCurrentCharacter('OldName')
    logger.charCreation('Test message')
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const oldLogs = characterLogManager.getCharacterLogs('OldName')
    expect(oldLogs.length).toBe(1)
    expect(oldLogs[0].characterName).toBe('OldName')
    
    characterLogManager.renameCharacterLogs('OldName', 'NewName')
    
    expect(characterLogManager.getCharacterLogs('OldName').length).toBe(0)
    const newLogs = characterLogManager.getCharacterLogs('NewName')
    expect(newLogs.length).toBe(1)
    expect(newLogs[0].characterName).toBe('NewName')
  })

  it('should get unique categories for character', async () => {
    logger.setCurrentCharacter('TestChar')
    logger.charCreation('Creation message')
    logger.combat('Combat message')
    logger.combat('Another combat message')
    
    // Wait for asynchronous character log storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const categories = characterLogManager.getCharacterCategories('TestChar')
    expect(categories).toContain('creation')
    expect(categories).toContain('combat')
    expect(categories).toHaveLength(2)
  })
})