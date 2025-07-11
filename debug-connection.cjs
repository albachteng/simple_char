#!/usr/bin/env node

// Deep dive into what Knex is actually using for connection
const path = require('path');
const fs = require('fs');

// Explicit dotenv loading
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });

console.log('🔍 Deep Connection Configuration Debug');
console.log('='.repeat(50));

console.log('1️⃣ Environment Variables:');
console.log(`   DATABASE_HOST: "${process.env.DATABASE_HOST}"`);
console.log(`   DATABASE_PORT: "${process.env.DATABASE_PORT}"`);
console.log(`   DATABASE_NAME: "${process.env.DATABASE_NAME}"`);
console.log(`   DATABASE_USER: "${process.env.DATABASE_USER}"`);
console.log(`   DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '"[SET]"' : '"undefined"'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '"[SET]"' : '"undefined"'}`);
console.log(`   NODE_ENV: "${process.env.NODE_ENV || 'undefined'}"`);

console.log('\n2️⃣ Loading Knexfile:');
const knexConfig = require('./knexfile.cjs');
const env = process.env.NODE_ENV || 'development';
console.log(`   Using environment: ${env}`);

const config = knexConfig[env];
console.log(`   Config exists: ${!!config}`);

if (config) {
  console.log('\n3️⃣ Raw Knex Configuration:');
  console.log('   Full config object:');
  console.log(JSON.stringify(config, null, 2));
  
  console.log('\n4️⃣ Connection Configuration Analysis:');
  if (typeof config.connection === 'string') {
    console.log('   Connection type: STRING (DATABASE_URL)');
    console.log(`   Value: ${config.connection}`);
    
    // Parse DATABASE_URL to see what host it contains
    try {
      const url = new URL(config.connection);
      console.log(`   Parsed host from URL: ${url.hostname}`);
      console.log(`   Parsed port from URL: ${url.port}`);
      console.log(`   Parsed database from URL: ${url.pathname.substring(1)}`);
    } catch (err) {
      console.log(`   ❌ Invalid URL format: ${err.message}`);
    }
  } else {
    console.log('   Connection type: OBJECT');
    console.log(`   host: "${config.connection.host}"`);
    console.log(`   port: ${config.connection.port}`);
    console.log(`   database: "${config.connection.database}"`);
    console.log(`   user: "${config.connection.user}"`);
    console.log(`   ssl: ${JSON.stringify(config.connection.ssl)}`);
  }
  
  console.log('\n5️⃣ Testing Knex Instance Creation:');
  const knex = require('knex');
  
  try {
    console.log('   Creating Knex instance...');
    const db = knex(config);
    
    // Check what Knex actually resolves the config to
    console.log('   Knex instance created successfully');
    
    // Try to get the actual connection config Knex is using
    const client = db.client;
    console.log(`   Client type: ${client.constructor.name}`);
    
    if (client.connectionSettings) {
      console.log('   Knex resolved connection settings:');
      console.log(`     host: ${client.connectionSettings.host}`);
      console.log(`     port: ${client.connectionSettings.port}`);
      console.log(`     database: ${client.connectionSettings.database}`);
    }
    
    // Test actual connection
    console.log('\n6️⃣ Testing Actual Connection:');
    console.log('   Attempting to connect...');
    
    db.raw('SELECT 1 as test')
      .then(() => {
        console.log('   ✅ Connection successful!');
        return db.destroy();
      })
      .catch((err) => {
        console.log('   ❌ Connection failed!');
        console.log(`   Error: ${err.message}`);
        console.log(`   Error code: ${err.code}`);
        
        // Look for clues in the error
        if (err.message.includes('127.0.0.1') || err.message.includes('localhost')) {
          console.log('\n🚨 SMOKING GUN: Error mentions localhost!');
          console.log('   This means Knex is somehow resolving to localhost');
          console.log('   despite our configuration showing AWS RDS.');
          
          console.log('\n   Potential causes:');
          console.log('   1. PostgreSQL client library defaulting to localhost');
          console.log('   2. Knex ignoring connection object and using defaults');
          console.log('   3. Local PostgreSQL service interfering');
          console.log('   4. Network/DNS resolution issue');
          
          console.log('\n   Check if local PostgreSQL is running:');
          console.log('   sudo systemctl status postgresql');
          console.log('   sudo service postgresql status');
        }
        
        return db.destroy();
      });
      
  } catch (err) {
    console.log(`   ❌ Failed to create Knex instance: ${err.message}`);
  }
}

console.log('\n7️⃣ System Checks:');
console.log('   Checking for local PostgreSQL...');

const { spawn } = require('child_process');

// Check if PostgreSQL is running locally
const psqlCheck = spawn('pg_isready', ['-h', 'localhost', '-p', '5432'], { stdio: 'pipe' });

psqlCheck.on('close', (code) => {
  if (code === 0) {
    console.log('   ⚠️  LOCAL POSTGRESQL IS RUNNING!');
    console.log('   This could be interfering with connections.');
    console.log('   Try stopping it: sudo service postgresql stop');
  } else {
    console.log('   ✅ No local PostgreSQL detected on port 5432');
  }
  
  console.log('\n8️⃣ DNS Resolution Check:');
  console.log(`   Testing DNS resolution for: ${process.env.DATABASE_HOST}`);
  
  const { exec } = require('child_process');
  exec(`nslookup ${process.env.DATABASE_HOST}`, (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ DNS resolution failed');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('   ✅ DNS resolution successful');
      console.log('   Result:', stdout.split('\n').slice(0, 3).join('\n   '));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY: Review the output above to identify the issue');
    console.log('='.repeat(50));
  });
});