import type { Armor, Weapon, Stat, Race } from '../types'
import mitt from "mitt";
import { 
  ARMOR_MODS, 
  ARMOR_STR_REQ, 
  BASE_AC, 
  BASE_ATTACKS,
  DBL_SPELLCASTING_INT,
  HIT_DICE_FROM_MOD, 
  LEVEL_UP_STAT_INCREASE,  
  MIN_SPELLCASTING_INT,
  MIN_FINESSE_DEX,
  SNEAK_ATTACK_DIE,
  WEAPON_DIE,
  WEAPON_STAT,
  RACIAL_BONUS,
  SHIELD_AC
} from '../constants'
import { useEffect, useState } from 'react'
import { logger } from './logger'
import { InventoryManager } from './inventory/InventoryManager'
import { DiceSettings } from './utils/dice'
import { AbilityManager } from './abilities/AbilityManager'

function isTwoHand(weapon: Weapon) {
  return (
    weapon === 'two-hand' || 
    weapon === 'ranged' 
  )
}

export function mod(stat: number) {
  const result = Math.floor((stat - 10) / 2)
  logger.statCalculation(`Calculating modifier for stat ${stat}`, { stat, modifier: result })
  return result
}

// function dc(lvl: number, mod: number) {
  // return 8 + lvl + mod
// }

export class Char {
  private emitter = mitt();
  str: number
  dex: number
  int: number
  lvl: number
  hp: number
  hp_rolls: number[]
  level_up_choices: Stat[] // Track which stat was chosen at each level
  pending_level_up_points: number // Track remaining level-up points to allocate
  shield: boolean
  armor: Armor
  weapon: Weapon
  // Resource tracking with current/max values
  sorcery_points: number
  max_sorcery_points: number
  finesse_points: number
  max_finesse_points: number
  combat_maneuver_points: number
  max_combat_maneuver_points: number
  race: Race | null
  abilities: string[]
  inventory: InventoryManager
  abilityManager: AbilityManager
  
  // Stat override system - these are bonuses/penalties, not absolute values
  private useStatOverrides: boolean = false
  private statModifiers: { str: number, dex: number, int: number } = { str: 0, dex: 0, int: 0 }
  constructor(high: Stat, med: Stat, race: Race | null = null, racialBonuses: Stat[] = []) {
    logger.charCreation(`Creating new character with high stat: ${high}, medium stat: ${med}, race: ${race || 'none'}`)
    
    this.str = "str" === high ? 16 : ("str" === med) ? 10 : 6 
    this.dex = "dex" === high ? 16 : ("dex" === med) ? 10 : 6 
    this.int = "int" === high ? 16 : ("int" === med) ? 10 : 6 
    
    this.race = race
    this.abilities = []
    
    // Apply racial bonuses
    if (race && RACIAL_BONUS[race]) {
      const raceData = RACIAL_BONUS[race]
      this.abilities.push(raceData.ability)
      
      logger.charCreation(`Applying racial bonuses for ${race}`, { 
        ability: raceData.ability,
        bonuses: raceData.bonus 
      })
      
      let anyBonusIndex = 0
      raceData.bonus.forEach((bonus) => {
        if (bonus.stat === "any") {
          // Use the provided racialBonuses array for "any" stat bonuses
          if (anyBonusIndex < racialBonuses.length) {
            const chosenStat = racialBonuses[anyBonusIndex]
            this[chosenStat] += bonus.plus
            logger.charCreation(`Applied "any" bonus +${bonus.plus} to ${chosenStat}`)
            anyBonusIndex++
          }
        } else {
          // Apply fixed stat bonus
          this[bonus.stat as Stat] += bonus.plus
          logger.charCreation(`Applied racial bonus +${bonus.plus} to ${bonus.stat}`)
        }
      })
    }
    
    logger.charCreation(`Initial stats set (after racial bonuses)`, { str: this.str, dex: this.dex, int: this.int })
    
    this.lvl = 1
    this.hp = 10
    this.hp_rolls = [10]
    this.level_up_choices = [] // Start empty - level 1 doesn't have choices
    this.pending_level_up_points = 0 // No pending points at character creation
    this.shield = false
    this.armor = "none"
    this.weapon = "none"
    
    // Initialize inventory and ability manager
    this.inventory = new InventoryManager()
    this.abilityManager = new AbilityManager()
    
    // Clear abilities to ensure new characters start fresh
    this.abilityManager.clearAbilities()
    
    // Set initial character stats for inventory validation
    this.updateInventoryStats()
    
    logger.charCreation(`Rolling initial HP for level 1`)
    this.roll_hp()
    
    // Initialize resource points (current = max at creation)
    // Note: Additional sorcery points for INT > 14 are only granted on level-up
    this.max_sorcery_points = this?.int > 10 ? 3 : 0
    this.sorcery_points = this.max_sorcery_points
    this.max_finesse_points = this?.dex >= 16 ? 1 : 0
    this.finesse_points = this.max_finesse_points
    // Combat maneuvers calculated manually for initial creation
    const effectiveStats = this.getEffectiveStats()
    this.max_combat_maneuver_points = effectiveStats.str >= 16 ? this.lvl : 0
    this.combat_maneuver_points = this.max_combat_maneuver_points
    
    logger.charCreation(`Character created successfully`, {
      race: this.race,
      abilities: this.abilities,
      level: this.lvl,
      hp: this.hp,
	  combat_maneuvers: this.maneuvers('str'),
      sorcery_points: this.sorcery_points,
      finesse_points: this.finesse_points
    })
  }

  // Resource management methods
  updateMaxValues() {
    const effectiveStats = this.getEffectiveStats()
    
    // Update max values based on current stats (base values only)
    // Level-up bonuses are handled separately in finalize_level_up()
    const newMaxSorcery = effectiveStats.int > 10 ? 3 : 0  // Base only
    const newMaxFinesse = effectiveStats.dex >= 16 ? 1 : 0
    const newMaxCombat = effectiveStats.str >= 16 ? this.lvl : 0
    
    // If max increased, add to current (but don't exceed new max)
    if (newMaxSorcery > this.max_sorcery_points) {
      this.sorcery_points = Math.min(this.sorcery_points + (newMaxSorcery - this.max_sorcery_points), newMaxSorcery)
    } else if (newMaxSorcery < this.max_sorcery_points) {
      this.sorcery_points = Math.min(this.sorcery_points, newMaxSorcery)
    }
    
    if (newMaxFinesse > this.max_finesse_points) {
      this.finesse_points = Math.min(this.finesse_points + (newMaxFinesse - this.max_finesse_points), newMaxFinesse)
    } else if (newMaxFinesse < this.max_finesse_points) {
      this.finesse_points = Math.min(this.finesse_points, newMaxFinesse)
    }
    
    if (newMaxCombat > this.max_combat_maneuver_points) {
      this.combat_maneuver_points = Math.min(this.combat_maneuver_points + (newMaxCombat - this.max_combat_maneuver_points), newMaxCombat)
    } else if (newMaxCombat < this.max_combat_maneuver_points) {
      this.combat_maneuver_points = Math.min(this.combat_maneuver_points, newMaxCombat)
    }
    
    this.max_sorcery_points = newMaxSorcery
    this.max_finesse_points = newMaxFinesse
    this.max_combat_maneuver_points = newMaxCombat
    
    logger.resourceManagement('Updated max values', {
      sorcery: `${this.sorcery_points}/${this.max_sorcery_points}`,
      finesse: `${this.finesse_points}/${this.max_finesse_points}`,
      combat: `${this.combat_maneuver_points}/${this.max_combat_maneuver_points}`
    })
  }

  // Spend sorcery points for spellcasting
  spendSorceryPoint(): boolean {
    if (this.sorcery_points > 0) {
      this.sorcery_points -= 1
      logger.resourceManagement('Spent sorcery point', { remaining: this.sorcery_points })
      this.emitter.emit("update")
      return true
    }
    return false
  }

  // Spend finesse points for sneak attacks
  spendFinessePoint(): boolean {
    if (this.finesse_points > 0) {
      this.finesse_points -= 1
      logger.resourceManagement('Spent finesse point', { remaining: this.finesse_points })
      this.emitter.emit("update")
      return true
    }
    return false
  }

  // Spend combat maneuver points
  spendCombatManeuverPoint(): boolean {
    if (this.combat_maneuver_points > 0) {
      this.combat_maneuver_points -= 1
      logger.resourceManagement('Spent combat maneuver point', { remaining: this.combat_maneuver_points })
      this.emitter.emit("update")
      return true
    }
    return false
  }

  // Rest methods to restore points
  shortRest() {
    // Restore half of max (rounded up) for each resource
    this.sorcery_points = Math.min(this.max_sorcery_points, this.sorcery_points + Math.ceil(this.max_sorcery_points / 2))
    this.finesse_points = Math.min(this.max_finesse_points, this.finesse_points + Math.ceil(this.max_finesse_points / 2))
    this.combat_maneuver_points = Math.min(this.max_combat_maneuver_points, this.combat_maneuver_points + Math.ceil(this.max_combat_maneuver_points / 2))
    
    logger.resourceManagement('Short rest taken', {
      sorcery: `${this.sorcery_points}/${this.max_sorcery_points}`,
      finesse: `${this.finesse_points}/${this.max_finesse_points}`,
      combat: `${this.combat_maneuver_points}/${this.max_combat_maneuver_points}`
    })
    this.emitter.emit("update")
  }

  longRest() {
    // Restore all points to max
    this.sorcery_points = this.max_sorcery_points
    this.finesse_points = this.max_finesse_points
    this.combat_maneuver_points = this.max_combat_maneuver_points
    
    logger.resourceManagement('Long rest taken', {
      sorcery: `${this.sorcery_points}/${this.max_sorcery_points}`,
      finesse: `${this.finesse_points}/${this.max_finesse_points}`,
      combat: `${this.combat_maneuver_points}/${this.max_combat_maneuver_points}`
    })
    this.emitter.emit("update")
  }

  maneuvers(stat: Stat) {
    const effectiveStats = this.getEffectiveStats()
    let result: number
    
    if (stat === 'int') {
      result = this.sorcery_points
      logger.maneuvers(`INT maneuvers: sorcery points`, { 
        stat, 
        int: effectiveStats.int, 
        sorcery_points: this.sorcery_points,
        result 
      })
    } else if (stat === 'dex') {
      result = this.finesse_points
      logger.maneuvers(`DEX maneuvers: finesse points`, { 
        stat, 
        dex: effectiveStats.dex, 
        finesse_points: this.finesse_points,
        result 
      })
    } else {
      result = effectiveStats.str >= 16 ? this.lvl : 0
      logger.maneuvers(`STR maneuvers: combat maneuvers`, { 
        stat, 
        str: effectiveStats.str, 
        level: this.lvl,
        str_meets_req: effectiveStats.str >= 16,
        result 
      })
    }
    
    return result
  }

  roll_hp() {
    const effectiveStats = this.getEffectiveStats()
    const str_mod = mod(effectiveStats.str) > 0 ? mod(effectiveStats.str) : 0
    const hit_dice = HIT_DICE_FROM_MOD[str_mod - 1] || 4
    const hp_roll = DiceSettings.rollOrAverage(1, hit_dice, str_mod)
    const final_roll = hp_roll || 1
    
    logger.hpCalculation(`Rolling HP for level ${this.lvl}`, {
      str: effectiveStats.str,
      str_mod,
      hit_dice,
      hp_roll,
      str_bonus: str_mod,
      final_roll,
      previous_hp: this.hp,
      using_dice: DiceSettings.getUseDiceRolls()
    })
    
    this.hp_rolls.push(final_roll)
    this.hp += final_roll
    
    logger.hpCalculation(`HP updated`, { new_hp: this.hp, hp_rolls: this.hp_rolls })
  }

  hide() {
    const effectiveStats = this.getEffectiveStats()
    const factor = (effectiveStats.dex >= 16 && this.armor !== 'heavy') ? 2 : 1;
    const dex_mod = mod(effectiveStats.dex)
    const level_bonus = this.lvl * factor
    const hide_roll = DiceSettings.rollOrAverage(1, 20, dex_mod + level_bonus)
    
    logger.combat(`Hide roll`, {
      dex: effectiveStats.dex,
      dex_mod,
      level: this.lvl,
      factor,
      level_bonus,
      total_roll: hide_roll,
      using_dice: DiceSettings.getUseDiceRolls()
    })
    
    return hide_roll
  }

  ac() {
    const effectiveStats = this.getEffectiveStats()
    const armor_mod = ARMOR_MODS[this.armor] || 0
    const equippedBonuses = this.getEquippedStatBonuses()
    const dex_mod = mod(effectiveStats.dex + equippedBonuses.dex)
    const shield_bonus = Number(this.shield) * SHIELD_AC;
    const enchantment_bonus = this.inventory.getEquippedEnchantmentAcBonus()
    const total_ac = BASE_AC + dex_mod + armor_mod + shield_bonus + enchantment_bonus
    
    logger.acCalculation(`Calculating AC`, {
      base_ac: BASE_AC,
      dex: effectiveStats.dex,
      dex_equipment_bonus: equippedBonuses.dex,
      effective_dex: effectiveStats.dex + equippedBonuses.dex,
      dex_mod,
      armor: this.armor,
      armor_mod,
      shield: this.shield,
      shield_bonus,
      enchantment_bonus,
      total_ac
    })
    
    return total_ac
  }

  // Start a new level-up, granting 2 points to allocate
  start_level_up() {
    if (this.pending_level_up_points > 0) {
      logger.levelUp(`Cannot start level up - already have ${this.pending_level_up_points} pending points`)
      return false
    }
    
    const old_level = this.lvl
    this.lvl += 1
    this.pending_level_up_points = LEVEL_UP_STAT_INCREASE
    this.roll_hp()
    
    logger.levelUp(`Started level up from ${old_level} to ${this.lvl}`, {
      old_level,
      new_level: this.lvl,
      pending_points: this.pending_level_up_points
    })
    
    this.emitter.emit("update")
    return true
  }
  
  // Allocate a single point to a stat
  allocate_point(choice: Stat) {
    if (this.pending_level_up_points <= 0) {
      logger.levelUp(`Cannot allocate point - no pending points available`)
      return false
    }
    
    const old_stat = this[choice]
    this[choice] += 1
    this.pending_level_up_points -= 1
    this.level_up_choices.push(choice) // Track each individual choice
    
    logger.levelUp(`Allocated 1 point to ${choice}`, {
      stat: choice,
      old_value: old_stat,
      new_value: this[choice],
      remaining_points: this.pending_level_up_points
    })
    
    // Check for stat-based bonuses when allocation is complete
    if (this.pending_level_up_points === 0) {
      this.finalize_level_up()
      // finalize_level_up handles resource updates, so no need to call updateMaxValues
    } else {
      // Only update max values if level-up is not finalized (to avoid conflicts)
      this.updateMaxValues()
    }
    
    // Update inventory with new stats
    this.updateInventoryStats()
    this.emitter.emit("update")
    return true
  }
  
  // Finalize level-up and grant any stat-based bonuses
  private finalize_level_up() {
    const old_sorcery = this.sorcery_points
    const old_finesse = this.finesse_points
    
    // Grant level-up bonuses using the original logic
    if (this.int >= MIN_SPELLCASTING_INT) {
      this.sorcery_points++ 
      this.max_sorcery_points++
      logger.levelUp(`Gained sorcery point (INT > 10)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.int > DBL_SPELLCASTING_INT) {
      this.sorcery_points++
      this.max_sorcery_points++
      logger.levelUp(`Gained additional sorcery point (INT > 14)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.dex >= MIN_FINESSE_DEX && this.lvl % 2) {
      this.finesse_points++
      this.max_finesse_points++
      logger.levelUp(`Gained finesse point (DEX >= 16 and odd level)`, { 
        dex: this.dex, 
        level: this.lvl, 
        finesse_points: this.finesse_points 
      })
    }
    
    logger.levelUp(`Level up finalized`, {
      level: this.lvl,
      str: this.str,
      dex: this.dex,
      int: this.int,
      old_sorcery,
      new_sorcery: this.sorcery_points,
      old_finesse,
      new_finesse: this.finesse_points
    })
  }
  
  // Legacy method for backward compatibility - full +2 to single stat
  level_up(choice: Stat) {
    const old_stat = this[choice]
    const old_level = this.lvl
    const old_sorcery = this.sorcery_points
    const old_finesse = this.finesse_points
    
    logger.levelUp(`Leveling up ${choice} from ${old_stat} to ${old_stat + LEVEL_UP_STAT_INCREASE}`, {
      stat: choice,
      old_value: old_stat,
      increase: LEVEL_UP_STAT_INCREASE,
      old_level,
      new_level: old_level + 1
    })
    
    this[choice] += LEVEL_UP_STAT_INCREASE
    this.lvl += 1
    this.level_up_choices.push(choice) // Track the choice
    this.roll_hp()
    
    // Update all max values based on new stats and level
    this.updateMaxValues()
    
    logger.levelUp(`Level up complete`, {
      stat: choice,
      old_stats: { [choice]: old_stat, level: old_level, sorcery_points: old_sorcery, finesse_points: old_finesse },
      new_stats: { 
        [choice]: this[choice], 
        level: this.lvl, 
        sorcery_points: `${this.sorcery_points}/${this.max_sorcery_points}`,
        finesse_points: `${this.finesse_points}/${this.max_finesse_points}`,
        combat_maneuvers: `${this.combat_maneuver_points}/${this.max_combat_maneuver_points}`
      }
    })
    
    // Update inventory with new stats
    this.updateInventoryStats()
    
    this.emitter.emit("update")
  }

  on(event: "update", handler: () => void) {
    this.emitter.on(event, handler);
  }

  off(event: "update", handler: () => void) {
    this.emitter.off(event, handler);
  }

  triggerUpdate() {
    this.emitter.emit("update");
  }

  // Update inventory manager with current character stats
  updateInventoryStats() {
    const effectiveStats = this.getEffectiveStats()
    this.inventory.setCharacterStats({
      str: effectiveStats.str,
      dex: effectiveStats.dex,
      int: effectiveStats.int
    })
  }

  proficiency() {
    return this.lvl
  }

  // Sync equipment state with inventory system
  syncEquipmentFromInventory() {
    const equippedWeapon = this.inventory.getEquippedItemByType('weapon')
    const equippedArmor = this.inventory.getEquippedItemByType('armor')
    const equippedShield = this.inventory.getEquippedItemByType('shield')

    // Update legacy equipment properties
    this.weapon = equippedWeapon?.weaponType || 'none'
    this.armor = equippedArmor?.armorType || 'none'
    this.shield = !!equippedShield

    logger.equipment(`Equipment synced from inventory`, {
      weapon: this.weapon,
      armor: this.armor,
      shield: this.shield
    })
  }

  // Get stat bonuses from equipped items
  getEquippedStatBonuses(): { str: number, dex: number, int: number } {
    const bonuses = { str: 0, dex: 0, int: 0 }
    const equippedItems = this.inventory.getEquippedItems()

    equippedItems.forEach(item => {
      if (item.statBonuses) {
        item.statBonuses.forEach(bonus => {
          bonuses[bonus.stat] += bonus.bonus
        })
      }
    })

    return bonuses
  }

  // Stat override system methods
  getEffectiveStats(): { str: number, dex: number, int: number } {
    if (this.useStatOverrides) {
      return { 
        str: Math.max(0, Math.min(30, this.str + this.statModifiers.str)),
        dex: Math.max(0, Math.min(30, this.dex + this.statModifiers.dex)),
        int: Math.max(0, Math.min(30, this.int + this.statModifiers.int))
      }
    }
    return { str: this.str, dex: this.dex, int: this.int }
  }

  isUsingStatOverrides(): boolean {
    return this.useStatOverrides
  }

  toggleStatOverrides(): void {
    this.useStatOverrides = !this.useStatOverrides
    
    // Update inventory with current effective stats
    this.updateInventoryStats()
    this.emitter.emit("update")
    
    logger.charCreation(`Stat overrides ${this.useStatOverrides ? 'enabled' : 'disabled'}`, {
      useOverrides: this.useStatOverrides,
      originalStats: { str: this.str, dex: this.dex, int: this.int },
      statModifiers: this.statModifiers
    })
  }

  setStatModifier(stat: Stat, modifier: number): void {
    if (this.useStatOverrides) {
      // Calculate what the final stat would be
      const originalStat = this[stat]
      const finalStat = originalStat + modifier
      
      // Clamp the final result between 0-30, then calculate the actual modifier
      const clampedFinalStat = Math.max(0, Math.min(30, finalStat))
      const actualModifier = clampedFinalStat - originalStat
      
      this.statModifiers[stat] = actualModifier
      this.updateInventoryStats()
      this.emitter.emit("update")
      
      logger.charCreation(`Set ${stat} modifier to ${modifier}`, {
        stat,
        originalValue: originalStat,
        requestedModifier: modifier,
        actualModifier,
        finalStat: clampedFinalStat
      })
    }
  }

  getStatModifier(stat: Stat): number {
    return this.statModifiers[stat]
  }

  // Legacy method name for compatibility
  setStatOverride(stat: Stat, modifier: number): void {
    this.setStatModifier(stat, modifier)
  }

  getStatOverride(stat: Stat): number {
    return this.getStatModifier(stat)
  }

  // Get maneuver bonuses from equipped items
  getEquippedManeuverBonuses(): { combat: number, finesse: number, sorcery: number } {
    const bonuses = { combat: 0, finesse: 0, sorcery: 0 }
    const equippedItems = this.inventory.getEquippedItems()

    equippedItems.forEach(item => {
      if (item.maneuverBonuses) {
        item.maneuverBonuses.forEach(bonus => {
          bonuses[bonus.type] += bonus.bonus
        })
      }
    })

    return bonuses
  }

  equip_shield() {
    const canEquip = !isTwoHand(this.weapon)
    
    logger.equipment(`Attempting to equip shield`, { 
      current_weapon: this.weapon,
      is_two_handed: isTwoHand(this.weapon),
      can_equip: canEquip,
      currently_has_shield: this.shield
    })
    
    if (canEquip) {
      this.shield = true
      this.syncEquipmentFromInventory()
      logger.equipment(`Shield equipped successfully`)
    } else {
      logger.equipment(`Cannot equip shield - weapon is two-handed`)
    }
    
    this.emitter.emit("update")
  }

  equip_armor(armor: Armor) {
    const effectiveStats = this.getEffectiveStats()
    const str_req = ARMOR_STR_REQ[armor]
    const canEquip = effectiveStats.str >= str_req
    
    logger.equipment(`Attempting to equip ${armor} armor`, {
      armor,
      str_requirement: str_req,
      current_str: effectiveStats.str,
      can_equip: canEquip,
      current_armor: this.armor
    })
    
    if (canEquip) {
      this.armor = armor
      this.syncEquipmentFromInventory()
      logger.equipment(`${armor} armor equipped successfully`)
    } else {
      logger.equipment(`Cannot equip ${armor} armor - insufficient STR (need ${str_req}, have ${effectiveStats.str})`)
    }
    
    this.emitter.emit("update")
  }

  equip_weapon(weapon: Weapon) {
    const isTwoHanded = isTwoHand(weapon)
    const hasShield = this.shield
    
    logger.equipment(`Attempting to equip ${weapon} weapon`, {
      weapon,
      is_two_handed: isTwoHanded,
      has_shield: hasShield,
      current_weapon: this.weapon
    })
    
    if (hasShield) {
      if (!isTwoHanded) { 
        this.weapon = weapon
        this.syncEquipmentFromInventory()
        logger.equipment(`${weapon} weapon equipped successfully (with shield)`)
      } else {
        logger.equipment(`Cannot equip ${weapon} weapon - two-handed weapon conflicts with shield`)
      }
    } else {
      this.weapon = weapon
      this.syncEquipmentFromInventory()
      logger.equipment(`${weapon} weapon equipped successfully`)
    }
    
    this.emitter.emit("update")
  }

  // Legacy weapon attack method for backward compatibility
  weapon_attack() {
    const effectiveStats = this.getEffectiveStats()
    const weapon_stat = WEAPON_STAT[this.weapon]
    const stat_mod = mod(effectiveStats[weapon_stat])
    const dmg_mod = stat_mod + this.lvl
    const attacks = BASE_ATTACKS;
    const weapon_die = WEAPON_DIE[this.weapon]
    let total = 0
    
    logger.combat(`Starting weapon attack with ${this.weapon}`, {
      weapon: this.weapon,
      weapon_stat,
      stat_value: effectiveStats[weapon_stat],
      stat_mod,
      level: this.lvl,
      dmg_mod,
      attacks,
      weapon_die
    })
    
    for (let i = 0; i < attacks; i++) {
      const die_roll = DiceSettings.rollOrAverage(1, weapon_die, 0)
      total += die_roll
      total += dmg_mod 
      
      logger.combat(`Attack ${i + 1}`, {
        die_roll,
        dmg_mod,
        attack_total: die_roll + dmg_mod,
        running_total: total,
        using_dice: DiceSettings.getUseDiceRolls()
      })
    }
    
    logger.combat(`Weapon attack complete`, { total_damage: total })
    
    this.emitter.emit("update")
    return total
  }

  // Attack roll (to-hit) for main-hand weapon
  mainHandAttackRoll(): number {
    const { mainHand } = this.inventory.getEquippedWeapons()
    if (!mainHand) {
      logger.combat('No main-hand weapon equipped for attack roll')
      return 0
    }

    const effectiveStats = this.getEffectiveStats()
    const weapon_stat = WEAPON_STAT[mainHand.weaponType || 'none']
    const stat_mod = mod(effectiveStats[weapon_stat])
    const enchantment_bonus = mainHand.enchantmentLevel || 0
    const d20_roll = DiceSettings.rollOrAverage(1, 20, 0)
    const total_roll = d20_roll + stat_mod + this.lvl + enchantment_bonus

    logger.combat(`Main-hand attack roll with ${mainHand.name}`, {
      weapon: mainHand.name,
      weapon_type: mainHand.weaponType,
      weapon_stat,
      stat_value: effectiveStats[weapon_stat],
      stat_mod,
      level: this.lvl,
      enchantment_bonus,
      d20_roll,
      total_roll,
      using_dice: DiceSettings.getUseDiceRolls()
    })

    this.emitter.emit("update")
    return total_roll
  }

  // Attack roll (to-hit) for off-hand weapon
  offHandAttackRoll(): number {
    const { offHand } = this.inventory.getEquippedWeapons()
    if (!offHand) {
      logger.combat('No off-hand weapon equipped for attack roll')
      return 0
    }

    const effectiveStats = this.getEffectiveStats()
    const weapon_stat = WEAPON_STAT[offHand.weaponType || 'none']
    const stat_mod = mod(effectiveStats[weapon_stat])
    const enchantment_bonus = offHand.enchantmentLevel || 0
    const d20_roll = DiceSettings.rollOrAverage(1, 20, 0)
    const total_roll = d20_roll + stat_mod + enchantment_bonus // No level bonus for off-hand

    logger.combat(`Off-hand attack roll with ${offHand.name}`, {
      weapon: offHand.name,
      weapon_type: offHand.weaponType,
      weapon_stat,
      stat_value: effectiveStats[weapon_stat],
      stat_mod,
      enchantment_bonus,
      d20_roll,
      total_roll: total_roll,
      note: 'Off-hand gets no level bonus',
      using_dice: DiceSettings.getUseDiceRolls()
    })

    this.emitter.emit("update")
    return total_roll
  }

  // Damage roll for main-hand weapon
  mainHandDamageRoll(): number {
    const { mainHand } = this.inventory.getEquippedWeapons()
    if (!mainHand) {
      logger.combat('No main-hand weapon equipped for damage roll')
      return 0
    }

    const effectiveStats = this.getEffectiveStats()
    const weapon_stat = WEAPON_STAT[mainHand.weaponType || 'none']
    const stat_mod = mod(effectiveStats[weapon_stat])
    const enchantment_bonus = mainHand.enchantmentLevel || 0
    const weapon_die = WEAPON_DIE[mainHand.weaponType || 'none']
    const die_roll = DiceSettings.rollOrAverage(1, weapon_die, 0)
    const total_damage = die_roll + stat_mod + enchantment_bonus

    logger.combat(`Main-hand damage roll with ${mainHand.name}`, {
      weapon: mainHand.name,
      weapon_type: mainHand.weaponType,
      weapon_stat,
      stat_value: effectiveStats[weapon_stat],
      stat_mod,
      enchantment_bonus,
      weapon_die,
      die_roll,
      total_damage,
      using_dice: DiceSettings.getUseDiceRolls()
    })

    this.emitter.emit("update")
    return total_damage
  }

  // Damage roll for off-hand weapon
  offHandDamageRoll(): number {
    const { offHand } = this.inventory.getEquippedWeapons()
    if (!offHand) {
      logger.combat('No off-hand weapon equipped for damage roll')
      return 0
    }

    const enchantment_bonus = offHand.enchantmentLevel || 0
    const weapon_die = WEAPON_DIE[offHand.weaponType || 'none']
    const die_roll = DiceSettings.rollOrAverage(1, weapon_die, 0)
    const total_damage = die_roll + enchantment_bonus // No stat modifier for off-hand damage

    logger.combat(`Off-hand damage roll with ${offHand.name}`, {
      weapon: offHand.name,
      weapon_type: offHand.weaponType,
      enchantment_bonus,
      weapon_die,
      die_roll,
      total_damage,
      note: 'Off-hand gets no stat modifier',
      using_dice: DiceSettings.getUseDiceRolls()
    })

    this.emitter.emit("update")
    return total_damage
  }

  sneak_attack() {
    logger.combat(`Starting sneak attack`, { finesse_points: this.finesse_points })
    
    let total = this.weapon_attack()
    
    for (let i = 0; i < this.finesse_points; i++){
      const sneak_die = DiceSettings.rollOrAverage(1, SNEAK_ATTACK_DIE, 0)
      total += sneak_die
      
      logger.combat(`Sneak attack die ${i + 1}`, {
        die_roll: sneak_die,
        die_size: SNEAK_ATTACK_DIE,
        running_total: total,
        using_dice: DiceSettings.getUseDiceRolls()
      })
    }
    
    logger.combat(`Sneak attack complete`, { total_damage: total })
    
    this.emitter.emit("update")
    return total
  }

  print() {
    console.log('\n',
      "LVL: ", this.lvl, '\n', 
      "STR:", this.str, "(", mod(this.str), ")", this.maneuvers("str"), "\n",
      "DEX:", this.dex, "(", mod(this.dex), ")", this.maneuvers("dex"), "\n",
      "INT:", this.int, "(", mod(this.int), ")", this.maneuvers("int"), "\n",
      "AC:", this.ac(), "\n",
      "HP:", this.hp, this.hp_rolls, "\n",
      "DMG: ", this.weapon_attack(), "SNEAK ATTACK: ", 
      this.finesse_points ? this.sneak_attack() : "X", "\n",
    )
  }
}

export const level10 = (name: string, levels: Stat[], high: Stat, med: Stat, weapon: Weapon, armor: Armor) => {
  const c = new Char(high, med)
  levels.forEach(stat => {
    c.level_up(stat)
  })
  c.equip_weapon(weapon)
  c.equip_armor(armor)
  console.log(name)
  c.print();
  return c;
}

export function useChar() {
  const [char, setChar] = useState(() => new Char("str", "dex"))
  const [_, setTrigger] = useState(0); 

  useEffect(() => {
    const handleUpdate = () => setTrigger((prev) => prev + 1)
    char.on("update", handleUpdate);

    return () => {
      char.off("update", handleUpdate); 
    };
  }, [char]);

  const reset = (high: Stat, mid: Stat, race: Race | null = null, racialBonuses: Stat[] = []) => 
    setChar(new Char(high, mid, race, racialBonuses))

  const loadCharacter = (loadedChar: Char) => {
    // Ensure inventory stats are updated after loading
    loadedChar.updateInventoryStats()
    setChar(loadedChar)
  }

  const effectiveStats = char.getEffectiveStats()
  
  return {
    char, 
    reset,
    loadCharacter,
    level: char.lvl, 
    hp: char.hp, 
    ac: char.ac(), 
    str: effectiveStats.str, 
    dex: effectiveStats.dex, 
    int: effectiveStats.int,
    originalStr: char.str,
    originalDex: char.dex,
    originalInt: char.int,
    shield: char.shield,
    armor: char.armor,
    // Current resource values
    sorcery_points: char.sorcery_points,
    max_sorcery_points: char.max_sorcery_points,
    combat_maneuvers: char.combat_maneuver_points,
    max_combat_maneuvers: char.max_combat_maneuver_points,
    finesse_points: char.finesse_points,
    max_finesse_points: char.max_finesse_points,
    race: char.race,
    abilities: char.abilities,
    abilityManager: char.abilityManager,
    // Level-up functionality
    pending_level_up_points: char.pending_level_up_points,
    start_level_up: () => char.start_level_up(),
    allocate_point: (stat: Stat) => char.allocate_point(stat),
    // Resource management functionality
    spendSorceryPoint: () => char.spendSorceryPoint(),
    spendFinessePoint: () => char.spendFinessePoint(),
    spendCombatManeuverPoint: () => char.spendCombatManeuverPoint(),
    shortRest: () => char.shortRest(),
    longRest: () => char.longRest(),
    // Stat override functionality
    isUsingStatOverrides: char.isUsingStatOverrides(),
    toggleStatOverrides: () => char.toggleStatOverrides(),
    setStatOverride: (stat: Stat, value: number) => char.setStatOverride(stat, value),
    getStatOverride: (stat: Stat) => char.getStatOverride(stat),
  }
}
