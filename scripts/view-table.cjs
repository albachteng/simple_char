#!/usr/bin/env node

// Script to view specific table data in detail
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const knex = require('knex');

const tableName = process.argv[2];

if (!tableName) {
  console.log('Usage: npm run db:view <table_name>');
  console.log('Examples:');
  console.log('  npm run db:view equipment_templates');
  console.log('  npm run db:view ability_templates');
  console.log('  npm run db:view races');
  process.exit(1);
}

async function viewTable() {
  let db;
  
  try {
    const knexConfig = require('../knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    db = knex(config);
    
    console.log(`🔍 Viewing table: ${tableName}`);
    console.log('='.repeat(50));
    
    // Check if table exists
    const exists = await db.schema.hasTable(tableName);
    if (!exists) {
      console.log(`❌ Table "${tableName}" does not exist`);
      
      // Show available tables
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'knex_%'
        ORDER BY table_name
      `);
      
      console.log('\nAvailable tables:');
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
      return;
    }
    
    // Get row count
    const countResult = await db(tableName).count('* as count');
    const count = parseInt(countResult[0].count);
    
    console.log(`📊 Total rows: ${count}`);
    
    if (count === 0) {
      console.log('Table is empty');
      return;
    }
    
    // Get table structure
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ? 
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log('\n📋 Table Structure:');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const defaultVal = col.column_default ? ` default: ${col.column_default}` : '';
      console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });
    
    // Get all data (limit to first 20 rows for readability)
    const limit = count > 20 ? 20 : count;
    const data = await db(tableName).limit(limit);
    
    console.log(`\n📄 Data (showing ${limit} of ${count} rows):`);
    console.log('='.repeat(50));
    
    data.forEach((row, index) => {
      console.log(`\n🔸 Row ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        // Handle different data types for display
        let displayValue = value;
        
        if (value === null) {
          displayValue = '(null)';
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else if (typeof value === 'string' && value.length > 100) {
          displayValue = value.substring(0, 100) + '...';
        }
        
        console.log(`  ${key}: ${displayValue}`);
      });
    });
    
    if (count > limit) {
      console.log(`\n... and ${count - limit} more rows`);
      console.log(`Use LIMIT in a direct query to see more data`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

viewTable();