import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('character_progression', (table) => {
    table.increments('id').primary();
    table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE');
    table.integer('level_number').notNullable();
    table.string('stat_choice', 3).checkIn(['str', 'dex', 'int']);
    table.integer('hp_roll').notNullable();
    table.string('level_up_type', 20).defaultTo('traditional').checkIn(['traditional', 'split']);
    table.jsonb('split_allocation'); // For split level-ups: {"str": 1, "dex": 1}
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['character_id']);
    table.index(['character_id', 'level_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('character_progression');
}