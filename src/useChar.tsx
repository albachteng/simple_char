import type { Armor, Weapon, Stat, Race } from '../types'
import mitt from "mitt";
import { 
  ARMOR_MODS, 
  ARMOR_STR_REQ, 
  BASE_AC, 
  HIT_DICE_FROM_MOD, 
  LEVEL_UP_STAT_INCREASE,  
  SNEAK_ATTACK_DIE,
  WEAPON_DIE,
  WEAPON_STAT,
  RACIAL_BONUS
} from '../constants'
import { useEffect, useState } from 'react'
import { logger } from './logger'

function isTwoHand(weapon: Weapon) {
  return (
    weapon === 'two-hand' || 
    // weapon === 'polearm' || 
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
  shield: boolean
  armor: Armor
  weapon: Weapon
  sorcery_points: number
  finesse_points: number
  race: Race | null
  abilities: string[]
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
    this.shield = false
    this.armor = "none"
    this.weapon = "none"
    
    logger.charCreation(`Rolling initial HP for level 1`)
    this.roll_hp()
    
    this.sorcery_points = this?.int > 10 ? 3 : 0
    this.finesse_points = this?.dex >= 16 ? 1 : 0
    
    logger.charCreation(`Character created successfully`, {
      race: this.race,
      abilities: this.abilities,
      level: this.lvl,
      hp: this.hp,
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
    // const curr_roll = Math.ceil(Math.random() * hit_dice) + str_mod
    const curr_roll = (hit_dice/2) + str_mod
    const final_roll = curr_roll || 1
    
    logger.hpCalculation(`Rolling HP for level ${this.lvl}`, {
      str: this.str,
      str_mod,
      hit_dice,
      base_roll: hit_dice/2,
      str_bonus: str_mod,
      total_roll: curr_roll,
      final_roll,
      previous_hp: this.hp
    })
    
    this.hp_rolls.push(final_roll)
    this.hp += final_roll
    
    logger.hpCalculation(`HP updated`, { new_hp: this.hp, hp_rolls: this.hp_rolls })
  }

  hide() {
    const factor = (this.dex >= 16 && this.armor !== 'heavy') ? 2 : 1;
    Math.ceil(Math.random() * 20) + mod(this.dex) + (this.lvl * factor);
  }

  ac() {
    const armor_mod = ARMOR_MODS[this.armor] || 0
    const dex_mod = mod(this.dex)
    const shield_bonus = Number(this.shield)
    const total_ac = BASE_AC + dex_mod + armor_mod + shield_bonus
    
    logger.acCalculation(`Calculating AC`, {
      base_ac: BASE_AC,
      dex: this.dex,
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
    this.roll_hp()
    
    if (this.int > 10) {
      this.sorcery_points++ 
      logger.levelUp(`Gained sorcery point (INT > 10)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.int > 14) {
      this.sorcery_points++
      logger.levelUp(`Gained additional sorcery point (INT > 14)`, { int: this.int, sorcery_points: this.sorcery_points })
    }
    if (this.dex >= 16 && this.lvl % 2) {
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

  proficiency() {
    return this.lvl
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
        logger.equipment(`${weapon} weapon equipped successfully (with shield)`)
      } else {
        logger.equipment(`Cannot equip ${weapon} weapon - two-handed weapon conflicts with shield`)
      }
    } else {
      this.weapon = weapon
      logger.equipment(`${weapon} weapon equipped successfully`)
    }
    
    this.emitter.emit("update")
  }

  weapon_attack() {
    const weapon_stat = WEAPON_STAT[this.weapon]
    const stat_mod = mod(this[weapon_stat])
    const dmg_mod = stat_mod + this.lvl
    const attacks = 2
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
      // total += Math.ceil(Math.random() * weapon_die);
      const die_roll = weapon_die/2
      total += die_roll
      total += dmg_mod 
      
      logger.combat(`Attack ${i + 1}`, {
        die_roll,
        dmg_mod,
        attack_total: die_roll + dmg_mod,
        running_total: total
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
      // total += Math.ceil(Math.random() * SNEAK_ATTACK_DIE);
      const sneak_die = SNEAK_ATTACK_DIE/2
      total += sneak_die
      
      logger.combat(`Sneak attack die ${i + 1}`, {
        die_roll: sneak_die,
        die_size: SNEAK_ATTACK_DIE,
        running_total: total
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
  const [, setTrigger] = useState(0); 

  useEffect(() => {
    const handleUpdate = () => setTrigger((prev) => prev + 1)
    char.on("update", handleUpdate);

    return () => {
      char.off("update", handleUpdate); 
    };
  }, [char]);

  const reset = (high: Stat, mid: Stat, race: Race | null = null, racialBonuses: Stat[] = []) => 
    setChar(new Char(high, mid, race, racialBonuses))

  return {
    char, 
    reset,
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
