import { describe, it, expect, beforeEach } from 'vitest'
import { logger } from '../logger'

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should log messages with correct format', () => {
    logger.charCreation('Test character creation', { str: 16 })
    
    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    
    const log = logs[0]
    expect(log.level).toBe('info')
    expect(log.category).toBe('creation')
    expect(log.message).toBe('Test character creation')
    expect(log.data).toEqual({ str: 16 })
    expect(log.timestamp).toBeDefined()
  })

  it('should filter logs by category', () => {
    logger.charCreation('Character test')
    logger.combat('Combat test')
    logger.equipment('Equipment test')
    
    const combatLogs = logger.getLogsByCategory('combat')
    expect(combatLogs).toHaveLength(1)
    expect(combatLogs[0].message).toBe('Combat test')
  })

  it('should clear logs', () => {
    logger.debug('Test message')
    expect(logger.getLogs()).toHaveLength(1)
    
    logger.clearLogs()
    expect(logger.getLogs()).toHaveLength(0)
  })

  it('should get recent logs', () => {
    for (let i = 0; i < 15; i++) {
      logger.debug(`Message ${i}`)
    }
    
    const recentLogs = logger.getRecentLogs(5)
    expect(recentLogs).toHaveLength(5)
    expect(recentLogs[4].message).toBe('Message 14')
  })

  it('should respect log level filtering', () => {
    logger.setLevel('warn')
    
    logger.debug('Debug message')
    logger.info('Info message')
    logger.error('Error message')
    
    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Error message')
    
    // Reset to debug for other tests
    logger.setLevel('debug')
  })
})
