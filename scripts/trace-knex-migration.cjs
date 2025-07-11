#!/usr/bin/env node

// This script traces exactly what the Knex CLI is doing
require('dotenv').config();

console.log('🔍 Tracing Knex Migration Configuration');
console.log('='.repeat(50));

// 1. Check if .env is being loaded properly
console.log('1. Environment Variables Status:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   DATABASE_HOST: ${process.env.DATABASE_HOST || 'undefined'}`);
console.log(`   DATABASE_PORT: ${process.env.DATABASE_PORT || 'undefined'}`);
console.log(`   DATABASE_NAME: ${process.env.DATABASE_NAME || 'undefined'}`);
console.log(`   DATABASE_USER: ${process.env.DATABASE_USER || 'undefined'}`);
console.log(`   DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '[SET]' : 'undefined'}`);

// 2. Load knexfile and check which environment it will use
console.log('\n2. Loading Knexfile Configuration:');
const knexConfig = require('../knexfile.cjs');
const env = process.env.NODE_ENV || 'development';
console.log(`   Environment: ${env}`);

const config = knexConfig[env];
if (!config) {
  console.error(`   ❌ No config found for ${env}`);
  console.log(`   Available: ${Object.keys(knexConfig).join(', ')}`);
  process.exit(1);
}

console.log('   ✅ Config loaded');

// 3. Check the actual connection object that will be used
console.log('\n3. Connection Configuration Analysis:');
if (typeof config.connection === 'string') {
  console.log('   Type: DATABASE_URL string');
  console.log(`   Value: ${config.connection.substring(0, 30)}...`);
} else {
  console.log('   Type: Connection object');
  console.log(`   host: "${config.connection.host}"`);
  console.log(`   port: ${config.connection.port}`);
  console.log(`   database: "${config.connection.database}"`);
  console.log(`   user: "${config.connection.user}"`);
  
  // Check if it's pointing to localhost
  if (config.connection.host === 'localhost' || config.connection.host === '127.0.0.1') {
    console.log('   ❌ PROBLEM: Host is localhost!');
    console.log('   This means DATABASE_HOST env var is not being read');
  } else if (config.connection.host?.includes('rds.amazonaws.com')) {
    console.log('   ✅ Host looks like AWS RDS endpoint');
  } else {
    console.log(`   ⚠️  Unexpected host: ${config.connection.host}`);
  }
}

// 4. Simulate what Knex CLI does internally
console.log('\n4. Simulating Knex CLI Process:');
const { spawn } = require('child_process');

console.log('   Running: knex migrate:currentVersion --knexfile knexfile.cjs');
console.log('   (This should show the same connection info that migrate:latest uses)');

const knexProcess = spawn('npx', ['knex', 'migrate:currentVersion', '--knexfile', 'knexfile.cjs'], {
  stdio: 'pipe',
  env: { ...process.env }
});

let output = '';
let errorOutput = '';

knexProcess.stdout.on('data', (data) => {
  output += data.toString();
});

knexProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

knexProcess.on('close', (code) => {
  console.log('\n5. Knex CLI Output Analysis:');
  console.log(`   Exit code: ${code}`);
  
  if (output) {
    console.log('   STDOUT:');
    console.log('   ' + output.replace(/\n/g, '\n   '));
  }
  
  if (errorOutput) {
    console.log('   STDERR:');
    console.log('   ' + errorOutput.replace(/\n/g, '\n   '));
    
    // Analyze the error for connection details
    if (errorOutput.includes('127.0.0.1') || errorOutput.includes('localhost')) {
      console.log('\n❌ CONFIRMED: Knex CLI is connecting to localhost');
      console.log('   This suggests one of these issues:');
      console.log('   1. Knex CLI is not loading .env file');
      console.log('   2. Different NODE_ENV is being used');
      console.log('   3. Knex CLI has different working directory');
      console.log('   4. There\'s a caching issue with the config');
    } else if (errorOutput.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused to the configured host');
      console.log('   This means Knex is using the right config but can\'t connect');
    }
  }
  
  // 6. Additional diagnostics
  console.log('\n6. Additional Diagnostics:');
  console.log('   Current working directory:', process.cwd());
  console.log('   Knexfile path:', require.resolve('../knexfile.cjs'));
  console.log('   .env file exists:', require('fs').existsSync('.env'));
  
  console.log('\n' + '='.repeat(50));
  console.log('RECOMMENDATIONS:');
  
  if (errorOutput.includes('127.0.0.1') || errorOutput.includes('localhost')) {
    console.log('🔧 Try these solutions:');
    console.log('   1. Set NODE_ENV explicitly: NODE_ENV=development npm run db:migrate');
    console.log('   2. Use absolute path: npx knex migrate:latest --knexfile ./knexfile.cjs');
    console.log('   3. Check if knex command loads dotenv: npx knex --help');
    console.log('   4. Try using DATABASE_URL instead of individual vars');
  } else {
    console.log('✅ Configuration looks correct');
    console.log('🔧 If still failing, try:');
    console.log('   1. Verify AWS RDS security group allows your IP');
    console.log('   2. Check if RDS instance is running');
    console.log('   3. Test with: npm run db:test');
  }
  
  console.log('='.repeat(50));
});

// 7. Test creating a knex instance directly with the config
console.log('\n7. Direct Knex Instance Test:');
const knex = require('knex');

try {
  const db = knex(config);
  console.log('   ✅ Knex instance created successfully');
  console.log('   Testing connection...');
  
  db.raw('SELECT 1 as test')
    .then(() => {
      console.log('   ✅ Direct connection works!');
      console.log('   Problem is likely with Knex CLI, not configuration');
      return db.destroy();
    })
    .catch((err) => {
      console.log('   ❌ Direct connection failed:', err.message);
      if (err.message.includes('127.0.0.1') || err.message.includes('localhost')) {
        console.log('   This confirms the config is pointing to localhost');
      }
      return db.destroy();
    });
} catch (err) {
  console.log('   ❌ Failed to create Knex instance:', err.message);
}