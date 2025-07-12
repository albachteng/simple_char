/**
 * Test the auth route directly
 */

require('dotenv').config();

// Import the route
const authRouter = require('./src/routes/simple-auth.cjs');

console.log('Auth router imported successfully');
console.log('Router type:', typeof authRouter);
console.log('Router stack length:', authRouter.stack?.length);

// Mock request/response objects
const mockReq = {
  body: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!'
  },
  headers: {
    'content-type': 'application/json'
  }
};

const mockRes = {
  status: (code) => {
    console.log('Response status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return mockRes;
  },
  get: (header) => {
    if (header === 'X-Request-ID') return 'test-request-id';
    return null;
  }
};

// Find the POST /register route
const registerRoute = authRouter.stack.find(layer => 
  layer.route && 
  layer.route.path === '/register' && 
  layer.route.methods.post
);

if (registerRoute) {
  console.log('Found register route');
  try {
    // Execute the route handler
    const handler = registerRoute.route.stack[0].handle;
    console.log('Calling route handler...');
    handler(mockReq, mockRes);
    console.log('Route handler completed');
  } catch (error) {
    console.error('Route handler error:', error);
  }
} else {
  console.log('Register route not found');
  console.log('Available routes:', authRouter.stack.map(layer => ({
    path: layer.route?.path,
    methods: layer.route?.methods
  })));
}