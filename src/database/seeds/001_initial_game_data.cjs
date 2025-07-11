import pkg from 'knex';
const { Knex } = pkg;

export async function seed(knex) {
  // Clear existing data
  await knex('races').del();
  await knex('equipment_templates').del();
  await knex('ability_templates').del();
  await knex('application_settings').del();

  // Insert races (from constants.ts)
  await knex('races').insert([
    {
      name: 'human',
      description: 'Versatile and adaptable',
      stat_bonuses: JSON.stringify([
        { stat: 'any', bonus: 1 },
        { stat: 'any', bonus: 1 }
      ]),
      racial_abilities: [],
      flavor_text: 'Humans are known for their versatility and determination.'
    },
    {
      name: 'elf',
      description: 'Graceful and magical',
      stat_bonuses: JSON.stringify([
        { stat: 'dex', bonus: 2 }
      ]),
      racial_abilities: [],
      flavor_text: 'Elves are dextrous and have a strong connection to the natural world.'
    },
    {
      name: 'dwarf',
      description: 'Sturdy and resilient',
      stat_bonuses: JSON.stringify([
        { stat: 'str', bonus: 2 }
      ]),
      racial_abilities: [],
      flavor_text: 'Dwarves are renowned for their strength and endurance.'
    },
    {
      name: 'halfling',
      description: 'Quick and furtive',
      stat_bonuses: JSON.stringify([
        { stat: 'dex', bonus: 1 },
        { stat: 'int', bonus: 1 }
      ]),
      racial_abilities: [],
      flavor_text: 'Halflings are known for their uncanny luck and quick thinking.'
    },
    {
      name: 'gnome',
      description: 'Insightful and precise',
      stat_bonuses: JSON.stringify([
        { stat: 'int', bonus: 2 }
      ]),
      racial_abilities: [],
      flavor_text: 'Gnomes are known for their force of mind and magical experimentation.'
    },
    {
      name: 'dragonborn',
      description: 'Proud and powerful',
      stat_bonuses: JSON.stringify([
        { stat: 'any', bonus: 2 },
      ]),
      racial_abilities: [],
      flavor_text: 'Dragonborn are paragons of their chosen domain, disciplined and determined.'
    }
  ]);

  // Insert basic equipment templates
  await knex('equipment_templates').insert([
    {
      name: 'Greatsword',
      type: 'weapon',
      subtype: 'two-hand',
      description: 'A large two-handed sword',
      base_damage_dice: '1d12',
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
    },
    {
      name: 'Longsword',
      type: 'weapon',
      subtype: 'one-hand',
      description: 'A versatile one-handed sword',
      base_damage_dice: '1d8',
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
    },
    {
      name: 'Rapier',
      type: 'weapon',
      subtype: 'finesse',
      description: 'A light, thrusting sword',
      base_damage_dice: '1d6',
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
    },
    {
      name: 'Longbow',
      type: 'weapon',
      subtype: 'ranged',
      description: 'A powerful ranged weapon',
      base_damage_dice: '1d6',
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
    },
    {
      name: 'Staff',
      type: 'weapon',
      subtype: 'staff',
      description: 'A magical focusing staff',
      base_damage_dice: '1d4',
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
    },
    {
      name: 'Leather Armor',
      type: 'armor',
      subtype: 'light',
      description: 'Light, flexible protection',
      base_ac_bonus: 1,
      valid_slots: JSON.stringify(['armor'])
    },
    {
      name: 'Chain Mail',
      type: 'armor',
      subtype: 'medium',
      description: 'Interlocking metal rings',
      base_ac_bonus: 2,
      valid_slots: JSON.stringify(['armor']),
    },
    {
      name: 'Plate Armor',
      type: 'armor',
      subtype: 'heavy',
      description: 'Full plate protection',
      base_ac_bonus: 3,
      valid_slots: JSON.stringify(['armor']),
    },
    {
      name: 'Shield',
      type: 'shield',
      description: 'A protective shield',
      base_ac_bonus: 2,
      valid_slots: JSON.stringify(['shield']),
      conflicts_with: JSON.stringify(['off-hand'])
    }
  ]);

  // Insert basic application settings
  await knex('application_settings').insert([
    {
      key: 'app_version',
      value: '1.0.0',
      value_type: 'string',
      description: 'Current application version'
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      value_type: 'boolean',
      description: 'Whether the application is in maintenance mode'
    },
    {
      key: 'max_characters_per_user',
      value: '50',
      value_type: 'number',
      description: 'Maximum number of characters a user can create',
      is_user_configurable: false
    },
    {
      key: 'enable_debug_logging',
      value: 'false',
      value_type: 'boolean',
      description: 'Enable debug level logging',
      is_user_configurable: false
    }
  ]);
}
