#!/usr/bin/env node

require('dotenv').config();
const knex = require('knex');

console.log('🔍 Testing Migration Connection');
console.log('='.repeat(40));

async function testMigrationConnection() {
  let db;
  
  try {
    // Load the same config that migrations use
    const knexConfig = require('../knexfile.cjs');
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    console.log(`Environment: ${env}`);
    console.log(`Config loaded: ✅`);
    
    if (typeof config.connection === 'object') {
      console.log(`Connecting to: ${config.connection.host}:${config.connection.port}`);
      console.log(`Database: ${config.connection.database}`);
      console.log(`User: ${config.connection.user}`);
    }
    
    // Create knex instance
    console.log('\n🔄 Creating Knex instance...');
    db = knex(config);
    
    console.log('🔄 Testing database connection...');
    await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    console.log('🔄 Checking migrations table...');
    const hasTable = await db.schema.hasTable('knex_migrations');
    console.log(`Migrations table exists: ${hasTable ? '✅' : '❌'}`);
    
    if (!hasTable) {
      console.log('🔄 Creating migrations table...');
      await db.migrate.currentVersion();
      console.log('✅ Migrations table created!');
    }
    
    console.log('\n✅ Migration connection test passed!');
    console.log('You should be able to run: npm run db:migrate');
    
  } catch (error) {
    console.error('\n❌ Migration connection test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('127.0.0.1') || error.message.includes('localhost')) {
      console.error('\n💡 The error shows localhost/127.0.0.1');
      console.error('This means Knex is not using your .env variables correctly.');
      console.error('\nSteps to fix:');
      console.error('1. Run: npm run db:debug');
      console.error('2. Check your .env file location and contents');
      console.error('3. Make sure .env is in the project root');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused - check if target is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Host not found - check DATABASE_HOST');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection timeout - check security groups');
    }
    
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('🔄 Connection closed.');
    }
  }
}

testMigrationConnection();