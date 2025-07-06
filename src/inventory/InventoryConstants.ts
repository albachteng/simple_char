import type { InventoryItem, Weapon, Armor } from '../../types'
import { WEAPON_DIE, WEAPON_STAT, ARMOR_MODS, SHIELD_AC } from '../../constants'

// Description generation functions
function generateWeaponDescription(weaponType: Weapon): string {
  if (weaponType === 'none') return 'No weapon equipped'
  
  const die = WEAPON_DIE[weaponType]
  const stat = WEAPON_STAT[weaponType]
  
  // Determine weapon handling
  const isOneHanded = weaponType === 'one-hand' || weaponType === 'finesse'
  const isTwoHanded = weaponType === 'two-hand' || weaponType === 'ranged'
  
  const handling = isOneHanded ? 'one-handed' : isTwoHanded ? 'two-handed' : 'weapon'
  const statName = stat === 'str' ? 'strength' : stat === 'dex' ? 'dexterity' : 'intelligence'
  const weaponCategory = weaponType === 'ranged' ? 'ranged weapon' : 
                        weaponType === 'staff' ? 'magical focus' : 'melee weapon'
  
  return `A ${handling}, ${statName}-based ${weaponCategory} that deals 1d${die} damage`
}

function generateArmorDescription(armorType: Armor): string {
  if (armorType === 'none') return 'No armor equipped'
  
  const armorMod = ARMOR_MODS[armorType]
  
  return `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} armor that provides +${armorMod} AC`
}

function generateShieldDescription(): string {
  return `A shield that provides +${SHIELD_AC} AC when equipped`;
}

// Base weapon items
export const BASE_WEAPONS: Omit<InventoryItem, 'id' | 'equipped'>[] = [
  {
    name: 'Greatsword',
    type: 'weapon',
    weaponType: 'two-hand',
    enchantmentLevel: 0,
    description: generateWeaponDescription('two-hand')
  },
  {
    name: 'Longsword',
    type: 'weapon',
    weaponType: 'one-hand',
    enchantmentLevel: 0,
    description: generateWeaponDescription('one-hand')
  },
  {
    name: 'Rapier',
    type: 'weapon',
    weaponType: 'finesse',
    enchantmentLevel: 0,
    description: generateWeaponDescription('finesse')
  },
  {
    name: 'Longbow',
    type: 'weapon',
    weaponType: 'ranged',
    enchantmentLevel: 0,
    description: generateWeaponDescription('ranged')
  },
  {
    name: 'Staff',
    type: 'weapon',
    weaponType: 'staff',
    enchantmentLevel: 0,
    description: generateWeaponDescription('staff')
  },
  {
    name: 'Dagger',
    type: 'weapon',
    weaponType: 'finesse',
    enchantmentLevel: 0,
    description: generateWeaponDescription('finesse')
  },
  {
    name: 'Warhammer',
    type: 'weapon',
    weaponType: 'one-hand',
    enchantmentLevel: 0,
    description: generateWeaponDescription('one-hand')
  },
  {
    name: 'Crossbow',
    type: 'weapon',
    weaponType: 'ranged',
    enchantmentLevel: 0,
    description: generateWeaponDescription('ranged')
  }
]

// Base armor items
export const BASE_ARMOR: Omit<InventoryItem, 'id' | 'equipped'>[] = [
  {
    name: 'Plate Armor',
    type: 'armor',
    armorType: 'heavy',
    enchantmentLevel: 0,
    description: generateArmorDescription('heavy')
  },
  {
    name: 'Chain Mail',
    type: 'armor',
    armorType: 'medium',
    enchantmentLevel: 0,
    description: generateArmorDescription('medium')
  },
  {
    name: 'Leather Armor',
    type: 'armor',
    armorType: 'light',
    enchantmentLevel: 0,
    description: generateArmorDescription('light')
  },
  {
    name: 'Studded Leather',
    type: 'armor',
    armorType: 'light',
    enchantmentLevel: 0,
    description: generateArmorDescription('light')
  },
  {
    name: 'Scale Mail',
    type: 'armor',
    armorType: 'medium',
    enchantmentLevel: 0,
    description: generateArmorDescription('medium')
  },
  {
    name: 'Splint Armor',
    type: 'armor',
    armorType: 'heavy',
    enchantmentLevel: 0,
    description: generateArmorDescription('heavy')
  }
]

// Base shield items
export const BASE_SHIELDS: Omit<InventoryItem, 'id' | 'equipped'>[] = [
  {
    name: 'Wooden Shield',
    type: 'shield',
    isShield: true,
    enchantmentLevel: 0,
    description: generateShieldDescription()
  },
  {
    name: 'Metal Shield',
    type: 'shield',
    isShield: true,
    enchantmentLevel: 0,
    description: generateShieldDescription()
  },
  {
    name: 'Tower Shield',
    type: 'shield',
    isShield: true,
    enchantmentLevel: 0,
    description: generateShieldDescription()
  }
]

// Combined base items
export const BASE_ITEMS = [
  ...BASE_WEAPONS,
  ...BASE_ARMOR,
  ...BASE_SHIELDS
]

// Helper function to create item with unique ID
export function createInventoryItem(baseItem: Omit<InventoryItem, 'id' | 'equipped'>): InventoryItem {
  return {
    ...baseItem,
    id: crypto.randomUUID(),
    equipped: false
  }
}

// Export description generators for use with enchanted items
export { generateWeaponDescription, generateArmorDescription, generateShieldDescription }
