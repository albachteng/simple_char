import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Application logs (global)
  await knex.schema.createTable('application_logs', (table) => {
    table.increments('id').primary();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.string('level', 10).notNullable().checkIn(['debug', 'info', 'warn', 'error']);
    table.string('category', 50).notNullable();
    table.text('message').notNullable();
    table.jsonb('data');
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('character_id').references('id').inTable('characters').onDelete('SET NULL');
    table.integer('session_id').references('id').inTable('user_sessions').onDelete('SET NULL');
    table.inet('ip_address');
    table.text('user_agent');

    // Indexes
    table.index(['timestamp']);
    table.index(['level']);
    table.index(['user_id', 'character_id']);
    table.index(['category']);
  });

  // Character-specific activity logs
  await knex.schema.createTable('character_logs', (table) => {
    table.increments('id').primary();
    table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.string('level', 10).notNullable().checkIn(['debug', 'info', 'warn', 'error']);
    table.string('category', 50).notNullable();
    table.text('message').notNullable();
    table.jsonb('data');
    table.integer('session_id').references('id').inTable('user_sessions').onDelete('SET NULL');

    // Indexes
    table.index(['character_id', 'timestamp']);
    table.index(['level']);
    table.index(['category']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('character_logs');
  await knex.schema.dropTable('application_logs');
}