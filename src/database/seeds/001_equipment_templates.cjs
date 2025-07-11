/**
 * Seeds equipment_templates table with base weapons, armor, and shields
 * Based on data from src/inventory/InventoryConstants.ts
 */

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('equipment_templates').del();

  // Constants from constants.ts
  const WEAPON_DIE = {
    "two-hand": 12, 
    "one-hand": 8, 
    "finesse": 6,
    "ranged": 6, 
    "staff": 4,  
    "none": 1,
  };

  const WEAPON_STAT = {
    "two-hand": "str", 
    "one-hand": "str", 
    "finesse": "dex",
    "ranged": "dex", 
    "staff": "int",  
    "none": "str"
  };

  const ARMOR_MODS = { 
    "heavy": 3, 
    "medium": 2, 
    "light": 1, 
    "none": 0
  };

  const SHIELD_AC = 2;

  // Helper functions for descriptions
  function generateWeaponDescription(weaponType) {
    if (weaponType === 'none') return 'No weapon equipped';
    
    const die = WEAPON_DIE[weaponType];
    const stat = WEAPON_STAT[weaponType];
    
    const isOneHanded = weaponType === 'one-hand' || weaponType === 'finesse';
    const isTwoHanded = weaponType === 'two-hand' || weaponType === 'ranged';
    
    const handling = isOneHanded ? 'one-handed' : isTwoHanded ? 'two-handed' : 'weapon';
    const statName = stat === 'str' ? 'strength' : stat === 'dex' ? 'dexterity' : 'intelligence';
    const weaponCategory = weaponType === 'ranged' ? 'ranged weapon' : 
                          weaponType === 'staff' ? 'magical focus' : 'melee weapon';
    
    return `A ${handling}, ${statName}-based ${weaponCategory} that deals 1d${die} damage`;
  }

  function generateArmorDescription(armorType) {
    if (armorType === 'none') return 'No armor equipped';
    const armorMod = ARMOR_MODS[armorType];
    return `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} armor that provides +${armorMod} AC`;
  }

  // Base weapons data
  const weapons = [
    {
      name: 'Greatsword',
      type: 'weapon',
      subtype: 'two-hand',
      description: generateWeaponDescription('two-hand'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['two-hand']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      is_active: true
    },
    {
      name: 'Longsword',
      type: 'weapon',
      subtype: 'one-hand',
      description: generateWeaponDescription('one-hand'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['one-hand']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Rapier',
      type: 'weapon',
      subtype: 'finesse',
      description: generateWeaponDescription('finesse'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['finesse']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Longbow',
      type: 'weapon',
      subtype: 'ranged',
      description: generateWeaponDescription('ranged'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['ranged']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      is_active: true
    },
    {
      name: 'Staff',
      type: 'weapon',
      subtype: 'staff',
      description: generateWeaponDescription('staff'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['staff']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      is_active: true
    },
    {
      name: 'Dagger',
      type: 'weapon',
      subtype: 'finesse',
      description: generateWeaponDescription('finesse'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['finesse']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Warhammer',
      type: 'weapon',
      subtype: 'one-hand',
      description: generateWeaponDescription('one-hand'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['one-hand']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Crossbow',
      type: 'weapon',
      subtype: 'ranged',
      description: generateWeaponDescription('ranged'),
      base_ac_bonus: 0,
      base_attack_bonus: 0,
      base_damage_dice: `1d${WEAPON_DIE['ranged']}`,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      is_active: true
    }
  ];

  // Base armor data
  const armor = [
    {
      name: 'Plate Armor',
      type: 'armor',
      subtype: 'heavy',
      description: generateArmorDescription('heavy'),
      base_ac_bonus: ARMOR_MODS['heavy'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 16,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Chain Mail',
      type: 'armor',
      subtype: 'medium',
      description: generateArmorDescription('medium'),
      base_ac_bonus: ARMOR_MODS['medium'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 14,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Leather Armor',
      type: 'armor',
      subtype: 'light',
      description: generateArmorDescription('light'),
      base_ac_bonus: ARMOR_MODS['light'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 12,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Studded Leather',
      type: 'armor',
      subtype: 'light',
      description: generateArmorDescription('light'),
      base_ac_bonus: ARMOR_MODS['light'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 12,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Scale Mail',
      type: 'armor',
      subtype: 'medium',
      description: generateArmorDescription('medium'),
      base_ac_bonus: ARMOR_MODS['medium'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 14,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    },
    {
      name: 'Splint Armor',
      type: 'armor',
      subtype: 'heavy',
      description: generateArmorDescription('heavy'),
      base_ac_bonus: ARMOR_MODS['heavy'],
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 16,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['armor']),
      conflicts_with: JSON.stringify([]),
      is_active: true
    }
  ];

  // Base shield data
  const shields = [
    {
      name: 'Wooden Shield',
      type: 'shield',
      subtype: 'light',
      description: `A shield that provides +${SHIELD_AC} AC when equipped`,
      base_ac_bonus: SHIELD_AC,
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['shield']),
      conflicts_with: JSON.stringify(['off-hand']),
      is_active: true
    },
    {
      name: 'Metal Shield',
      type: 'shield',
      subtype: 'medium',
      description: `A shield that provides +${SHIELD_AC} AC when equipped`,
      base_ac_bonus: SHIELD_AC,
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['shield']),
      conflicts_with: JSON.stringify(['off-hand']),
      is_active: true
    },
    {
      name: 'Tower Shield',
      type: 'shield',
      subtype: 'heavy',
      description: `A shield that provides +${SHIELD_AC} AC when equipped`,
      base_ac_bonus: SHIELD_AC,
      base_attack_bonus: 0,
      base_damage_dice: null,
      str_requirement: 0,
      dex_requirement: 0,
      int_requirement: 0,
      valid_slots: JSON.stringify(['shield']),
      conflicts_with: JSON.stringify(['off-hand']),
      is_active: true
    }
  ];

  // Combine all equipment
  const allEquipment = [...weapons, ...armor, ...shields];

  // Insert equipment templates
  await knex('equipment_templates').insert(allEquipment);

  console.log(`Seeded ${allEquipment.length} equipment templates:`)
  console.log(`  - ${weapons.length} weapons`)
  console.log(`  - ${armor.length} armor pieces`)
  console.log(`  - ${shields.length} shields`)
};