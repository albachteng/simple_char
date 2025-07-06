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

function isTwoHand(weapon: Weapon) {
  return (
    weapon === 'two-hand' || 
    weapon === 'staff' || 
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
  shield: boolean
  armor: Armor
  weapon: Weapon
  sorcery_points: number
  finesse_points: number
  race: Race | null
  abilities: string[]
  inventory: InventoryManager
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
    this.shield = false
    this.armor = "none"
    this.weapon = "none"
    
    // Initialize inventory
    this.inventory = new InventoryManager()
    
    logger.charCreation(`Rolling initial HP for level 1`)
    this.roll_hp()
    
    this.sorcery_points = this?.int > 10 ? 3 : 0
    this.finesse_points = this?.dex >= 16 ? 1 : 0
    
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

  maneuvers(stat: Stat) {
    let result: number
    
    if (stat === 'int') {
      result = this.sorcery_points
      logger.maneuvers(`INT maneuvers: sorcery points`, { 
        stat, 
        int: this.int, 
        sorcery_points: this.sorcery_points,
        result 
      })
    } else if (stat === 'dex') {
      result = this.finesse_points
      logger.maneuvers(`DEX maneuvers: finesse points`, { 
        stat, 
        dex: this.dex, 
        finesse_points: this.finesse_points,
        result 
      })
    } else {
      result = this.str >= 16 ? this.lvl : 0
      logger.maneuvers(`STR maneuvers: combat maneuvers`, { 
        stat, 
        str: this.str, 
        level: this.lvl,
        str_meets_req: this.str >= 16,
        result 
      })
    }
    
    return result
  }

  roll_hp() {
    const str_mod = mod(this.str) > 0 ? mod(this.str) : 0
    const hit_dice = HIT_DICE_FROM_MOD[str_mod - 1] || 4
    const hp_roll = DiceSettings.rollOrAverage(1, hit_dice, str_mod)
    const final_roll = hp_roll || 1
    
    logger.hpCalculation(`Rolling HP for level ${this.lvl}`, {
      str: this.str,
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
    const factor = (this.dex >= 16 && this.armor !== 'heavy') ? 2 : 1;
    const dex_mod = mod(this.dex)
    const level_bonus = this.lvl * factor
    const hide_roll = DiceSettings.rollOrAverage(1, 20, dex_mod + level_bonus)
    
    logger.combat(`Hide roll`, {
      dex: this.dex,
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
    const armor_mod = ARMOR_MODS[this.armor] || 0
    const equippedBonuses = this.getEquippedStatBonuses()
    const dex_mod = mod(this.dex + equippedBonuses.dex)
    const shield_bonus = Number(this.shield) * SHIELD_AC;
    const total_ac = BASE_AC + dex_mod + armor_mod + shield_bonus
    
    logger.acCalculation(`Calculating AC`, {
      base_ac: BASE_AC,
      dex: this.dex,
      dex_equipment_bonus: equippedBonuses.dex,
      effective_dex: this.dex + equippedBonuses.dex,
      dex_mod,
      armor: this.armor,
      armor_mod,
      shield: this.shield,
      shield_bonus,
      total_ac
    })
    
    return total_ac
  }

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
    
    if (this.int >= MIN_SPELLCASTING_INT) {
      this.sorcery_points++ 
      logger.levelUp(`Gained sorcery point (INT > 10)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.int > DBL_SPELLCASTING_INT) {
      this.sorcery_points++
      logger.levelUp(`Gained additional sorcery point (INT > 14)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.dex >= MIN_FINESSE_DEX && this.lvl % 2) {
      this.finesse_points++
      logger.levelUp(`Gained finesse point (DEX >= 16 and odd level)`, { 
        dex: this.dex, 
        level: this.lvl, 
        finesse_points: this.finesse_points 
      })
    }
    
    logger.levelUp(`Level up complete`, {
      stat: choice,
      old_stats: { [choice]: old_stat, level: old_level, sorcery_points: old_sorcery, finesse_points: old_finesse },
      new_stats: { [choice]: this[choice], level: this.lvl, sorcery_points: this.sorcery_points, finesse_points: this.finesse_points }
    })
    
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
    const str_req = ARMOR_STR_REQ[armor]
    const canEquip = this.str >= str_req
    
    logger.equipment(`Attempting to equip ${armor} armor`, {
      armor,
      str_requirement: str_req,
      current_str: this.str,
      can_equip: canEquip,
      current_armor: this.armor
    })
    
    if (canEquip) {
      this.armor = armor
      this.syncEquipmentFromInventory()
      logger.equipment(`${armor} armor equipped successfully`)
    } else {
      logger.equipment(`Cannot equip ${armor} armor - insufficient STR (need ${str_req}, have ${this.str})`)
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

  weapon_attack() {
    const weapon_stat = WEAPON_STAT[this.weapon]
    const stat_mod = mod(this[weapon_stat])
    const dmg_mod = stat_mod + this.lvl
    const attacks = BASE_ATTACKS;
    const weapon_die = WEAPON_DIE[this.weapon]
    let total = 0
    
    logger.combat(`Starting weapon attack with ${this.weapon}`, {
      weapon: this.weapon,
      weapon_stat,
      stat_value: this[weapon_stat],
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
    setChar(loadedChar)
  }

  return {
    char, 
    reset,
    loadCharacter,
    level: char.lvl, 
    hp: char.hp, 
    ac: char.ac(), 
    str: char.str, 
    dex: char.dex, 
    int: char.int,
    shield: char.shield,
    armor: char.armor,
    sorcery_points: char.sorcery_points,
    combat_maneuvers: char.str >= 16 ? char.lvl : 0,
    finesse_points: char.finesse_points,
    race: char.race,
    abilities: char.abilities,
  }
}
