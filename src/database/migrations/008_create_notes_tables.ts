import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Character-specific notes
  await knex.schema.createTable('character_notes', (table) => {
    table.increments('id').primary();
    table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE');
    table.string('title', 200);
    table.text('content').notNullable();
    table.string('note_type', 20).defaultTo('general').checkIn(['general', 'combat', 'story', 'reminder']);
    table.boolean('is_pinned').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['character_id']);
    table.index(['character_id', 'created_at']);
    table.index(['note_type']);
  });

  // Universal notes (pushed to all characters)
  await knex.schema.createTable('universal_notes', (table) => {
    table.increments('id').primary();
    table.string('title', 200).notNullable();
    table.text('content').notNullable();
    table.string('note_type', 20).defaultTo('announcement').checkIn(['announcement', 'rule_update', 'system_info']);
    table.string('target_audience', 20).defaultTo('all').checkIn(['all', 'new_characters', 'existing_characters']);
    
    // Visibility controls
    table.boolean('is_active').defaultTo(true);
    table.timestamp('show_until');
    table.integer('min_character_level').defaultTo(1);
    table.integer('max_character_level');
    
    // Metadata
    table.integer('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['is_active', 'created_at']);
    table.index(['target_audience']);
    table.index(['note_type']);
  });

  // Track which users have seen which universal notes
  await knex.schema.createTable('user_universal_notes_seen', (table) => {
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('universal_note_id').references('id').inTable('universal_notes').onDelete('CASCADE');
    table.timestamp('seen_at').defaultTo(knex.fn.now());
    
    table.primary(['user_id', 'universal_note_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_universal_notes_seen');
  await knex.schema.dropTable('universal_notes');
  await knex.schema.dropTable('character_notes');
}