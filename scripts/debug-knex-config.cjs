#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Knex Configuration Debug');
console.log('='.repeat(50));

// Check environment variables
console.log('Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`  DATABASE_HOST: ${process.env.DATABASE_HOST || 'undefined'}`);
console.log(`  DATABASE_PORT: ${process.env.DATABASE_PORT || 'undefined'}`);
console.log(`  DATABASE_NAME: ${process.env.DATABASE_NAME || 'undefined'}`);
console.log(`  DATABASE_USER: ${process.env.DATABASE_USER || 'undefined'}`);
console.log(`  DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '[SET]' : 'undefined'}`);
console.log(`  DATABASE_SSL: ${process.env.DATABASE_SSL || 'undefined'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : 'undefined'}\n`);

// Load knex configuration
console.log('Loading knexfile.cjs...');
try {
  const knexConfig = require('../knexfile.cjs');
  
  console.log('✅ Knexfile loaded successfully\n');
  
  // Determine which environment Knex will use
  const env = process.env.NODE_ENV || 'development';
  console.log(`Current environment: ${env}`);
  
  const config = knexConfig[env];
  if (!config) {
    console.error(`❌ No configuration found for environment: ${env}`);
    console.log('Available environments:', Object.keys(knexConfig));
    process.exit(1);
  }
  
  console.log('\nKnex Configuration for', env, ':');
  console.log('='.repeat(30));
  
  // Show the actual connection config that Knex will use
  if (typeof config.connection === 'string') {
    console.log('Connection: DATABASE_URL (connection string)');
    console.log(`  Value: ${config.connection.substring(0, 20)}...`);
  } else {
    console.log('Connection Object:');
    console.log(`  host: ${config.connection.host || 'undefined'}`);
    console.log(`  port: ${config.connection.port || 'undefined'}`);
    console.log(`  database: ${config.connection.database || 'undefined'}`);
    console.log(`  user: ${config.connection.user || 'undefined'}`);
    console.log(`  password: ${config.connection.password ? '[SET]' : 'undefined'}`);
    console.log(`  ssl: ${JSON.stringify(config.connection.ssl)}`);
  }
  
  console.log('\nMigration Settings:');
  console.log(`  directory: ${config.migrations?.directory || 'undefined'}`);
  console.log(`  extension: ${config.migrations?.extension || 'undefined'}`);
  console.log(`  tableName: ${config.migrations?.tableName || 'knex_migrations'}`);
  
  console.log('\nPool Settings:');
  console.log(`  min: ${config.pool?.min || 'undefined'}`);
  console.log(`  max: ${config.pool?.max || 'undefined'}`);
  
  // Test if connection config points to localhost
  if (config.connection.host === 'localhost' || config.connection.host === '127.0.0.1') {
    console.log('\n❌ WARNING: Connection is pointing to localhost!');
    console.log('This means your environment variables are not being loaded correctly.');
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure .env file exists in the project root');
    console.log('2. Check that .env file has correct DATABASE_HOST value');
    console.log('3. Try running: cat .env | grep DATABASE_HOST');
  } else {
    console.log('\n✅ Connection config looks correct for AWS RDS');
  }
  
} catch (error) {
  console.error('❌ Error loading knexfile:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('Next Steps:');
console.log('1. If localhost warning above, check your .env file');
console.log('2. Try: cat .env | grep DATABASE');
console.log('3. If config looks good, try: npm run db:migrate');
console.log('='.repeat(50));