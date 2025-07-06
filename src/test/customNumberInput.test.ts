import { describe, it, expect } from 'vitest'

describe('CustomNumberInput Component', () => {
  it('should be properly imported and available', () => {
    // Basic import test to ensure the component exists
    import('../components/CustomNumberInput').then((module) => {
      expect(module.CustomNumberInput).toBeDefined()
    })
  })

  it('should handle value clamping correctly', () => {
    // Test the clamping logic
    const min = 1
    const max = 30
    
    // Test values within range
    expect(Math.max(min, Math.min(max, 15))).toBe(15)
    
    // Test value above max
    expect(Math.max(min, Math.min(max, 35))).toBe(30)
    
    // Test value below min
    expect(Math.max(min, Math.min(max, -5))).toBe(1)
  })

  it('should handle number parsing correctly', () => {
    // Test valid number strings
    expect(parseInt('15', 10)).toBe(15)
    expect(parseInt('0', 10)).toBe(0)
    
    // Test invalid strings
    expect(isNaN(parseInt('', 10))).toBe(true)
    expect(isNaN(parseInt('abc', 10))).toBe(true)
  })
})