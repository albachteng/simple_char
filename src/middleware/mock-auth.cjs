/**
 * Mock authentication middleware for testing
 * Provides the same interface as the real authentication middleware but with mock data
 */

const { logger } = require('../test-logger.cjs');

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
 * Mock authentication middleware class
 * Provides the same interface as AuthMiddleware but with mock validation
 */
class MockAuthMiddleware {
  /**
   * Mock authenticate middleware
   * Validates mock token and sets req.user in the same format as real auth
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @param {import('express').NextFunction} next - Express next function
   */
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (token !== mockToken) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

      // Add user data to request in the same format as real auth middleware
      req.user = {
        userId: mockUser.id,
        username: mockUser.username,
        isAdmin: mockUser.is_admin,
        sessionId: Date.now() // Simple session ID for tracking
      };

      next();
    } catch (error) {
      logger.error('Mock authentication middleware error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method
      });
      
      res.status(500).json({
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };

  /**
   * Mock optional auth middleware
   * Sets req.user if valid token is provided, but doesn't require it
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @param {import('express').NextFunction} next - Express next function
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token === mockToken) {
          req.user = {
            userId: mockUser.id,
            username: mockUser.username,
            isAdmin: mockUser.is_admin,
            sessionId: Date.now()
          };
        }
      }
      
      next();
    } catch (error) {
      logger.error('Mock optional auth middleware error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method
      });
      
      next(); // Continue even if optional auth fails
    }
  };
}

// Create and export singleton instance
const mockAuthMiddleware = new MockAuthMiddleware();

module.exports = { 
  authMiddleware: mockAuthMiddleware,
  mockAuthMiddleware 
};