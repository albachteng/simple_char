/**
 * Debug script to test auth route directly
 */

require('dotenv').config();
const { ResponseUtil } = require('./src/utils/ResponseUtil.cjs');

// Test if ResponseUtil works
console.log('Testing ResponseUtil...');

// Mock response object
const mockRes = {
  status: (code) => {
    console.log('Status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
    return mockRes;
  },
  get: (header) => {
    if (header === 'X-Request-ID') return 'test-request-id';
    return null;
  }
};

try {
  console.log('Calling ResponseUtil.success...');
  ResponseUtil.success(mockRes, { test: 'data' }, 'Test message', 201);
  console.log('Success call completed');
} catch (error) {
  console.error('Error calling ResponseUtil.success:', error);
}

try {
  console.log('Calling ResponseUtil.error...');
  ResponseUtil.error(mockRes, 'Test error', 400);
  console.log('Error call completed');
} catch (error) {
  console.error('Error calling ResponseUtil.error:', error);
}