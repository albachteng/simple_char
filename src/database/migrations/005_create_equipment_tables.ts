import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Equipment templates (seeded data)
  await knex.schema.createTable('equipment_templates', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('type', 20).notNullable().checkIn(['weapon', 'armor', 'shield', 'accessory']);
    table.string('subtype', 50); // weapon_type, armor_type, etc.
    table.text('description');
    table.text('flavor_text');
    
    // Base requirements
    table.integer('str_requirement').defaultTo(0);
    table.integer('dex_requirement').defaultTo(0);
    table.integer('int_requirement').defaultTo(0);
    
    // Base item properties (can be overridden by enchantments)
    table.integer('base_ac_bonus').defaultTo(0);
    table.integer('base_attack_bonus').defaultTo(0);
    table.string('base_damage_dice', 10); // "1d8", "2d6", etc.
    
    // Equipment slot restrictions
    table.specificType('valid_slots', 'text[]'); // ['main-hand', 'off-hand'] for weapons
    table.specificType('conflicts_with', 'text[]'); // Equipment slots that conflict
    
    // Metadata
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('created_by').references('id').inTable('users');

    // Indexes
    table.index(['type']);
    table.index(['subtype']);
    table.index(['is_active']);
  });

  // Equipment abilities (seeded data - can be attached to equipment)
  await knex.schema.createTable('equipment_abilities', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.text('description').notNullable();
    table.string('ability_type', 50).notNullable(); // 'passive', 'active', 'triggered'
    table.string('trigger_condition', 100); // 'on_equip', 'on_attack', 'per_day', etc.
    table.integer('resource_cost').defaultTo(0);
    table.string('resource_type', 20); // 'sorcery', 'finesse', 'combat_maneuver'
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['ability_type']);
    table.index(['resource_type']);
  });

  // Link equipment templates to their granted abilities
  await knex.schema.createTable('equipment_template_abilities', (table) => {
    table.integer('equipment_template_id').references('id').inTable('equipment_templates').onDelete('CASCADE');
    table.integer('equipment_ability_id').references('id').inTable('equipment_abilities').onDelete('CASCADE');
    table.integer('granted_at_enchantment').defaultTo(0); // Ability available at this enchantment level
    
    table.primary(['equipment_template_id', 'equipment_ability_id']);
  });

  // Equipment stat modifications (for both base and enchanted equipment)
  await knex.schema.createTable('equipment_stat_modifiers', (table) => {
    table.increments('id').primary();
    table.integer('equipment_template_id').references('id').inTable('equipment_templates').onDelete('CASCADE');
    table.string('stat_name', 20).notNullable(); // 'str', 'dex', 'int', 'hp', 'ac', etc.
    table.string('modifier_type', 20).notNullable().checkIn(['bonus', 'penalty', 'override']);
    table.integer('base_value').defaultTo(0); // Base modifier value
    table.integer('per_enchantment_value').defaultTo(0); // Additional value per enchantment level
    table.integer('max_enchantment_level').defaultTo(3); // Maximum enchantment this modifier scales to
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['equipment_template_id']);
    table.index(['stat_name']);
  });

  // Equipment resource bonuses (sorcery/finesse/combat points)
  await knex.schema.createTable('equipment_resource_bonuses', (table) => {
    table.increments('id').primary();
    table.integer('equipment_template_id').references('id').inTable('equipment_templates').onDelete('CASCADE');
    table.string('resource_type', 20).notNullable().checkIn(['sorcery', 'finesse', 'combat_maneuver']);
    table.integer('base_bonus').defaultTo(0);
    table.integer('per_enchantment_bonus').defaultTo(0);
    table.integer('max_enchantment_level').defaultTo(3);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['equipment_template_id']);
    table.index(['resource_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('equipment_resource_bonuses');
  await knex.schema.dropTable('equipment_stat_modifiers');
  await knex.schema.dropTable('equipment_template_abilities');
  await knex.schema.dropTable('equipment_abilities');
  await knex.schema.dropTable('equipment_templates');
}