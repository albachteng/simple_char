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

// Inventory System Types
export type ItemType = "weapon" | "armor" | "shield" | "accessory"
export type EnchantmentLevel = 0 | 1 | 2 | 3

export interface StatBonus {
  stat: Stat
  bonus: number
}

export interface ManeuverBonus {
  type: "combat" | "finesse" | "sorcery"
  bonus: number
}

export interface InventoryItem {
  id: string
  name: string
  type: ItemType
  equipped: boolean
  enchantmentLevel: EnchantmentLevel
  description?: string
  statBonuses?: StatBonus[]
  maneuverBonuses?: ManeuverBonus[]
  abilities?: string[]
  // Base properties for weapons/armor/shields
  weaponType?: Weapon
  armorType?: Armor
  isShield?: boolean
}

export interface CharacterInventory {
  items: InventoryItem[]
  maxItems?: number
}