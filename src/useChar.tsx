import type { Armor, Weapon, Stat } from '../types'
import mitt from "mitt";
import { 
  ARMOR_MODS, 
  ARMOR_STR_REQ, 
  ATTACKS_PER_LEVEL, 
  BASE_AC, 
  HIT_DICE_FROM_MOD, 
  LEVEL_UP_STAT_INCREASE,  
  SNEAK_ATTACK_DIE,
  WEAPON_DIE,
  WEAPON_STAT
} from '../constants'
import { useEffect, useState } from 'react'

function isTwoHand(weapon: Weapon) {
  return (
    weapon === 'two-hand' || 
    weapon === 'polearm' || 
    weapon === 'staff' || 
    weapon === 'ranged' 
  )
}

export function mod(stat: number) {
  return Math.floor((stat - 10) / 2)
}

function dc(lvl: number, mod: number) {
  return 8 + lvl + mod
}

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
  constructor(high: Stat, med: Stat) {
    this.str = "str" === high ? 16 : ("str" === med) ? 10 : 6 
    this.dex = "dex" === high ? 16 : ("dex" === med) ? 10 : 6 
    this.int = "int" === high ? 16 : ("int" === med) ? 10 : 6 
    this.lvl = 1
    this.hp = 10
    this.hp_rolls = [10]
    this.shield = false
    this.armor = "none"
    this.weapon = "none"
    this.roll_hp()
    this.sorcery_points = this?.int > 10 ? 3 : 0
    this.finesse_points = this?.dex >= 16 ? 1 : 0
  }

  maneuvers(stat: Stat) {
    if (stat === 'int') {
      return this.sorcery_points
    }
    if (stat === 'dex') {
      return this.finesse_points
    }
    return mod(this[stat])
  }

  roll_hp() {
    const str_mod = mod(this.str) > 0 ? mod(this.str) : 0
    const hit_dice = HIT_DICE_FROM_MOD[str_mod - 1] || 4
    // const curr_roll = Math.ceil(Math.random() * hit_dice) + str_mod
    const curr_roll = (hit_dice/2) + str_mod
    this.hp_rolls.push(curr_roll || 1)
    this.hp += curr_roll;
  }

  hide() {
    const factor = (this.dex >= 16 && this.armor !== 'heavy') ? 2 : 1
    Math.ceil(Math.random() * 20) + (mod(this.dex) * factor) + this.lvl
  }

  ac() {
    const armor_mod = ARMOR_MODS[this.armor] || 0
    return BASE_AC + mod(this.dex) + armor_mod + Number(this.shield)
  }

  level_up(choice: Stat) {
    this[choice] += LEVEL_UP_STAT_INCREASE
    this.lvl += 1
    this.roll_hp()
    if (this.int > 10) {
      this.sorcery_points++ 
    }
    if (this.int > 14) {
      this.sorcery_points++
    }
    if (this.dex >= 16 && this.lvl % 2) {
      this.finesse_points++
    }
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
    if (!isTwoHand(this.weapon)) {
      this.shield = true
    }
    this.emitter.emit("update")
  }

  equip_armor(armor: Armor) {
    if (this.str >= ARMOR_STR_REQ[armor]) {
      this.armor = armor
    }
    this.emitter.emit("update")
  }

  equip_weapon(weapon: Weapon) {
    if (this.shield) {
      if (!isTwoHand(weapon))
        this.weapon = weapon
    } else {
      this.weapon = weapon
    }
    this.emitter.emit("update")
  }

  weapon_attack() {
    const dmg_mod = mod(this[WEAPON_STAT[this.weapon]])
    const attacks = ATTACKS_PER_LEVEL[this.lvl - 1]
    let total = 0;
    for (let i = 0; i < attacks; i++) {
      // total += Math.ceil(Math.random() * WEAPON_DIE[this.weapon]);
      total += WEAPON_DIE[this.weapon]/2;
      total += dmg_mod 
    }
    this.emitter.emit("update")
    return total;
  }

  sneak_attack() {
    let total = this.weapon_attack()
    for (let i = 0; i < this.finesse_points; i++){
      // total += Math.ceil(Math.random() * SNEAK_ATTACK_DIE);
      total += SNEAK_ATTACK_DIE/2;
    }
    this.emitter.emit("update")
    return total;
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
  const [, setTrigger] = useState(0); // dumb

  useEffect(() => {
    const handleUpdate = () => setTrigger((prev) => prev + 1)
    char.on("update", handleUpdate);

    return () => {
      char.off("update", handleUpdate); // cleanup on unmount
    };
  }, [char]);

  const reset = (high: Stat, mid: Stat) => setChar(new Char(high, mid))

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
    combat_maneuvers: mod(char.str),
    finesse_points: char.finesse_points,
  }
}