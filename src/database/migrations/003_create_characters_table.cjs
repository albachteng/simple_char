exports.up = function(knex) {
  return knex.schema.createTable('characters', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    
    // Core stats and creation parameters
    table.string('high_stat', 3).notNullable(); // 'str', 'dex', or 'int'
    table.string('mid_stat', 3).notNullable(); // 'str', 'dex', or 'int'
    table.string('race', 50);
    table.jsonb('racial_bonuses'); // Array of racial bonus strings
    
    // Current derived stats (calculated from base + racial + equipment)
    table.integer('current_str').notNullable().defaultTo(16);
    table.integer('current_dex').notNullable().defaultTo(10);
    table.integer('current_int').notNullable().defaultTo(6);
    
    // Progression tracking
    table.integer('level').notNullable().defaultTo(1);
    table.integer('current_hp').notNullable().defaultTo(10);
    table.integer('pending_level_up_points').defaultTo(0);
    
    // Stat override system
    table.boolean('use_stat_overrides').defaultTo(false);
    table.integer('str_override');
    table.integer('dex_override');
    table.integer('int_override');
    
    // Resource threshold tracking (for non-retroactive bonuses)
    table.integer('sorcery_threshold_level');
    table.integer('double_sorcery_threshold_level');
    table.integer('finesse_threshold_level');
    
    // Character integrity and metadata
    table.string('data_hash', 255); // For backward compatibility and integrity
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_accessed').defaultTo(knex.fn.now());
    
    // Constraints
    table.unique(['user_id', 'name']); // Users can't have duplicate character names
    
    // Indexes
    table.index(['user_id']);
    table.index(['name']);
    table.index(['updated_at']);
    table.index(['last_accessed']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('characters');
};