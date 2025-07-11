#!/usr/bin/env node

require('dotenv').config();
const { Client } = require('pg');

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
};

const targetDatabase = process.env.DATABASE_NAME || 'simple_char';

console.log('🔍 Database Creation Script');
console.log('='.repeat(50));
console.log(`Target database: ${targetDatabase}`);
console.log(`Connecting to: ${config.host}:${config.port}`);
console.log(`User: ${config.user}\n`);

async function createDatabase() {
  let client;
  
  try {
    // First, connect to the default 'postgres' database to check/create our target database
    console.log('🔄 Step 1: Connecting to default postgres database...');
    client = new Client({
      ...config,
      database: 'postgres' // Connect to default database first
    });
    
    await client.connect();
    console.log('✅ Connected to postgres database successfully!\n');
    
    // Check if our target database already exists
    console.log(`🔄 Step 2: Checking if database '${targetDatabase}' exists...`);
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1;
    `;
    
    const result = await client.query(checkQuery, [targetDatabase]);
    
    if (result.rows.length > 0) {
      console.log(`✅ Database '${targetDatabase}' already exists!`);
      console.log('   You can proceed with migrations.\n');
    } else {
      console.log(`❌ Database '${targetDatabase}' does not exist.`);
      console.log(`🔄 Step 3: Creating database '${targetDatabase}'...`);
      
      // Create the database
      const createQuery = `CREATE DATABASE "${targetDatabase}";`;
      await client.query(createQuery);
      
      console.log(`✅ Database '${targetDatabase}' created successfully!\n`);
    }
    
    // Test connection to the target database
    console.log(`🔄 Step 4: Testing connection to '${targetDatabase}'...`);
    await client.end(); // Close connection to postgres
    
    // Connect to our target database
    const targetClient = new Client({
      ...config,
      database: targetDatabase
    });
    
    await targetClient.connect();
    console.log('✅ Connection to target database successful!');
    
    // Test basic operations
    const versionResult = await targetClient.query('SELECT version(), current_database(), current_user;');
    console.log('📊 Database info:');
    console.log(`   Version: ${versionResult.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`   Current database: ${versionResult.rows[0].current_database}`);
    console.log(`   Current user: ${versionResult.rows[0].current_user}`);
    
    await targetClient.end();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! Your database is ready for migrations.');
    console.log('Next steps:');
    console.log('   1. npm run db:migrate');
    console.log('   2. npm run db:seed');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Database creation failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === '42P04') {
      console.error('\n💡 Database already exists (this is usually fine)');
      console.error('   Try running: npm run db:test');
    } else if (error.code === '42501') {
      console.error('\n💡 Permission denied - User lacks CREATE DATABASE privilege');
      console.error('   Solutions:');
      console.error('   1. Use the master user from RDS setup');
      console.error('   2. Or grant privileges: GRANT CREATE ON DATABASE postgres TO your_user;');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed');
      console.error('   - Check DATABASE_USER and DATABASE_PASSWORD in .env');
      console.error('   - Verify these match your RDS master credentials');
    } else if (error.code === '3D000') {
      console.error('\n💡 Default postgres database not found');
      console.error('   - This is unusual for AWS RDS');
      console.error('   - Check if you specified an initial database name during RDS creation');
    }
    
    process.exit(1);
  }
}

// List existing databases for debugging
async function listDatabases() {
  let client;
  
  try {
    console.log('\n🔍 Listing existing databases for debugging...');
    client = new Client({
      ...config,
      database: 'postgres'
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT datname, datowner, encoding, datcollate, datctype 
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname;
    `);
    
    console.log('📋 Existing databases:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.datname}`);
    });
    
    await client.end();
    
  } catch (error) {
    console.log('⚠️  Could not list databases:', error.message);
  }
}

async function main() {
  await createDatabase();
  await listDatabases();
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

main();