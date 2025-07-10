import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('character_inventory', (table) => {
    table.increments('id').primary();
    table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE');
    table.integer('equipment_template_id').references('id').inTable('equipment_templates').onDelete('RESTRICT');
    
    // Item instance properties
    table.string('custom_name', 100); // Custom name override
    table.integer('enchantment_level').defaultTo(0).checkBetween(-3, 3);
    table.boolean('is_equipped').defaultTo(false);
    table.string('equipment_slot', 20); // 'main-hand', 'off-hand', 'armor', 'shield'
    
    // Custom modifications (for unique items)
    table.text('custom_description');
    table.jsonb('custom_stat_modifiers'); // Override/additional stat mods: {"str": 2, "ac": 1}
    table.jsonb('custom_resource_bonuses'); // Override/additional resource bonuses
    table.specificType('custom_abilities', 'integer[]'); // Array of equipment_ability IDs
    
    // Metadata
    table.timestamp('acquired_at').defaultTo(knex.fn.now());
    table.text('notes'); // Player notes about this specific item

    // Indexes
    table.index(['character_id']);
    table.index(['character_id', 'is_equipped']);
    table.index(['equipment_template_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('character_inventory');
}