import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
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
      flavor_text: 'Elves are nimble and have a natural connection to magic.'
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
      description: 'Lucky and quick',
      stat_bonuses: JSON.stringify([
        { stat: 'dex', bonus: 1 },
        { stat: 'int', bonus: 1 }
      ]),
      racial_abilities: [],
      flavor_text: 'Halflings are known for their luck and quick thinking.'
    },
    {
      name: 'gnome',
      description: 'Small but clever',
      stat_bonuses: JSON.stringify([
        { stat: 'int', bonus: 2 }
      ]),
      racial_abilities: [],
      flavor_text: 'Gnomes are small in stature but big in intellect.'
    },
    {
      name: 'dragonborn',
      description: 'Proud and powerful',
      stat_bonuses: JSON.stringify([
        { stat: 'str', bonus: 2 },
        { stat: 'any', bonus: 1 }
      ]),
      racial_abilities: [],
      flavor_text: 'Dragonborn possess the strength and pride of their draconic heritage.'
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
      str_requirement: 13
    },
    {
      name: 'Longsword',
      type: 'weapon',
      subtype: 'one-hand',
      description: 'A versatile one-handed sword',
      base_damage_dice: '1d8',
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      str_requirement: 11
    },
    {
      name: 'Rapier',
      type: 'weapon',
      subtype: 'finesse',
      description: 'A light, thrusting sword',
      base_damage_dice: '1d6',
      valid_slots: JSON.stringify(['main-hand', 'off-hand']),
      dex_requirement: 11
    },
    {
      name: 'Longbow',
      type: 'weapon',
      subtype: 'ranged',
      description: 'A powerful ranged weapon',
      base_damage_dice: '1d8',
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      dex_requirement: 13
    },
    {
      name: 'Staff',
      type: 'weapon',
      subtype: 'staff',
      description: 'A magical focusing staff',
      base_damage_dice: '1d4',
      valid_slots: JSON.stringify(['main-hand']),
      conflicts_with: JSON.stringify(['off-hand', 'shield']),
      int_requirement: 11
    },
    {
      name: 'Leather Armor',
      type: 'armor',
      subtype: 'light',
      description: 'Light, flexible protection',
      base_ac_bonus: 2,
      valid_slots: JSON.stringify(['armor'])
    },
    {
      name: 'Chain Mail',
      type: 'armor',
      subtype: 'medium',
      description: 'Interlocking metal rings',
      base_ac_bonus: 4,
      valid_slots: JSON.stringify(['armor']),
      str_requirement: 11
    },
    {
      name: 'Plate Armor',
      type: 'armor',
      subtype: 'heavy',
      description: 'Full plate protection',
      base_ac_bonus: 6,
      valid_slots: JSON.stringify(['armor']),
      str_requirement: 15
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

  // Insert basic ability templates (metamagic, spellwords, combat maneuvers)
  await knex('ability_templates').insert([
    {
      name: 'Empowered',
      type: 'metamagic',
      description: 'Increase spell damage',
      short_description: '+50% spell damage',
      resource_cost: 1,
      resource_type: 'sorcery',
      source: 'core'
    },
    {
      name: 'Extended',
      type: 'metamagic',
      description: 'Double spell duration',
      short_description: 'x2 duration',
      resource_cost: 1,
      resource_type: 'sorcery',
      source: 'core'
    },
    {
      name: 'Heightened',
      type: 'metamagic',
      description: 'Increase spell level',
      short_description: '+1 spell level',
      resource_cost: 2,
      resource_type: 'sorcery',
      source: 'core'
    },
    {
      name: 'Fire',
      type: 'spellword',
      description: 'Elemental fire magic',
      short_description: 'Fire element',
      resource_cost: 0,
      source: 'core'
    },
    {
      name: 'Ice',
      type: 'spellword',
      description: 'Elemental ice magic',
      short_description: 'Ice element',
      resource_cost: 0,
      source: 'core'
    },
    {
      name: 'Lightning',
      type: 'spellword',
      description: 'Elemental lightning magic',
      short_description: 'Lightning element',
      resource_cost: 0,
      source: 'core'
    },
    {
      name: 'Power Attack',
      type: 'combat_maneuver',
      description: 'Trade accuracy for damage',
      short_description: '-2 attack, +4 damage',
      resource_cost: 1,
      resource_type: 'combat_maneuver',
      source: 'core'
    },
    {
      name: 'Defensive Stance',
      type: 'combat_maneuver',
      description: 'Increase AC at cost of attack',
      short_description: '+2 AC, -2 attack',
      resource_cost: 1,
      resource_type: 'combat_maneuver',
      source: 'core'
    },
    {
      name: 'Cleave',
      type: 'combat_maneuver',
      description: 'Attack multiple adjacent enemies',
      short_description: 'Hit multiple foes',
      resource_cost: 1,
      resource_type: 'combat_maneuver',
      source: 'core'
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