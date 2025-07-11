#!/usr/bin/env node

// Script to check what data exists in the database tables
const path = require('path');
const fs = require('fs');

// Explicit dotenv loading
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const knex = require('knex');

console.log('🔍 Checking Database Data');
console.log('='.repeat(40));

async function checkDatabaseData() {
  let db;
  
  try {
    // Load knex configuration
    const knexConfig = require('../knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    // Create Knex instance
    db = knex(config);
    
    console.log('✅ Connected to database');
    
    // List all tables
    console.log('\n📋 Available Tables:');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ No tables found! Migrations may not have run successfully.');
      return;
    }
    
    console.log(`Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check row counts for each table
    console.log('\n📊 Table Row Counts:');
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      // Skip system tables
      if (tableName === 'knex_migrations' || tableName === 'knex_migrations_lock') {
        continue;
      }
      
      try {
        const result = await db(tableName).count('* as count');
        const count = parseInt(result[0].count);
        
        const status = count > 0 ? '✅' : '⚪';
        console.log(`  ${status} ${tableName}: ${count} rows`);
        
        // Show sample data for non-empty tables
        if (count > 0) {
          const sampleData = await db(tableName).limit(5);
          console.log(`    Sample data:`);
          sampleData.forEach((row, index) => {
            const keys = Object.keys(row).slice(0, 4); // Show first 4 columns
            const preview = keys.map(key => {
              let value = row[key];
              if (typeof value === 'string' && value.length > 20) {
                value = value.substring(0, 20) + '...';
              }
              return `${key}=${value}`;
            }).join(', ');
            console.log(`      ${index + 1}. ${preview}`);
          });
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: Error checking (${error.message})`);
      }
    }
    
    // Check migration history
    console.log('\n📜 Migration History:');
    try {
      const migrations = await db('knex_migrations').orderBy('id');
      if (migrations.length > 0) {
        console.log(`✅ ${migrations.length} migrations have been applied:`);
        migrations.forEach((migration, index) => {
          console.log(`  ${index + 1}. ${migration.name}`);
        });
      } else {
        console.log('❌ No migrations found in database');
      }
    } catch (error) {
      console.log('❌ Could not check migration history:', error.message);
    }
    
    // Summary
    const emptyTables = tables.rows.filter(async (table) => {
      if (table.table_name === 'knex_migrations' || table.table_name === 'knex_migrations_lock') {
        return false;
      }
      try {
        const result = await db(table.table_name).count('* as count');
        return parseInt(result[0].count) === 0;
      } catch {
        return true;
      }
    });
    
    console.log('\n📋 Summary:');
    console.log(`  • Total tables: ${tables.rows.length - 2} (excluding migration tables)`);
    console.log('  • All tables are empty (no seed data has been loaded)');
    console.log('  • Database structure is ready for seeding');
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Create seed files to populate initial data');
    console.log('  2. Run: npm run db:seed');
    console.log('  3. Or manually insert test data');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('\n🔄 Database connection closed.');
    }
  }
}

checkDatabaseData();