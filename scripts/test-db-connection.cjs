#!/usr/bin/env node

require('dotenv').config();
const { Client } = require('pg');

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 30000
};

console.log('Testing database connection...');
console.log('Configuration:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  ssl: !!config.ssl,
  password: config.password ? '[HIDDEN]' : 'undefined'
});

async function testConnection() {
  const client = new Client(config);
  
  try {
    console.log('\n🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('\n🔄 Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Query successful!');
    console.log('Database version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    console.log('Current database:', result.rows[0].current_database);
    console.log('Current user:', result.rows[0].current_user);
    
    console.log('\n🔄 Testing table creation permissions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table creation successful!');
    
    console.log('\n🔄 Testing table drop permissions...');
    await client.query('DROP TABLE IF EXISTS connection_test');
    console.log('✅ Table drop successful!');
    
    console.log('\n✅ All database tests passed! Your connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Suggestions:');
      console.error('- Check if DATABASE_HOST is correct');
      console.error('- Verify your internet connection');
      console.error('- Make sure the RDS instance is running');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions:');
      console.error('- Check if DATABASE_PORT is correct (usually 5432)');
      console.error('- Verify RDS security groups allow connections');
      console.error('- Check if the database is publicly accessible (if connecting from outside AWS)');
    } else if (error.code === 'SASL') {
      console.error('\n💡 Suggestions:');
      console.error('- Check DATABASE_USER and DATABASE_PASSWORD');
      console.error('- Verify the user has been created in the database');
    } else if (error.code === '3D000') {
      console.error('\n💡 Suggestions:');
      console.error('- Check if DATABASE_NAME exists');
      console.error('- Create the database first if it doesn\'t exist');
    } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Network Timeout - Most likely causes:');
      console.error('- RDS Security Group blocking port 5432');
      console.error('- Database not publicly accessible');
      console.error('- Wrong region or VPC configuration');
      console.error('- Network firewall blocking connections');
      console.error('\n🔧 Try these steps:');
      console.error('1. Run: npm run db:tcp-test');
      console.error('2. Check RDS Console → Connectivity & Security');
      console.error('3. Verify Security Group inbound rules');
      console.error('4. Ensure "Publicly accessible" = Yes');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔄 Connection closed.');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

testConnection();