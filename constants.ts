import type {Armor, Weapon, Stat} from './types'

export const SNEAK_ATTACK_DIE = 8
export const BASE_AC = 13
export const LEVEL_UP_STAT_INCREASE = 2
export const ARMOR_STR_REQ = {heavy: 16, medium: 14, light: 12, none: 0}
export const HIT_DICE_FROM_MOD: ReadonlyArray<number> = [ 4, 6, 8, 10, 12 ]

export const ARMOR_MODS: {[K in Armor]: number} = { 
  "heavy": 3, 
  "medium": 2, 
  "light": 1, 
  "none": 0
}

export const WEAPON_DIE: {[K in Weapon]: number }= {
  "two-hand": 12, 
  // "polearm": 10, 
  "one-hand": 8, 
  "finesse": 6,
  "ranged": 6, 
  "staff": 4,  
  "none": 0,
}

export const WEAPON_STAT: {[K in Weapon]: Stat} = {
  "two-hand": "str", 
  // "polearm": "str", 
  "one-hand": "str", 
  "finesse": "dex",
  "ranged": "dex", 
  "staff": "int",  
  "none": "str"
}

export const RACIAL_BONUS = {
  elf: {
	ability: "Treewalk",
	bonus: [{ plus: 2, stat: "dex"}]
  },
  gnome: {
	ability: "Tinker",
	bonus: [{ plus: 2, stat: "int"}],
  },
  human: {
	ability: "Contract", 
	bonus: [{ plus: 1, stat: "any"}, { plus: 1, stat: "any"}],
  },
  dwarf: {
	ability: "Stonesense", 
	bonus: [{plus: 2, stat: "str"}],
  },
  dragonborn: {
	ability: "Flametongue", 
	bonus: [{plus: 2, stat: "str"}],
  },
  halfling: {
	ability: "Lucky", 
	bonus: [{plus: 1, stat: "dex"}, {plus: 1, stat: "int"}],
  }
};
