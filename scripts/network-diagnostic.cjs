#!/usr/bin/env node

require('dotenv').config();
const { spawn } = require('child_process');
const net = require('net');
const dns = require('dns').promises;

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
};

console.log('🔍 Network Diagnostic Tool for AWS RDS Connection\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log(`  Password: ${config.password ? '[SET]' : '[NOT SET]'}\n`);

async function runDiagnostics() {
  const results = {};
  
  console.log('='.repeat(60));
  console.log('1. DNS RESOLUTION TEST');
  console.log('='.repeat(60));
  
  try {
    console.log(`🔄 Resolving hostname: ${config.host}`);
    const addresses = await dns.lookup(config.host, { all: true });
    console.log('✅ DNS resolution successful!');
    addresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr.address} (${addr.family})`);
    });
    results.dns = { success: true, addresses };
  } catch (error) {
    console.error('❌ DNS resolution failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Possible issues:');
    console.error('   - Invalid RDS endpoint hostname');
    console.error('   - DNS server issues');
    console.error('   - Network connectivity problems');
    results.dns = { success: false, error: error.message };
    return results; // Can't continue without DNS
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('2. NETWORK CONNECTIVITY TEST');
  console.log('='.repeat(60));
  
  try {
    console.log(`🔄 Testing TCP connection to ${config.host}:${config.port}`);
    await testTcpConnection(config.host, config.port, 10000);
    console.log('✅ TCP connection successful!');
    results.tcp = { success: true };
  } catch (error) {
    console.error('❌ TCP connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Possible issues:');
    console.error('   - RDS security group blocking port 5432');
    console.error('   - Database not publicly accessible');
    console.error('   - Wrong port number');
    console.error('   - Regional firewall/network restrictions');
    results.tcp = { success: false, error: error.message };
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('3. PING TEST (if available)');
  console.log('='.repeat(60));
  
  try {
    console.log(`🔄 Pinging ${config.host}`);
    const pingResult = await runPing(config.host);
    console.log('✅ Ping successful!');
    console.log(`   ${pingResult}`);
    results.ping = { success: true, result: pingResult };
  } catch (error) {
    console.log('⚠️  Ping failed or not available');
    console.log(`   Note: Many cloud services block ICMP ping`);
    results.ping = { success: false, error: error.message };
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('4. AWS RDS SPECIFIC CHECKS');
  console.log('='.repeat(60));
  
  // Check if hostname looks like AWS RDS
  if (config.host && config.host.includes('.rds.amazonaws.com')) {
    console.log('✅ Hostname appears to be AWS RDS');
    
    // Extract region from hostname
    const hostParts = config.host.split('.');
    if (hostParts.length >= 4) {
      const region = hostParts[2];
      console.log(`   Detected region: ${region}`);
      results.awsRegion = region;
    }
    
    console.log('\n💡 AWS RDS Connection Checklist:');
    console.log('   □ RDS instance is in "Available" state');
    console.log('   □ Security group allows inbound traffic on port 5432');
    console.log('   □ Database is publicly accessible (if connecting from outside AWS)');
    console.log('   □ VPC and subnet configuration allows external connections');
    console.log('   □ Your IP address is whitelisted in security group');
    
  } else {
    console.log('⚠️  Hostname does not appear to be AWS RDS');
    console.log(`   Expected format: *.*.*.rds.amazonaws.com`);
    console.log(`   Actual: ${config.host}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('5. SECURITY GROUP DEBUG TIPS');
  console.log('='.repeat(60));
  
  console.log('🔧 To check your RDS security group:');
  console.log('   1. Go to AWS RDS Console');
  console.log('   2. Find your database instance');
  console.log('   3. Click on "Connectivity & security" tab');
  console.log('   4. Check "Security groups" section');
  console.log('   5. Click on the security group name');
  console.log('   6. Check "Inbound rules" tab');
  console.log('   7. Look for: Type=PostgreSQL, Port=5432, Source=Your IP or 0.0.0.0/0');
  
  try {
    const publicIp = await getPublicIp();
    console.log(`\n🌐 Your public IP address: ${publicIp}`);
    console.log('   Use this IP in your RDS security group inbound rules');
    results.publicIp = publicIp;
  } catch (error) {
    console.log('⚠️  Could not determine public IP address');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('6. RECOMMENDED NEXT STEPS');
  console.log('='.repeat(60));
  
  if (!results.dns.success) {
    console.log('❌ CRITICAL: Fix DNS resolution first');
    console.log('   - Verify DATABASE_HOST in .env file');
    console.log('   - Check RDS endpoint in AWS console');
  } else if (!results.tcp.success) {
    console.log('❌ CRITICAL: Fix network connectivity');
    console.log('   - Update RDS security group inbound rules');
    console.log('   - Add rule: PostgreSQL (5432) from your IP or 0.0.0.0/0');
    console.log('   - Ensure RDS instance is publicly accessible');
  } else {
    console.log('✅ Network connectivity looks good!');
    console.log('   - Try running: npm run db:test');
    console.log('   - If that fails, check database credentials');
  }
  
  return results;
}

function testTcpConnection(host, port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection timeout after ${timeout}ms`));
    }, timeout);
    
    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve();
    });
    
    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function runPing(host) {
  return new Promise((resolve, reject) => {
    const ping = spawn('ping', ['-c', '3', host]);
    let output = '';
    
    ping.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ping.on('close', (code) => {
      if (code === 0) {
        // Extract meaningful info from ping output
        const lines = output.split('\n');
        const summaryLine = lines.find(line => line.includes('packets transmitted'));
        resolve(summaryLine || 'Ping completed successfully');
      } else {
        reject(new Error(`Ping failed with code ${code}`));
      }
    });
    
    ping.on('error', (error) => {
      reject(error);
    });
  });
}

async function getPublicIp() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout getting public IP'));
    });
  });
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Diagnostic failed:', error.message);
  process.exit(1);
});

runDiagnostics().catch(console.error);