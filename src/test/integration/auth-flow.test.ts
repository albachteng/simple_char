import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { getDatabase } from '../../database/connection';

// Mock external dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

// Mock the database connection for integration tests
vi.mock('../../database/connection');

// Mock logger properly
vi.mock('../../test-logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    auth: vi.fn(),
    security: vi.fn()
  }
}));

describe('Authentication Flow Integration Tests', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create comprehensive mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      first: vi.fn(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      raw: vi.fn().mockImplementation((query) => query),
      del: vi.fn()
    };

    // Mock the database connection
    (getDatabase as any).mockReturnValue(mockDb);
    
    vi.mocked(getDatabase).mockImplementation(() => {
      const knexMock = vi.fn().mockImplementation((tableName: string) => mockDb);
      // Add raw method to the knex instance itself
      knexMock.raw = vi.fn().mockImplementation((query) => query);
      return knexMock as any;
    });

    // Set test environment variables
    process.env.JWT_SECRET = 'test-integration-secret';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    process.env.JWT_EXPIRY = '1h';

    // Mock bcrypt and jwt for successful operations
    vi.mocked(bcrypt.genSalt).mockResolvedValue('test_salt');
    vi.mocked(bcrypt.hash).mockResolvedValue('test_hash');
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    vi.mocked(jwt.sign).mockReturnValue('test_token');
    vi.mocked(jwt.verify).mockReturnValue({ userId: 1, username: 'testuser', isAdmin: false } as any);
    vi.mocked(jwt.decode).mockReturnValue({ userId: 1, username: 'testuser', isAdmin: false } as any);

    authService = new AuthService();
    userRepository = new UserRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.JWT_EXPIRY;
  });

  describe('Complete User Registration and Login Flow', () => {
    const testUserData = {
      username: 'integrationuser',
      email: 'integration@example.com',
      password: 'IntegrationTest123!'
    };

    it('should complete full registration and login cycle', async () => {
      // Step 1: Register a new user
      mockDb.first.mockResolvedValueOnce(null); // findByEmail returns null
      mockDb.first.mockResolvedValueOnce(null); // findByUsername returns null
      
      const mockCreatedUser = {
        id: 1,
        username: 'integrationuser',
        email: 'integration@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        is_admin: false,
        password_hash: 'mock_hash',
        salt: 'mock_salt'
      };

      mockDb.returning.mockResolvedValueOnce([mockCreatedUser]);

      const registrationResult = await authService.register(testUserData);

      expect(registrationResult).toHaveProperty('user');
      expect(registrationResult).toHaveProperty('token');
      expect(registrationResult.user.username).toBe('integrationuser');
      expect(registrationResult.user.email).toBe('integration@example.com');
      expect(typeof registrationResult.token).toBe('string');

      // Step 2: Login with the registered user
      // bcrypt.compare is already mocked to return true
      
      mockDb.first.mockResolvedValueOnce(mockCreatedUser); // findByEmailOrUsername returns user
      mockDb.update.mockResolvedValueOnce(1); // updateLastLogin succeeds

      const loginResult = await authService.login({
        emailOrUsername: 'integration@example.com',
        password: testUserData.password
      });

      expect(loginResult).toHaveProperty('user');
      expect(loginResult).toHaveProperty('token');
      expect(loginResult.user.username).toBe('integrationuser');
      expect(typeof loginResult.token).toBe('string');

      // Step 3: Validate the token from login
      mockDb.first.mockResolvedValueOnce(mockCreatedUser); // findById returns user

      const tokenValidationResult = await authService.validateToken(loginResult.token);

      expect(tokenValidationResult).not.toBeNull();
      expect(tokenValidationResult?.username).toBe('integrationuser');
      expect(tokenValidationResult?.email).toBe('integration@example.com');
    });

    it('should prevent duplicate registrations', async () => {
      // First registration succeeds
      mockDb.first.mockResolvedValueOnce(null); // findByEmail returns null
      mockDb.first.mockResolvedValueOnce(null); // findByUsername returns null
      
      const mockCreatedUser = {
        id: 1,
        username: 'integrationuser',
        email: 'integration@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        is_admin: false
      };

      mockDb.returning.mockResolvedValueOnce([mockCreatedUser]);

      const firstRegistration = await authService.register(testUserData);
      expect(firstRegistration).toHaveProperty('user');

      // Second registration with same email should fail
      mockDb.first.mockResolvedValueOnce(mockCreatedUser); // findByEmail returns existing user

      await expect(authService.register(testUserData)).rejects.toThrow('Email already registered');

      // Registration with same username should fail
      mockDb.first.mockResolvedValueOnce(null); // findByEmail returns null (different email)
      mockDb.first.mockResolvedValueOnce(mockCreatedUser); // findByUsername returns existing user

      await expect(authService.register({
        ...testUserData,
        email: 'different@example.com'
      })).rejects.toThrow('Username already taken');
    });

    it('should handle login with both email and username', async () => {
      const mockUser = {
        id: 1,
        username: 'integrationuser',
        email: 'integration@example.com',
        password_hash: 'mock_hash',
        is_active: true,
        is_admin: false
      };

      mockDb.update.mockResolvedValue(1); // updateLastLogin succeeds

      // Login with email
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      const emailLoginResult = await authService.login({
        emailOrUsername: 'integration@example.com',
        password: testUserData.password
      });

      expect(emailLoginResult.user.username).toBe('integrationuser');

      // Login with username
      mockDb.first.mockResolvedValueOnce(mockUser);

      const usernameLoginResult = await authService.login({
        emailOrUsername: 'integrationuser',
        password: testUserData.password
      });

      expect(usernameLoginResult.user.email).toBe('integration@example.com');
    });
  });

  describe('Token Lifecycle Management', () => {
    const mockUser = {
      id: 1,
      username: 'tokenuser',
      email: 'token@example.com',
      password_hash: 'mock_hash',
      is_active: true,
      is_admin: false
    };

    it('should handle token refresh flow', async () => {
      // Mock jwt.sign to return different tokens for login vs refresh
      vi.mocked(jwt.sign).mockReturnValueOnce('original_token');
      
      // Login to get initial token
      mockDb.first.mockResolvedValueOnce(mockUser);
      mockDb.update.mockResolvedValueOnce(1);

      const loginResult = await authService.login({
        emailOrUsername: 'token@example.com',
        password: 'TokenTest123!'
      });

      const originalToken = loginResult.token;
      
      // Mock jwt.sign to return a different token for refresh
      vi.mocked(jwt.sign).mockReturnValueOnce('refreshed_token');

      // Refresh the token
      mockDb.first.mockResolvedValueOnce(mockUser); // findById for refresh

      const refreshedToken = await authService.refreshToken(originalToken);

      expect(refreshedToken).not.toBeNull();
      expect(typeof refreshedToken).toBe('string');
      expect(refreshedToken).not.toBe(originalToken);

      // Validate the refreshed token
      mockDb.first.mockResolvedValueOnce(mockUser); // findById for validation

      const validationResult = await authService.validateToken(refreshedToken!);

      expect(validationResult).not.toBeNull();
      expect(validationResult?.username).toBe('tokenuser');
    });

    it('should invalidate tokens for inactive users', async () => {
      // Login with active user
      mockDb.first.mockResolvedValueOnce(mockUser);
      mockDb.update.mockResolvedValueOnce(1);

      const loginResult = await authService.login({
        emailOrUsername: 'token@example.com',
        password: 'TokenTest123!'
      });

      // Deactivate user
      const inactiveUser = { ...mockUser, is_active: false };

      // Token validation should fail for inactive user
      mockDb.first.mockResolvedValueOnce(inactiveUser);

      const validationResult = await authService.validateToken(loginResult.token);

      expect(validationResult).toBeNull();
    });
  });

  describe('Password Management Flow', () => {
    const mockUser = {
      id: 1,
      username: 'passworduser',
      email: 'password@example.com',
      password_hash: 'mock_hash',
      is_active: true,
      is_admin: false
    };

    it('should complete password change flow', async () => {
      // Find user for password change
      mockDb.first.mockResolvedValueOnce(mockUser);
      mockDb.update.mockResolvedValueOnce(1); // updatePassword succeeds

      await authService.changePassword(1, 'oldPassword', 'NewPassword123!');

      // Verify that updatePassword was called
      expect(mockDb.update).toHaveBeenCalled();

      // Login should work with new password (in real scenario)
      mockDb.first.mockResolvedValueOnce(mockUser);
      mockDb.update.mockResolvedValueOnce(1); // updateLastLogin

      const loginResult = await authService.login({
        emailOrUsername: 'password@example.com',
        password: 'NewPassword123!'
      });

      expect(loginResult.user.username).toBe('passworduser');
    });

    it('should prevent password change with incorrect current password', async () => {
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Mock bcrypt.compare to return false for wrong password
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

      await expect(authService.changePassword(
        1,
        'wrongCurrentPassword',
        'NewPassword123!'
      )).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('Administrative Functions Flow', () => {
    const mockUser = {
      id: 1,
      username: 'regularuser',
      email: 'regular@example.com',
      is_active: true,
      is_admin: false
    };

    const mockAdmin = {
      id: 2,
      username: 'adminuser',
      email: 'admin@example.com',
      is_active: true,
      is_admin: true
    };

    it('should complete admin promotion flow', async () => {
      // Find regular user
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Mock the database update for promotion - don't override where, just mock the update
      mockDb.update.mockResolvedValueOnce(1);

      // Promote user to admin
      await authService.promoteToAdmin(1, 2);

      expect(mockDb.update).toHaveBeenCalledWith({
        is_admin: true,
        updated_at: expect.any(Date)
      });

      // Verify user stats reflect the change
      const mockStats = {
        totalUsers: 2,
        activeUsers: 2,
        adminUsers: 2, // Now we have 2 admins
        recentRegistrations: 1
      };

      mockDb.select.mockResolvedValueOnce([{
        total_users: '2',
        active_users: '2',
        admin_users: '2',
        recent_registrations: '1'
      }]);

      const stats = await authService.getUserStats();

      expect(stats.adminUsers).toBe(2);
      expect(stats.totalUsers).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures gracefully', async () => {
      // Simulate database connection failure
      mockDb.first.mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.login({
        emailOrUsername: 'test@example.com',
        password: 'TestPass123!'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed tokens', async () => {
      const malformedToken = 'not-a-valid-jwt-token';

      const result = await authService.validateToken(malformedToken);

      expect(result).toBeNull();
    });

    it('should handle user not found scenarios', async () => {
      mockDb.first.mockResolvedValue(null);

      await expect(authService.login({
        emailOrUsername: 'nonexistent@example.com',
        password: 'TestPass123!'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Input Validation Integration', () => {
    it('should validate all registration inputs together', async () => {
      const invalidInputs = [
        {
          data: { username: '', email: 'test@example.com', password: 'TestPass123!' },
          expectedError: 'Username is required'
        },
        {
          data: { username: 'testuser', email: 'invalid-email', password: 'TestPass123!' },
          expectedError: 'Invalid email format'
        },
        {
          data: { username: 'testuser', email: 'test@example.com', password: 'weak' },
          expectedError: 'Password must be at least 8 characters long'
        },
        {
          data: { username: 'a', email: 'test@example.com', password: 'TestPass123!' },
          expectedError: 'Username must be at least 3 characters long'
        }
      ];

      for (const { data, expectedError } of invalidInputs) {
        try {
          await authService.register(data);
          expect.fail(`Expected registration to fail with: ${expectedError}`);
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.validationErrors).toBeDefined();
          expect(error.validationErrors.some((e: any) => e.message.includes(expectedError.split(' ')[0]))).toBe(true);
        }
      }
    });
  });
});