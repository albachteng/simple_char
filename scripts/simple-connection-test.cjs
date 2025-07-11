#!/usr/bin/env node

require('dotenv').config();
const net = require('net');

const host = process.env.DATABASE_HOST;
const port = parseInt(process.env.DATABASE_PORT) || 5432;

console.log(`Testing TCP connection to ${host}:${port}`);
console.log('This test will help identify if the issue is network connectivity vs database authentication\n');

const socket = new net.Socket();

socket.setTimeout(10000); // 10 second timeout

socket.on('connect', () => {
  console.log('✅ TCP Connection Successful!');
  console.log('   - Network connectivity is working');
  console.log('   - Security groups allow port 5432');
  console.log('   - Database is listening on the correct port');
  console.log('\n🔄 Now try: npm run db:test');
  socket.destroy();
  process.exit(0);
});

socket.on('timeout', () => {
  console.log('❌ Connection Timeout');
  console.log('   - This indicates a network connectivity issue');
  console.log('   - The database server is not reachable');
  console.log('\n💡 Most likely causes:');
  console.log('   1. RDS Security Group does not allow inbound traffic on port 5432');
  console.log('   2. Database is not publicly accessible');
  console.log('   3. Wrong hostname or port');
  console.log('   4. Regional network restrictions');
  console.log('\n🔧 Steps to fix:');
  console.log('   1. Check RDS Console → Your DB → Connectivity & Security');
  console.log('   2. Verify "Publicly accessible" is "Yes"');
  console.log('   3. Check Security Groups → Inbound Rules');
  console.log('   4. Add rule: PostgreSQL (5432) from 0.0.0.0/0 (for testing)');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Connection Error:', error.code);
  console.log('   Error message:', error.message);
  
  switch (error.code) {
    case 'ENOTFOUND':
      console.log('\n💡 DNS Resolution Failed:');
      console.log('   - Check if DATABASE_HOST is correct');
      console.log('   - Verify RDS endpoint in AWS Console');
      break;
      
    case 'ECONNREFUSED':
      console.log('\n💡 Connection Refused:');
      console.log('   - Port 5432 is blocked or database not running');
      console.log('   - Check RDS security group inbound rules');
      break;
      
    case 'EHOSTUNREACH':
      console.log('\n💡 Host Unreachable:');
      console.log('   - Network routing issue');
      console.log('   - Check if database is in the correct region');
      break;
      
    default:
      console.log('\n💡 Unknown network error');
      console.log('   - Check AWS RDS status');
      console.log('   - Verify all network configurations');
  }
  
  console.log('\n🔄 Run diagnostic: npm run db:diagnose');
  process.exit(1);
});

console.log('🔄 Attempting connection...');
socket.connect(port, host);