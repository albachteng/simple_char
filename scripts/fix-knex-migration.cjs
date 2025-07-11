// This script provides several potential fixes for the Knex migration localhost issue
require('dotenv').config();

console.log('🔧 Knex Migration Fix Attempts');
console.log('='.repeat(40));

const { spawn } = require('child_process');
const fs = require('fs');

// Check if we have the required environment variables
const requiredVars = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Make sure your .env file is properly configured');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Function to run a command and capture output
function runCommand(command, args, env = {}) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'pipe',
      env: { ...process.env, ...env }
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function attemptFixes() {
  // Fix Attempt 1: Explicitly set NODE_ENV
  console.log('\n1️⃣ Fix Attempt 1: Explicit NODE_ENV');
  console.log('   Setting NODE_ENV=development explicitly...');
  
  const result1 = await runCommand('npx', ['knex', 'migrate:latest', '--knexfile', 'knexfile.cjs'], {
    NODE_ENV: 'development'
  });
  
  if (result1.code === 0) {
    console.log('✅ SUCCESS: Migration worked with explicit NODE_ENV!');
    console.log('   Solution: Always use NODE_ENV=development npm run db:migrate');
    return;
  } else {
    console.log('❌ Failed with explicit NODE_ENV');
    if (result1.stderr.includes('127.0.0.1')) {
      console.log('   Still connecting to localhost');
    }
  }

  // Fix Attempt 2: Use DATABASE_URL instead of individual parameters
  console.log('\n2️⃣ Fix Attempt 2: DATABASE_URL approach');
  
  const databaseUrl = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?ssl=true`;
  console.log('   Creating DATABASE_URL...');
  console.log(`   URL: postgresql://${process.env.DATABASE_USER}:***@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?ssl=true`);
  
  const result2 = await runCommand('npx', ['knex', 'migrate:latest', '--knexfile', 'knexfile.cjs'], {
    DATABASE_URL: databaseUrl,
    NODE_ENV: 'development'
  });
  
  if (result2.code === 0) {
    console.log('✅ SUCCESS: Migration worked with DATABASE_URL!');
    console.log('   Solution: Add DATABASE_URL to your .env file');
    console.log(`   DATABASE_URL=${databaseUrl}`);
    return;
  } else {
    console.log('❌ Failed with DATABASE_URL');
    if (result2.stderr.includes('127.0.0.1')) {
      console.log('   Still connecting to localhost');
    }
  }

  // Fix Attempt 3: Use absolute path to knexfile
  console.log('\n3️⃣ Fix Attempt 3: Absolute knexfile path');
  
  const absoluteKnexfile = require('path').resolve('./knexfile.cjs');
  console.log(`   Using absolute path: ${absoluteKnexfile}`);
  
  const result3 = await runCommand('npx', ['knex', 'migrate:latest', '--knexfile', absoluteKnexfile], {
    NODE_ENV: 'development'
  });
  
  if (result3.code === 0) {
    console.log('✅ SUCCESS: Migration worked with absolute path!');
    console.log('   Solution: Use absolute path to knexfile');
    return;
  } else {
    console.log('❌ Failed with absolute path');
  }

  // Fix Attempt 4: Try running from the correct directory
  console.log('\n4️⃣ Fix Attempt 4: Ensure working directory');
  
  console.log(`   Current directory: ${process.cwd()}`);
  console.log('   Running migration from project root...');
  
  const result4 = await runCommand('npx', ['knex', 'migrate:latest', '--knexfile', './knexfile.cjs'], {
    NODE_ENV: 'development'
  });
  
  if (result4.code === 0) {
    console.log('✅ SUCCESS: Migration worked from correct directory!');
    return;
  }

  // Fix Attempt 5: Create a wrapper script that definitely loads .env
  console.log('\n5️⃣ Fix Attempt 5: Wrapper script with forced dotenv loading');
  
  const wrapperScript = `
require('dotenv').config();
console.log('Loaded DATABASE_HOST:', process.env.DATABASE_HOST);
require('knex/bin/cli');
`;
  
  fs.writeFileSync('./knex-wrapper.cjs', wrapperScript);
  fs.chmodSync('./knex-wrapper.cjs', '755');
  
  const result5 = await runCommand('node', ['knex-wrapper.cjs', 'migrate:latest', '--knexfile', 'knexfile.cjs'], {
    NODE_ENV: 'development'
  });
  
  if (result5.code === 0) {
    console.log('✅ SUCCESS: Migration worked with wrapper script!');
    console.log('   Solution: Use the knex-wrapper.js script for migrations');
    return;
  }

  // If all fixes failed
  console.log('\n❌ All fix attempts failed');
  console.log('\nDiagnostic information:');
  console.log('Last error output:', result5.stderr || result4.stderr || result3.stderr || result2.stderr || result1.stderr);
  
  console.log('\n🔧 Manual debugging steps:');
  console.log('1. Check .env file location and contents');
  console.log('2. Try: NODE_ENV=development npx knex migrate:latest --knexfile knexfile.cjs');
  console.log('3. Check if another .env file exists in parent directories');
  console.log('4. Try clearing npm cache: npm cache clean --force');
  console.log('5. Check if PostgreSQL is running locally and interfering');
}

attemptFixes().catch(console.error);
