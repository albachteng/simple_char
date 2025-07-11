exports.up = function(knex) {
  return knex.schema.createTable('user_sessions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_accessed').defaultTo(knex.fn.now());
    table.text('user_agent');
    table.string('ip_address', 45); // Supports both IPv4 and IPv6

    // Indexes
    table.index(['session_token']);
    table.index(['user_id']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_sessions');
};