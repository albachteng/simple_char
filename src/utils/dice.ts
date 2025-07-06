import { logger } from '../logger'

export interface DiceRollResult {
  result: number
  rolls: number[]
  modifier: number
  total: number
}

/**
 * Roll a die with the specified number of sides
 */
export function rollDie(sides: number): number {
  return Math.ceil(Math.random() * sides)
}

/**
 * Roll multiple dice and return the sum
 */
export function rollDice(count: number, sides: number): number[] {
  const rolls: number[] = []
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides))
  }
  return rolls
}

/**
 * Roll dice with modifier and return detailed result
 */
export function rollWithModifier(count: number, sides: number, modifier: number = 0): DiceRollResult {
  const rolls = rollDice(count, sides)
  const result = rolls.reduce((sum, roll) => sum + roll, 0)
  const total = result + modifier
  
  logger.combat(`Rolling ${count}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`, {
    rolls,
    base_result: result,
    modifier,
    total
  })
  
  return {
    result,
    rolls,
    modifier,
    total
  }
}

/**
 * Get average value instead of rolling (for predictable results)
 */
export function getAverageValue(count: number, sides: number, modifier: number = 0): number {
  const averageRoll = (sides + 1) / 2
  return Math.floor(count * averageRoll) + modifier
}

/**
 * Settings for dice rolling behavior
 */
export class DiceSettings {
  private static useDiceRolls: boolean = false
  
  static setUseDiceRolls(enabled: boolean): void {
    this.useDiceRolls = enabled
    logger.combat(`Dice rolling ${enabled ? 'enabled' : 'disabled'} - using ${enabled ? 'random rolls' : 'average values'}`)
  }
  
  static getUseDiceRolls(): boolean {
    return this.useDiceRolls
  }
  
  /**
   * Roll dice or return average based on current settings
   */
  static rollOrAverage(count: number, sides: number, modifier: number = 0): number {
    if (this.useDiceRolls) {
      const result = rollWithModifier(count, sides, modifier)
      return result.total
    } else {
      const average = getAverageValue(count, sides, modifier)
      logger.combat(`Using average for ${count}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`, {
        average_per_die: (sides + 1) / 2,
        total_average: average
      })
      return average
    }
  }
}

/**
 * Common dice roll functions
 */
export const d4 = () => rollDie(4)
export const d6 = () => rollDie(6)
export const d8 = () => rollDie(8)
export const d10 = () => rollDie(10)
export const d12 = () => rollDie(12)
export const d20 = () => rollDie(20)

/**
 * Parse dice notation like "2d6+3" or "1d8"
 */
export function parseDiceNotation(notation: string): { count: number, sides: number, modifier: number } {
  const match = notation.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i)
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }
  
  const count = parseInt(match[1], 10)
  const sides = parseInt(match[2], 10)
  const sign = match[3] || '+'
  const modifierValue = match[4] ? parseInt(match[4], 10) : 0
  const modifier = sign === '-' ? -modifierValue : modifierValue
  
  return { count, sides, modifier }
}

/**
 * Roll dice from notation string
 */
export function rollFromNotation(notation: string): DiceRollResult {
  const { count, sides, modifier } = parseDiceNotation(notation)
  return rollWithModifier(count, sides, modifier)
}