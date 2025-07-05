export type Armor = "heavy" | "medium" | "light" | "none"
export type Weapon = "two-hand" | "one-hand" | "finesse" | "ranged" | "staff" | "none"
export type Stat = "str" | "dex" | "int"
export type Race = "elf" | "gnome" | "human" | "dwarf" | "dragonborn" | "halfling"

export interface RacialBonus {
  plus: number
  stat: Stat | "any"
}

export interface RaceData {
  ability: string
  bonus: RacialBonus[]
}