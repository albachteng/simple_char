import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../middleware/auth';
import { AuthService } from '../../services/AuthService';
import { logger } from '../../logger';

// Mock dependencies
vi.mock('../../services/AuthService');

// Mock logger properly
vi.mock('../../logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockAuthService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AuthService
    mockAuthService = {
      validateToken: vi.fn(),
      refreshToken: vi.fn()
    };
    (AuthService as any).mockImplementation(() => mockAuthService);

    // Setup middleware
    authMiddleware = new AuthMiddleware();

    // Mock Express request/response
    mockRequest = {
      headers: {},
      cookies: {},
      params: {},
      body: {},
      query: {},
      path: '/test',
      method: 'GET'
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid Bearer token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthService.validateToken.mockResolvedValue(mockUser);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        userId: 1,
        username: 'testuser',
        isAdmin: false,
        sessionId: expect.any(Number)
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate user with cookie token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      };

      mockRequest.cookies = {
        token: 'cookie-token'
      };

      mockAuthService.validateToken.mockResolvedValue(mockUser);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('cookie-token');
      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthService.validateToken.mockResolvedValue(null);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication service errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer error-token'
      };

      mockAuthService.validateToken.mockRejectedValue(new Error('Service error'));

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Authentication middleware error',
        {
          error: 'Service error',
          path: '/test',
          method: 'GET'
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should properly extract Bearer token from Authorization header', async () => {
      const testCases = [
        { header: 'Bearer token123', expected: 'token123' },
        { header: 'Bearer jwt.token.here', expected: 'jwt.token.here' },
        { header: 'Basic credentials', expected: null },
        { header: 'Bearer', expected: '' },
        { header: '', expected: null }
      ];

      for (const { header, expected } of testCases) {
        mockRequest.headers = { authorization: header };
        mockRequest.cookies = {};

        if (expected) {
          mockAuthService.validateToken.mockResolvedValue({
            id: 1,
            username: 'test',
            is_admin: false
          });
        } else {
          mockAuthService.validateToken.mockClear();
        }

        await authMiddleware.authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        if (expected !== null) {
          expect(mockAuthService.validateToken).toHaveBeenCalledWith(expected);
        } else {
          expect(mockAuthService.validateToken).not.toHaveBeenCalled();
        }

        vi.clearAllMocks();
      }
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow access for admin users', () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        isAdmin: true,
        sessionId: 123
      };

      authMiddleware.requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockRequest.user = {
        userId: 2,
        username: 'regular',
        isAdmin: false,
        sessionId: 123
      };

      authMiddleware.requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Admin privileges required',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Admin access denied',
        {
          userId: 2,
          username: 'regular',
          path: '/test',
          method: 'GET'
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      authMiddleware.requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin middleware', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        isAdmin: false,
        sessionId: 123
      };
    });

    it('should allow access for resource owner', () => {
      mockRequest.params = { userId: '1' };

      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for admin users', () => {
      mockRequest.user!.isAdmin = true;
      mockRequest.params = { userId: '999' }; // Different user ID

      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-owner, non-admin users', () => {
      mockRequest.params = { userId: '999' }; // Different user ID

      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied: insufficient privileges',
        code: 'ACCESS_DENIED'
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Ownership access denied',
        {
          userId: 1,
          username: 'testuser',
          targetUserId: 999,
          path: '/test',
          method: 'GET'
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should check userId in body when not in params', () => {
      mockRequest.body = { userId: '1' };

      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should check userId in query when not in params or body', () => {
      mockRequest.query = { userId: '1' };

      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when userId is missing', () => {
      const middleware = authMiddleware.requireOwnershipOrAdmin('userId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User ID required',
        code: 'MISSING_USER_ID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should support custom field names', () => {
      mockRequest.params = { characterId: '1' };

      const middleware = authMiddleware.requireOwnershipOrAdmin('characterId');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should add user data when valid token is provided', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthService.validateToken.mockResolvedValue(mockUser);

      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        userId: 1,
        username: 'testuser',
        isAdmin: false,
        sessionId: expect.any(Number)
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user data when no token is provided', async () => {
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user data when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthService.validateToken.mockResolvedValue(null);

      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue when authentication service throws error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer error-token'
      };

      mockAuthService.validateToken.mockRejectedValue(new Error('Service error'));

      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Optional auth error (non-blocking)',
        {
          error: 'Service error',
          path: '/test'
        }
      );
    });
  });

  describe('refreshTokenIfNeeded middleware', () => {
    it('should add new token header when token is refreshed', async () => {
      mockRequest.headers = {
        authorization: 'Bearer old-token'
      };

      mockAuthService.refreshToken.mockResolvedValue('new-token');

      await authMiddleware.refreshTokenIfNeeded(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('old-token');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-New-Token', 'new-token');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not add header when token is not refreshed', async () => {
      mockRequest.headers = {
        authorization: 'Bearer current-token'
      };

      mockAuthService.refreshToken.mockResolvedValue('current-token'); // Same token

      await authMiddleware.refreshTokenIfNeeded(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue when no token is provided', async () => {
      await authMiddleware.refreshTokenIfNeeded(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue when refresh service throws error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer error-token'
      };

      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh error'));

      await authMiddleware.refreshTokenIfNeeded(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Token refresh error (non-blocking)',
        {
          error: 'Refresh error',
          path: '/test'
        }
      );
    });
  });

  describe('token extraction', () => {
    it('should prefer Authorization header over cookies', async () => {
      mockRequest.headers = {
        authorization: 'Bearer header-token'
      };
      mockRequest.cookies = {
        token: 'cookie-token'
      };

      mockAuthService.validateToken.mockResolvedValue({
        id: 1,
        username: 'test',
        is_admin: false
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('header-token');
    });

    it('should fall back to cookies when no Authorization header', async () => {
      mockRequest.cookies = {
        token: 'cookie-token'
      };

      mockAuthService.validateToken.mockResolvedValue({
        id: 1,
        username: 'test',
        is_admin: false
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('cookie-token');
    });

    it('should handle malformed Authorization headers', async () => {
      const malformedHeaders = [
        'Basic credentials',
        'Bearer',
        'Token abc123',
        'bearer lowercase-bearer',
        ''
      ];

      for (const header of malformedHeaders) {
        mockRequest.headers = { authorization: header };
        mockRequest.cookies = {};

        await authMiddleware.authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockAuthService.validateToken).not.toHaveBeenCalled();

        vi.clearAllMocks();
      }
    });
  });
});