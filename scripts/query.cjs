#!/usr/bin/env node

// Script to run custom SQL queries
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const knex = require('knex');

const query = process.argv[2];

if (!query) {
  console.log('Usage: npm run db:query "SELECT * FROM table_name LIMIT 5"');
  console.log('Examples:');
  console.log('  npm run db:query "SELECT name, type, base_damage_dice FROM equipment_templates WHERE type = \'weapon\'"');
  console.log('  npm run db:query "SELECT name, description FROM ability_templates WHERE type = \'metamagic\' LIMIT 3"');
  console.log('  npm run db:query "SELECT name, stat_bonuses FROM races"');
  process.exit(1);
}

async function runQuery() {
  let db;
  
  try {
    const knexConfig = require('../knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    db = knex(config);
    
    console.log(`🔍 Running query: ${query}`);
    console.log('='.repeat(50));
    
    const result = await db.raw(query);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`📊 Results: ${result.rows.length} rows\n`);
      
      result.rows.forEach((row, index) => {
        console.log(`🔸 Row ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          let displayValue = value;
          if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value);
          }
          console.log(`  ${key}: ${displayValue}`);
        });
        console.log('');
      });
    } else {
      console.log('No results returned');
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

runQuery();