import type {Armor, Weapon, Stat} from './types'

export const SNEAK_ATTACK_DIE = 8
export const BASE_AC = 13
export const BASE_ATTACKS = 2
export const LEVEL_UP_STAT_INCREASE = 2
export const ARMOR_STR_REQ = {heavy: 16, medium: 14, light: 12, none: -Infinity}
export const HIT_DICE_FROM_MOD: ReadonlyArray<number> = [ 4, 6, 8, 10, 12 ]
export const MIN_SPELLCASTING_INT = 11;
export const DBL_SPELLCASTING_INT = 14;
export const MIN_FINESSE_DEX = 16;
export const MIN_MANEUVER_STR = 16;
export const SPELL_CONTEST_TARGET = 25;
export const SHIELD_AC = 2;

export const ARMOR_MODS: {[K in Armor]: number} = { 
  "heavy": 3, 
  "medium": 2, 
  "light": 1, 
  "none": 0
}

export const WEAPON_DIE: {[K in Weapon]: number }= {
  "two-hand": 12, 
  "one-hand": 8, 
  "finesse": 6,
  "ranged": 6, 
  "staff": 4,  
  "none": 1,
}

export const WEAPON_STAT: {[K in Weapon]: Stat} = {
  "two-hand": "str", 
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
	bonus: [{plus: 2, stat: "any"}],
  },
  halfling: {
	ability: "Lucky", 
	bonus: [{plus: 1, stat: "dex"}, {plus: 1, stat: "int"}],
  }
};

export const METAMAGIC = ['Aura', 'Cascade', 'Cloak', 'Distant', 'Empowered', 'Glyph', 'Grasp', 'Heighten', 'Hypnotic', 'Orb', 'Orbit', 'Precise', 'Quick', 'Sculpt', 'Subtle', 'Twin', 'Wall'];
export const SPELLWORDS = ['Chill', 'Confound', 'Counterspell', 'Deafen', 'Flametongue', 'Growth', 'Heat', 'Illusion', 'Light', 'Mend', 'Push/Pull', 'Rain', 'Reflect', 'Shadow', 'Shield', 'Soothe', 'Spark', 'Thread', 'Vision'];
export const COMBAT_MANEUVERS =  ['Blinding', 'Cleave', 'Command', 'Daring', 'Disarming', 'Enraged', 'Goading', 'Grappling', 'Leaping', 'Menace', 'Precision', 'Preparation', 'Reckless', 'Riposte', 'Stampede', 'Throw', 'Trip'];
