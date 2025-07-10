import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { logger } from '../../logger';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../repositories/UserRepository');

// Mock logger properly
vi.mock('../../logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock UserRepository
    mockUserRepository = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findByEmailOrUsername: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateLastLogin: vi.fn(),
      updatePassword: vi.fn(),
      db: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        update: vi.fn()
      }),
      getUserStats: vi.fn()
    };

    // Mock UserRepository constructor
    (UserRepository as any).mockImplementation(() => mockUserRepository);

    // Set environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    process.env.JWT_EXPIRY = '1h';

    authService = new AuthService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.JWT_EXPIRY;
  });

  describe('constructor', () => {
    it('should warn when using default JWT secret', () => {
      delete process.env.JWT_SECRET;
      
      // Clear previous calls to logger.warn
      vi.mocked(logger.warn).mockClear();
      
      new AuthService();
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Using default JWT secret - change this in production!'
      );
    });

    it('should use environment variables for configuration', () => {
      process.env.JWT_SECRET = 'custom-secret';
      process.env.BCRYPT_SALT_ROUNDS = '15';
      process.env.JWT_EXPIRY = '2d';

      const service = new AuthService();
      expect(service).toBeDefined();
    });
  });

  describe('register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    it('should register user successfully', async () => {
      // Mock external dependencies
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt123');
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword');
      vi.mocked(jwt.sign).mockReturnValue('jwt-token');

      const mockCreatedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        is_admin: false
      };

      mockUserRepository.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.register(validUserData);

      expect(result).toEqual({
        user: mockCreatedUser,
        token: 'jwt-token'
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        password_hash: 'hashedPassword',
        salt: 'salt123'
      });
      expect(logger.info).toHaveBeenCalledWith(
        'User registered successfully',
        {
          userId: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      );
    });

    it('should reject invalid username', async () => {
      const invalidData = { ...validUserData, username: 'ab' }; // Too short

      await expect(authService.register(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(authService.register(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak' };

      await expect(authService.register(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject existing email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: 1 });

      await expect(authService.register(validUserData)).rejects.toThrow('Email already registered');
    });

    it('should reject existing username', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue({ id: 1 });

      await expect(authService.register(validUserData)).rejects.toThrow('Username already taken');
    });

    it('should handle registration errors', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt123');
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword');

      const error = new Error('Database error');
      mockUserRepository.create.mockRejectedValue(error);

      await expect(authService.register(validUserData)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'User registration failed',
        {
          username: 'testuser',
          email: 'test@example.com',
          error: 'Database error'
        }
      );
    });
  });

  describe('login', () => {
    const validCredentials = {
      emailOrUsername: 'test@example.com',
      password: 'TestPass123!'
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedPassword',
      is_active: true,
      is_admin: false
    };

    it('should login user successfully', async () => {
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(jwt.sign).mockReturnValue('jwt-token');

      const result = await authService.login(validCredentials);

      expect(result).toEqual({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, is_admin: false },
        token: 'jwt-token'
      });

      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith(
        'User logged in successfully',
        { userId: 1, username: 'testuser' }
      );
    });

    it('should reject missing credentials', async () => {
      const invalidCredentials = { emailOrUsername: '', password: 'TestPass123!' };

      await expect(authService.login(invalidCredentials)).rejects.toThrow(
        'Email/username and password are required'
      );
    });

    it('should reject non-existent user', async () => {
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);

      await expect(authService.login(validCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should reject inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(inactiveUser);

      await expect(authService.login(validCredentials)).rejects.toThrow('Account is deactivated');
    });

    it('should reject invalid password', async () => {
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(authService.login(validCredentials)).rejects.toThrow('Invalid credentials');

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed login attempt',
        {
          emailOrUsername: 'test@example.com',
          userId: 1
        }
      );
    });
  });

  describe('validateToken', () => {
    const mockToken = 'valid-jwt-token';
    const mockDecodedToken = {
      userId: 1,
      username: 'testuser',
      isAdmin: false
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      password_hash: 'hash',
      salt: 'salt'
    };

    it('should validate token successfully', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.validateToken(mockToken);

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        is_admin: false
      });

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret-key');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null for expired token', async () => {
      const error = new Error('Token expired') as any;
      error.name = 'TokenExpiredError';
      vi.mocked(jwt.verify).mockImplementation(() => { throw error; });

      const result = await authService.validateToken(mockToken);

      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Token expired', { error: 'Token expired' });
    });

    it('should return null for invalid token', async () => {
      const error = new Error('Invalid token') as any;
      error.name = 'JsonWebTokenError';
      vi.mocked(jwt.verify).mockImplementation(() => { throw error; });

      const result = await authService.validateToken(mockToken);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Invalid token provided', { error: 'Invalid token' });
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.validateToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);
      mockUserRepository.findById.mockResolvedValue({ ...mockUser, is_active: false });

      const result = await authService.validateToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    const mockToken = 'expired-jwt-token';
    const mockDecodedToken = {
      userId: 1,
      username: 'testuser',
      isAdmin: false
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      is_admin: false
    };

    it('should refresh token successfully', async () => {
      vi.mocked(jwt.decode).mockReturnValue(mockDecodedToken as any);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('new-jwt-token');

      const result = await authService.refreshToken(mockToken);

      expect(result).toBe('new-jwt-token');
      expect(logger.debug).toHaveBeenCalledWith('Token refreshed', { userId: 1 });
    });

    it('should return null for invalid token format', async () => {
      vi.mocked(jwt.decode).mockReturnValue(null);

      const result = await authService.refreshToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(jwt.decode).mockReturnValue(mockDecodedToken as any);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.refreshToken(mockToken);

      expect(result).toBeNull();
    });

    it('should handle refresh errors', async () => {
      const error = new Error('Refresh failed');
      vi.mocked(jwt.decode).mockImplementation(() => { throw error; });

      const result = await authService.refreshToken(mockToken);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', { error: 'Refresh failed' });
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      password_hash: 'oldHashedPassword',
      is_active: true
    };

    it('should change password successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(bcrypt.genSalt).mockResolvedValue('newSalt');
      vi.mocked(bcrypt.hash).mockResolvedValue('newHashedPassword');

      await authService.changePassword(1, 'oldPassword', 'NewPass123!');

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        1,
        'newHashedPassword',
        'newSalt'
      );
      expect(logger.info).toHaveBeenCalledWith('User password changed', { userId: 1 });
    });

    it('should reject for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.changePassword(1, 'oldPassword', 'NewPass123!')).rejects.toThrow(
        'User not found'
      );
    });

    it('should reject incorrect current password', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(authService.changePassword(1, 'wrongPassword', 'NewPass123!')).rejects.toThrow(
        'Current password is incorrect'
      );
    });

    it('should reject weak new password', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      await expect(authService.changePassword(1, 'oldPassword', 'weak')).rejects.toThrow(
        'Password validation failed'
      );
    });
  });

  describe('password validation', () => {
    it('should accept strong password', async () => {
      // This tests the internal validatePassword method through registration
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass123!'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt');
      vi.mocked(bcrypt.hash).mockResolvedValue('hash');
      vi.mocked(jwt.sign).mockReturnValue('token');
      mockUserRepository.create.mockResolvedValue({ id: 1 });

      await expect(authService.register(userData)).resolves.toBeDefined();
    });

    it('should reject password without uppercase', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weakpass123!'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });

    it('should reject password without lowercase', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'WEAKPASS123!'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });

    it('should reject password without numbers', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'WeakPass!'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });

    it('should reject password without special characters', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'WeakPass123'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });

    it('should reject common passwords', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });

    it('should reject too short password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Sh0rt!'
      };

      await expect(authService.register(userData)).rejects.toThrow('Validation failed');
    });
  });

  describe('admin functions', () => {
    it('should promote user to admin', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      
      const mockUpdate = vi.fn().mockResolvedValue(1);
      mockUserRepository.db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        update: mockUpdate
      });

      await authService.promoteToAdmin(1, 2);

      expect(mockUpdate).toHaveBeenCalledWith({
        is_admin: true,
        updated_at: expect.any(Date)
      });
      expect(logger.info).toHaveBeenCalledWith('User promoted to admin', { userId: 1, promotedBy: 2 });
    });

    it('should get user stats', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 90,
        adminUsers: 5,
        recentRegistrations: 10
      };
      mockUserRepository.getUserStats.mockResolvedValue(mockStats);

      const result = await authService.getUserStats();

      expect(result).toEqual(mockStats);
      expect(mockUserRepository.getUserStats).toHaveBeenCalled();
    });
  });
});