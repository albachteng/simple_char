/**
 * Simple auth routes for testing - CommonJS version
 */

const { Router } = require('express');
const { ResponseUtil } = require('../utils/ResponseUtil.cjs');

const router = Router();

// Mock user for testing
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  is_admin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: null
};

const mockToken = 'mock-jwt-token-12345';

/**
 * Test endpoint
 */
router.post('/test', (req, res) => {
  console.log('=== TEST ENDPOINT ===');
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  
  res.json({
    success: true,
    receivedBody: req.body,
    bodyType: typeof req.body
  });
});

/**
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  console.log('=== REGISTRATION REQUEST ===');
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Headers:', req.headers);
  
  try {
    const { username, email, password } = req.body || {};
    
    console.log('Extracted fields:', { username, email, passwordLength: password?.length });
    
    // Basic validation
    if (!username || !email || !password) {
      console.log('Missing fields validation failed');
      return ResponseUtil.error(res, 'Missing required fields', 400);
    }
    
    if (password.length < 8) {
      return ResponseUtil.error(res, 'Password must be at least 8 characters', 400);
    }
    
    // Return mock success response
    console.log('Sending success response');
    ResponseUtil.success(res, {
      user: mockUser,
      token: mockToken
    }, 'User registered successfully', 201);
    
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    ResponseUtil.error(res, 'Registration failed', 500);
  }
});

/**
 * POST /api/auth/login  
 */
router.post('/login', (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    if (!emailOrUsername || !password) {
      return ResponseUtil.error(res, 'Missing credentials', 400);
    }
    
    // Return mock success response
    ResponseUtil.success(res, {
      user: mockUser,
      token: mockToken
    }, 'Login successful');
    
  } catch (error) {
    console.error('Login error:', error);
    ResponseUtil.error(res, 'Login failed', 500);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseUtil.error(res, 'No token provided', 401);
    }
    
    // Return mock user
    ResponseUtil.success(res, { user: mockUser });
    
  } catch (error) {
    console.error('Me error:', error);
    ResponseUtil.error(res, 'Failed to get user', 500);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  try {
    ResponseUtil.success(res, {}, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    ResponseUtil.error(res, 'Logout failed', 500);
  }
});

module.exports = router;