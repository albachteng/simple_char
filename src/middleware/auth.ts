import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { SessionData } from '../types/auth';
import { logger } from '../logger';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Middleware to authenticate requests using JWT tokens
   * Adds user data to request object if token is valid
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
        return;
      }

      const user = await this.authService.validateToken(token);
      
      if (!user) {
        res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      // Add user data to request
      req.user = {
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        sessionId: Date.now() // Simple session ID for tracking
      };

      next();
    } catch (error) {
      logger.error('Authentication middleware error', { 
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
   * Middleware to require admin privileges
   * Must be used after authenticate middleware
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      return;
    }

    if (!req.user.isAdmin) {
      logger.warn('Admin access denied', {
        userId: req.user.userId,
        username: req.user.username,
        path: req.path,
        method: req.method
      });
      
      res.status(403).json({
        error: 'Admin privileges required',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
      return;
    }

    next();
  };

  /**
   * Middleware to require the user to be the owner of a resource or an admin
   * Expects userId parameter in request params or body
   */
  requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
        return;
      }

      // Get the target user ID from params, body, or query
      const targetUserId = req.params[userIdField] || 
                          req.body[userIdField] || 
                          req.query[userIdField];

      if (!targetUserId) {
        res.status(400).json({
          error: 'User ID required',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      const targetUserIdNum = parseInt(targetUserId);
      
      // Allow if user is admin or owns the resource
      if (req.user.isAdmin || req.user.userId === targetUserIdNum) {
        next();
        return;
      }

      logger.warn('Ownership access denied', {
        userId: req.user.userId,
        username: req.user.username,
        targetUserId: targetUserIdNum,
        path: req.path,
        method: req.method
      });

      res.status(403).json({
        error: 'Access denied: insufficient privileges',
        code: 'ACCESS_DENIED'
      });
    };
  };

  /**
   * Optional authentication middleware - adds user data if token is present and valid
   * Does not reject requests without tokens
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        next();
        return;
      }

      const user = await this.authService.validateToken(token);
      
      if (user) {
        req.user = {
          userId: user.id,
          username: user.username,
          isAdmin: user.is_admin,
          sessionId: Date.now()
        };
      }

      next();
    } catch (error) {
      logger.debug('Optional auth error (non-blocking)', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      // Don't block request for optional auth errors
      next();
    }
  };

  /**
   * Middleware to refresh token if it's close to expiry
   */
  refreshTokenIfNeeded = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        next();
        return;
      }

      // Try to refresh the token
      const newToken = await this.authService.refreshToken(token);
      
      if (newToken && newToken !== token) {
        // Add new token to response header
        res.setHeader('X-New-Token', newToken);
        
        logger.debug('Token refreshed', {
          userId: req.user?.userId,
          path: req.path
        });
      }

      next();
    } catch (error) {
      logger.debug('Token refresh error (non-blocking)', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      // Don't block request for refresh errors
      next();
    }
  };

  /**
   * Extract JWT token from Authorization header or cookies
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies as fallback
    const token = req.cookies?.token;
    if (token) {
      return token;
    }

    return null;
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();