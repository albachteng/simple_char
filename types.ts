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

export type EquipmentSlot = 'main-hand' | 'off-hand' | 'armor' | 'shield'

export interface InventoryItem {
  id: string
  name: string
  type: ItemType
  equipped: boolean
  equipmentSlot?: EquipmentSlot  // Which slot the item is equipped in
  enchantmentLevel: EnchantmentLevel
  description?: string
  statBonuses?: StatBonus[]
  maneuverBonuses?: ManeuverBonus[]
  abilities?: string[]
  // Base properties for weapons/armor/shields
  weaponType?: Weapon
  armorType?: Armor
  isShield?: boolean
  
  // Database template fields (for enhanced items from database)
  subtype?: string
  enchantment?: number
  ac_bonus?: number
  attack_bonus?: number
  damage_dice?: string
  str_bonus?: number
  dex_bonus?: number
  int_bonus?: number
  str_requirement?: number
  dex_requirement?: number
  int_requirement?: number
  valid_slots?: string[]
  conflicts_with?: string[]
  source?: 'local' | 'database'
  template_id?: number
}

export interface CharacterInventory {
  items: InventoryItem[]
  maxItems?: number
}