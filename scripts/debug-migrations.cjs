#!/usr/bin/env node

// Debug what migrations Knex can see
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const knex = require('knex');

console.log('🔍 Debugging Migration Discovery');
console.log('='.repeat(40));

async function debugMigrations() {
  let db;
  
  try {
    // Load knex configuration
    const knexConfig = require('../knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    console.log('1️⃣ Configuration:');
    console.log(`   Environment: ${env}`);
    console.log(`   Migration directory: ${config.migrations.directory}`);
    console.log(`   Migration extension: ${config.migrations.extension}`);
    
    // Create Knex instance
    db = knex(config);
    
    console.log('\n2️⃣ Checking migration files on disk:');
    const fs = require('fs');
    const migrationDir = path.resolve(__dirname, '..', config.migrations.directory);
    console.log(`   Looking in: ${migrationDir}`);
    console.log(`   Directory exists: ${fs.existsSync(migrationDir)}`);
    
    if (fs.existsSync(migrationDir)) {
      const files = fs.readdirSync(migrationDir);
      console.log(`   All files in directory: ${files.length}`);
      files.forEach(file => console.log(`     ${file}`));
      
      const migrationFiles = files.filter(f => f.endsWith(`.${config.migrations.extension}`));
      console.log(`   Found ${migrationFiles.length} .${config.migrations.extension} files:`);
      migrationFiles.forEach(file => {
        console.log(`     - ${file}`);
      });
    } else {
      console.log('   ❌ Migration directory does not exist!');
      
      // Try alternative paths
      const altPath1 = path.resolve(process.cwd(), config.migrations.directory);
      console.log(`   Trying: ${altPath1} - exists: ${fs.existsSync(altPath1)}`);
      
      const altPath2 = path.resolve(config.migrations.directory);
      console.log(`   Trying: ${altPath2} - exists: ${fs.existsSync(altPath2)}`);
    }
    
    console.log('\n3️⃣ What Knex sees:');
    
    // Get current migration version
    const currentVersion = await db.migrate.currentVersion();
    console.log(`   Current version: ${currentVersion}`);
    
    // List completed migrations
    const completed = await db.migrate.list();
    console.log(`   Completed migrations: ${completed[0].length}`);
    if (completed[0].length > 0) {
      completed[0].forEach(migration => {
        console.log(`     ✅ ${migration}`);
      });
    }
    
    console.log(`   Pending migrations: ${completed[1].length}`);
    if (completed[1].length > 0) {
      completed[1].forEach(migration => {
        console.log(`     ⏳ ${migration}`);
      });
    } else {
      console.log('     ⚠️  No pending migrations found!');
    }
    
    console.log('\n4️⃣ Force running latest migration:');
    try {
      const [batchNo, log] = await db.migrate.latest();
      if (log.length === 0) {
        console.log('   No migrations to run (already up to date)');
      } else {
        console.log(`   ✅ Ran ${log.length} migrations in batch ${batchNo}:`);
        log.forEach(file => {
          console.log(`     - ${file}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Migration failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

debugMigrations();