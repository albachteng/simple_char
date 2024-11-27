const BASE_AC = 13
const LEVEL_UP_STAT_INCREASE = 2
const ARMOR_STR_REQ = {heavy: 16, medium: 14, light: 12, none: 0}
const HIT_DICE_FROM_MOD = [ 4, 6, 8, 10, 12 ]
const ARMOR_MODS = { "heavy": 3, "medium": 2, "light": 1, none: 0}
const WEAPON_DIE: {[K in Weapon]: number }= {
  "two-hand": 12, 
  "polearm": 10, 
  "one-hand": 8, 
  "finesse": 6,
  "ranged": 6, 
  "staff": 4,  
  "none": 0,
}

type Armor = "heavy" | "medium" | "light" | "none"
type Weapon = "two-hand" | "polearm" | "one-hand" | "finesse" | "ranged" | "staff" | "none"
type Stat = "str" | "dex" | "int"

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

class Char {
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
  sneak_attack: number
  constructor(str: number, dex: number, int: number) {
    this.str = str
    this.dex = dex
    this.int = int
    this.lvl = 1
    this.hp = 10
    this.hp_rolls = [10]
    this.shield = false
    this.armor = "none"
    this.weapon = "none"
    this.roll_hp()
    this.sorcery_points = this.int > 10 ? 1 : 0
    this.sneak_attack = this.dex >= 16 ? 1 : 0
  }

  maneuvers(stat: Stat) {
    if (stat === 'int') {
      return this.sorcery_points
    }
    if (stat === 'dex') {
      return this.sneak_attack
    }
    return mod(this[stat])
  }

  roll_hp() {
    const str_mod = mod(this.str) > 0 ? mod(this.str) : 0
    const hit_dice = HIT_DICE_FROM_MOD[str_mod - 1] || 4
    const curr_roll = Math.ceil(Math.random() * hit_dice) + str_mod + this.lvl
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
    if (this.dex > 16 && this.lvl % 2) {
      this.sneak_attack++
    }
  }

  proficiency() {
    return this.lvl
  }

  equip_shield() {
    if (!isTwoHand(this.weapon)) {
      this.shield = true
    }
  }

  equip_armor(armor: Armor) {
    if (this.str >= ARMOR_STR_REQ[armor]) {
      this.armor = armor
    }
  }

  equip_weapon(weapon: Weapon) {
    if (this.shield) {
      if (!isTwoHand(weapon))
        this.weapon = weapon
    } else {
      this.weapon = weapon
    }
  }

  weapon_attack() {
    return Math.ceil(Math.random() * WEAPON_DIE[this.weapon])
  }

  print() {
    console.log('\n',
      "LVL: ", this.lvl, '\n', 
      "STR:", this.str, "(", mod(this.str), ")", this.maneuvers("str"), "\n",
      "DEX:", this.dex, "(", mod(this.dex), ")", this.maneuvers("dex"), "\n",
      "INT:", this.int, "(", mod(this.int), ")", this.maneuvers("int"), "\n",
      "AC:", this.ac(), "\n",
      "HP:", this.hp, this.hp_rolls, "\n"
    )
  }
}

const c = new Char(10, 16, 6)
c.print()
c.level_up("dex")
c.print()
c.level_up("dex")
c.print()
c.level_up("str")
c.print()
c.level_up("str")
c.print()
c.level_up("str")
c.equip_armor("light")
c.print()
c.level_up("str")
c.equip_armor("medium")
c.print()
c.level_up("str")
c.equip_armor("heavy")
c.print()
c.level_up("int")
c.print()