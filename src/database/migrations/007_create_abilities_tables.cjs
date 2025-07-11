exports.up = async function(knex) {
  // Master ability templates (seeded data)
  await knex.schema.createTable('ability_templates', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('type', 30).notNullable().checkIn(['metamagic', 'spellword', 'combat_maneuver', 'racial', 'equipment']);
    table.text('description').notNullable();
    table.string('short_description', 200);
    
    // Learning requirements
    table.integer('min_level').defaultTo(1);
    table.jsonb('stat_requirements'); // {"str": 16, "int": 12}
    table.jsonb('prerequisite_abilities'); // Array of ability_template IDs
    
    // Usage properties
    table.integer('resource_cost').defaultTo(0);
    table.string('resource_type', 20); // 'sorcery', 'finesse', 'combat_maneuver'
    table.string('usage_limit', 20); // 'unlimited', 'per_day', 'per_combat'
    
    // Metadata
    table.string('source', 50); // 'core', 'expansion', 'custom'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['type']);
    table.index(['source']);
    table.index(['is_active']);
  });

  // Character learned abilities
  await knex.schema.createTable('character_abilities', (table) => {
    table.increments('id').primary();
    table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE');
    table.integer('ability_template_id').references('id').inTable('ability_templates').onDelete('RESTRICT');
    table.integer('learned_at_level').notNullable();
    table.integer('times_used').defaultTo(0); // Usage tracking
    table.text('custom_notes');
    table.timestamp('learned_at').defaultTo(knex.fn.now());
    
    table.unique(['character_id', 'ability_template_id']); // Can't learn the same ability twice

    // Indexes
    table.index(['character_id']);
    table.index(['ability_template_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('character_abilities');
  await knex.schema.dropTable('ability_templates');
};