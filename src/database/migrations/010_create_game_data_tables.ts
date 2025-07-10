import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Race definitions (seeded data)
  await knex.schema.createTable('races', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.text('description');
    table.jsonb('stat_bonuses').notNullable(); // [{"stat": "str", "bonus": 2}, {"stat": "any", "bonus": 1}]
    table.specificType('racial_abilities', 'integer[]'); // Array of ability_template IDs
    table.text('flavor_text');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['name']);
    table.index(['is_active']);
  });

  // Application settings (global configuration)
  await knex.schema.createTable('application_settings', (table) => {
    table.string('key', 100).primary();
    table.text('value').notNullable();
    table.string('value_type', 20).defaultTo('string').checkIn(['string', 'number', 'boolean', 'json']);
    table.text('description');
    table.boolean('is_user_configurable').defaultTo(false);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('updated_by').references('id').inTable('users');
  });

  // User preferences
  await knex.schema.createTable('user_preferences', (table) => {
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('preference_key', 100).notNullable();
    table.text('preference_value').notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'preference_key']);

    // Indexes
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_preferences');
  await knex.schema.dropTable('application_settings');
  await knex.schema.dropTable('races');
}