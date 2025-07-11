#!/usr/bin/env node

// Custom migration runner that bypasses Knex CLI issues
const path = require('path');
const fs = require('fs');

// Explicit dotenv loading with path verification
const envPath = path.resolve(__dirname, '.env');
console.log(`🔍 Looking for .env file at: ${envPath}`);
console.log(`📁 .env file exists: ${fs.existsSync(envPath)}`);

require('dotenv').config({ path: envPath });

// Verify environment variables were loaded
console.log('🔍 Environment Variables After Loading:');
console.log(`   DATABASE_HOST: ${process.env.DATABASE_HOST || 'undefined'}`);
console.log(`   DATABASE_PORT: ${process.env.DATABASE_PORT || 'undefined'}`);
console.log(`   DATABASE_NAME: ${process.env.DATABASE_NAME || 'undefined'}`);
console.log(`   DATABASE_USER: ${process.env.DATABASE_USER || 'undefined'}`);
console.log(`   DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '[SET]' : 'undefined'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : 'undefined'}`);

const knex = require('knex');

console.log('🚀 Custom Migration Runner');
console.log('='.repeat(40));

async function runMigrations() {
  let db;
  
  try {
    // Load knex configuration
    const knexConfig = require('./knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    console.log(`Environment: ${env}`);
    
    if (typeof config.connection === 'object') {
      console.log(`Host: ${config.connection.host}`);
      console.log(`Database: ${config.connection.database}`);
      console.log(`Port: ${config.connection.port}`);
    } else {
      console.log(`Connection URL: ${config.connection.substring(0, 30)}...`);
    }
    
    // Create Knex instance
    console.log('\n🔄 Creating database connection...');
    db = knex(config);
    
    // Test connection
    console.log('🔄 Testing connection...');
    await db.raw('SELECT 1 as test');
    console.log('✅ Connection successful!');
    
    // Run migrations
    console.log('\n🔄 Running migrations...');
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('✅ Database is already up to date!');
    } else {
      console.log(`✅ Migrated ${log.length} files in batch ${batchNo}:`);
      log.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n💡 This might be your first migration.');
      console.error('The error is expected if no tables exist yet.');
    }
    
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('🔄 Database connection closed.');
    }
  }
}

runMigrations();