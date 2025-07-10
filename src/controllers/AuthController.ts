import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { CreateUserData, LoginCredentials, RegisterRequest, LoginRequest } from '../types/auth';
import { logger } from '../logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, confirmPassword }: RegisterRequest = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Username, email, and password are required',
          code: 'MISSING_FIELDS'
        });
        return;
      }

      // Validate password confirmation if provided
      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH'
        });
        return;
      }

      const userData: CreateUserData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      };

      const result = await this.authService.register(userData);

      logger.info('User registration successful', {
        userId: result.user.id,
        username: result.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token
        },
        message: 'User registered successfully'
      });
    } catch (error: any) {
      logger.error('Registration failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: { username: req.body.username, email: req.body.email }
      });

      if (error.validationErrors) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.validationErrors
        });
        return;
      }

      if (error.message.includes('already')) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: 'CONFLICT'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { emailOrUsername, password, rememberMe }: LoginRequest = req.body;

      // Validate required fields
      if (!emailOrUsername || !password) {
        res.status(400).json({
          success: false,
          error: 'Email/username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
        return;
      }

      const credentials: LoginCredentials = {
        emailOrUsername: emailOrUsername.trim(),
        password
      };

      const result = await this.authService.login(credentials);

      // Set token in cookie if rememberMe is true
      if (rememberMe) {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      logger.info('User login successful', {
        userId: result.user.id,
        username: result.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        rememberMe: !!rememberMe
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token
        },
        message: 'Login successful'
      });
    } catch (error: any) {
      logger.warn('Login failed', {
        error: error.message,
        emailOrUsername: req.body.emailOrUsername,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (error.message.includes('Invalid credentials') || 
          error.message.includes('deactivated')) {
        res.status(401).json({
          success: false,
          error: error.message,
          code: 'INVALID_CREDENTIALS'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Clear the token cookie
      res.clearCookie('token');

      logger.info('User logout', {
        userId: req.user?.userId,
        username: req.user?.username,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      logger.error('Logout error', {
        error: error.message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
        return;
      }

      // Validate token and get fresh user data
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token required',
          code: 'NO_TOKEN'
        });
        return;
      }

      const user = await this.authService.validateToken(token);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user
        }
      });
    } catch (error: any) {
      logger.error('Me endpoint error', {
        error: error.message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Refresh user token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token required',
          code: 'NO_TOKEN'
        });
        return;
      }

      const newToken = await this.authService.refreshToken(token);
      
      if (!newToken) {
        res.status(401).json({
          success: false,
          error: 'Unable to refresh token',
          code: 'REFRESH_FAILED'
        });
        return;
      }

      logger.debug('Token refreshed', {
        userId: req.user?.userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        data: {
          token: newToken
        },
        message: 'Token refreshed successfully'
      });
    } catch (error: any) {
      logger.error('Token refresh error', {
        error: error.message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
        return;
      }

      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
          code: 'MISSING_FIELDS'
        });
        return;
      }

      // Validate password confirmation
      if (confirmNewPassword && newPassword !== confirmNewPassword) {
        res.status(400).json({
          success: false,
          error: 'New passwords do not match',
          code: 'PASSWORD_MISMATCH'
        });
        return;
      }

      await this.authService.changePassword(req.user.userId, currentPassword, newPassword);

      logger.info('Password changed successfully', {
        userId: req.user.userId,
        username: req.user.username,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      logger.error('Password change failed', {
        error: error.message,
        userId: req.user?.userId,
        ip: req.ip
      });

      if (error.validationErrors) {
        res.status(400).json({
          success: false,
          error: 'Password validation failed',
          code: 'VALIDATION_ERROR',
          details: error.validationErrors
        });
        return;
      }

      if (error.message.includes('incorrect')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'INVALID_PASSWORD'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}