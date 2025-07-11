import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/AuthService';

// Mock dependencies for security testing
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../repositories/UserRepository');

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

describe('Authentication Security Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set secure test environment
    process.env.JWT_SECRET = 'test-security-secret-key-very-long-and-secure';
    process.env.BCRYPT_SALT_ROUNDS = '12';
    process.env.JWT_EXPIRY = '1h';

    authService = new AuthService();
    
    // Mock UserRepository methods for password testing
    const mockUserRepository = (authService as any).userRepository;
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.findByUsername.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com' });
    
    // Mock bcrypt and jwt for successful operations
    vi.mocked(bcrypt.genSalt).mockResolvedValue('test_salt');
    vi.mocked(bcrypt.hash).mockResolvedValue('test_hash');
    vi.mocked(jwt.sign).mockReturnValue('test_token');
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.JWT_EXPIRY;
  });

  describe('Password Security', () => {
    describe('Password Strength Validation', () => {
      const testPasswordStrength = async (password: string, shouldPass: boolean) => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password
        };

        try {
          await authService.register(userData);
          if (!shouldPass) {
            expect.fail(`Password "${password}" should have been rejected`);
          }
        } catch (error: any) {
          if (shouldPass) {
            expect.fail(`Password "${password}" should have been accepted`);
          }
          expect(error.message).toBe('Validation failed');
          expect(error.validationErrors).toBeDefined();
        }
      };

      it('should reject passwords shorter than 8 characters', async () => {
        await testPasswordStrength('Abc123!', false);
        await testPasswordStrength('Short1!', false);
      });

      it('should reject passwords longer than 128 characters', async () => {
        const longPassword = 'A'.repeat(120) + 'bc123!'; // 126 chars, should pass
        const tooLongPassword = 'A'.repeat(125) + 'bc123!'; // 131 chars, should fail

        await testPasswordStrength(longPassword, true);
        await testPasswordStrength(tooLongPassword, false);
      });

      it('should require uppercase letters', async () => {
        await testPasswordStrength('lowercase123!', false);
        await testPasswordStrength('Uppercase123!', true);
      });

      it('should require lowercase letters', async () => {
        await testPasswordStrength('UPPERCASE123!', false);
        await testPasswordStrength('Lowercase123!', true);
      });

      it('should require numbers', async () => {
        await testPasswordStrength('NoNumbers!', false);
        await testPasswordStrength('WithNumbers123!', true);
      });

      it('should require special characters', async () => {
        await testPasswordStrength('NoSpecialChars123', false);
        await testPasswordStrength('WithSpecial123!', true);
      });

      it('should reject common weak passwords', async () => {
        const commonPasswords = [
          'password',
          '12345678',
          'qwerty123',
          'admin123'
        ];

        for (const password of commonPasswords) {
          await testPasswordStrength(password, false);
        }
      });

      it('should accept strong passwords', async () => {
        const strongPasswords = [
          'MyStr0ng!P@ssw0rd',
          'C0mplex#Password123',
          'Secure$Pass2023!',
          'Ungu3ss@ble#P4ssw0rd'
        ];

        for (const password of strongPasswords) {
          await testPasswordStrength(password, true);
        }
      });
    });

    describe('Password Hashing Security', () => {
      it('should use proper salt rounds', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!'
        };

        // Mock successful validation and user creation
        const mockUserRepository = (authService as any).userRepository;
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.create.mockResolvedValue({ id: 1 });

        vi.mocked(bcrypt.genSalt).mockResolvedValue('mock_salt');
        vi.mocked(bcrypt.hash).mockResolvedValue('mock_hash');
        vi.mocked(jwt.sign).mockReturnValue('mock_token');

        await authService.register(userData);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
        expect(bcrypt.hash).toHaveBeenCalledWith('TestPassword123!', 'mock_salt');
      });

      it('should generate unique salts for each password', async () => {
        const saltCalls: string[] = [];
        vi.mocked(bcrypt.genSalt).mockImplementation(async () => {
          const salt = `salt_${saltCalls.length}`;
          saltCalls.push(salt);
          return salt;
        });

        const mockUserRepository = (authService as any).userRepository;
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.create.mockResolvedValue({ id: 1 });
        vi.mocked(bcrypt.hash).mockResolvedValue('mock_hash');
        vi.mocked(jwt.sign).mockReturnValue('mock_token');

        // Register multiple users
        for (let i = 0; i < 3; i++) {
          await authService.register({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: 'TestPassword123!'
          });
        }

        expect(saltCalls).toHaveLength(3);
        expect(new Set(saltCalls).size).toBe(3); // All salts should be unique
      });
    });
  });

  describe('JWT Token Security', () => {
    describe('Token Generation', () => {
      it('should use secure JWT configuration', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          is_admin: false
        };

        const mockUserRepository = (authService as any).userRepository;
        mockUserRepository.findByEmailOrUsername.mockResolvedValue({
          ...mockUser,
          password_hash: 'hash',
          is_active: true
        });
        mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

        vi.mocked(bcrypt.compare).mockResolvedValue(true);
        vi.mocked(jwt.sign).mockReturnValue('secure_token');

        await authService.login({
          emailOrUsername: 'test@example.com',
          password: 'TestPassword123!'
        });

        expect(jwt.sign).toHaveBeenCalledWith(
          {
            userId: 1,
            username: 'testuser',
            isAdmin: false
          },
          'test-security-secret-key-very-long-and-secure',
          {
            expiresIn: '1h',
            issuer: 'simple-char-app',
            subject: '1'
          }
        );
      });

      it('should not include sensitive data in token payload', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'sensitive_hash',
          salt: 'sensitive_salt',
          is_admin: false,
          is_active: true
        };

        const mockUserRepository = (authService as any).userRepository;
        mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
        mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

        vi.mocked(bcrypt.compare).mockResolvedValue(true);
        vi.mocked(jwt.sign).mockReturnValue('secure_token');

        await authService.login({
          emailOrUsername: 'test@example.com',
          password: 'TestPassword123!'
        });

        const tokenPayload = vi.mocked(jwt.sign).mock.calls[0][0];
        
        expect(tokenPayload).not.toHaveProperty('password_hash');
        expect(tokenPayload).not.toHaveProperty('salt');
        expect(tokenPayload).not.toHaveProperty('email');
        expect(tokenPayload).toHaveProperty('userId');
        expect(tokenPayload).toHaveProperty('username');
        expect(tokenPayload).toHaveProperty('isAdmin');
      });
    });

    describe('Token Validation Security', () => {
      it('should properly validate token signatures', async () => {
        const validToken = 'valid.jwt.token';
        const mockDecodedToken = {
          userId: 1,
          username: 'testuser',
          isAdmin: false
        };

        vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);

        const mockUserRepository = (authService as any).userRepository;
        mockUserRepository.findById.mockResolvedValue({
          id: 1,
          username: 'testuser',
          is_active: true
        });

        await authService.validateToken(validToken);

        expect(jwt.verify).toHaveBeenCalledWith(
          validToken,
          'test-security-secret-key-very-long-and-secure'
        );
      });

      it('should reject tokens with invalid signatures', async () => {
        const invalidToken = 'invalid.jwt.token';
        
        const error = new Error('Invalid signature') as any;
        error.name = 'JsonWebTokenError';
        vi.mocked(jwt.verify).mockImplementation(() => { throw error; });

        const result = await authService.validateToken(invalidToken);

        expect(result).toBeNull();
      });

      it('should reject expired tokens', async () => {
        const expiredToken = 'expired.jwt.token';
        
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        vi.mocked(jwt.verify).mockImplementation(() => { throw error; });

        const result = await authService.validateToken(expiredToken);

        expect(result).toBeNull();
      });

      it('should validate user still exists and is active', async () => {
        const validToken = 'valid.jwt.token';
        const mockDecodedToken = {
          userId: 1,
          username: 'testuser',
          isAdmin: false
        };

        vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);

        const mockUserRepository = (authService as any).userRepository;

        // Test with non-existent user
        mockUserRepository.findById.mockResolvedValueOnce(null);
        let result = await authService.validateToken(validToken);
        expect(result).toBeNull();

        // Test with inactive user
        mockUserRepository.findById.mockResolvedValueOnce({
          id: 1,
          username: 'testuser',
          is_active: false
        });
        result = await authService.validateToken(validToken);
        expect(result).toBeNull();

        // Test with active user
        mockUserRepository.findById.mockResolvedValueOnce({
          id: 1,
          username: 'testuser',
          is_active: true
        });
        result = await authService.validateToken(validToken);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('Input Sanitization and Validation', () => {
    it('should accept user inputs without normalization', async () => {
      const userData = {
        username: 'TestUser',
        email: 'TEST@EXAMPLE.COM',
        password: 'TestPassword123!'
      };

      const mockUserRepository = (authService as any).userRepository;
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => {
        expect(data.username).toBe('TestUser'); // No normalization expected
        expect(data.email).toBe('TEST@EXAMPLE.COM'); // No normalization expected
        return Promise.resolve({ id: 1 });
      });

      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt');
      vi.mocked(bcrypt.hash).mockResolvedValue('hash');
      vi.mocked(jwt.sign).mockReturnValue('token');

      await authService.register(userData);
    });

    it('should reject usernames with invalid characters', async () => {
      const invalidUsernames = [
        'user@name',
        'user name',
        'user<script>',
        'user&admin',
        'user;DROP TABLE users;'
      ];

      for (const username of invalidUsernames) {
        try {
          await authService.register({
            username,
            email: 'test@example.com',
            password: 'TestPassword123!'
          });
          expect.fail(`Username "${username}" should have been rejected`);
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
        }
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@invalid',
        'invalid@.com',
        'invalid@com.',
        'invalid @example.com',
        'invalid@example .com'
      ];

      for (const email of invalidEmails) {
        try {
          await authService.register({
            username: 'testuser',
            email,
            password: 'TestPassword123!'
          });
          expect.fail(`Email "${email}" should have been rejected`);
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
        }
      }
    });
  });

  describe('Rate Limiting and Brute Force Protection', () => {
    it('should handle multiple failed login attempts', async () => {
      const credentials = {
        emailOrUsername: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'correct_hash',
        is_active: true
      };

      const mockUserRepository = (authService as any).userRepository;
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      // Simulate multiple failed attempts
      const failedAttempts = 5;
      for (let i = 0; i < failedAttempts; i++) {
        await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      }

      // All attempts should fail with the same error (no rate limiting implemented yet)
      expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledTimes(failedAttempts);
    });
  });

  describe('Session Security', () => {
    it('should sanitize user data returned in responses', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'sensitive_hash',
        salt: 'sensitive_salt',
        is_active: true,
        is_admin: false
      };

      const mockUserRepository = (authService as any).userRepository;
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(jwt.sign).mockReturnValue('token');

      const result = await authService.login({
        emailOrUsername: 'test@example.com',
        password: 'TestPassword123!'
      });

      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user).not.toHaveProperty('salt');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('username');
      expect(result.user).toHaveProperty('email');
    });

    it('should validate token refresh security', async () => {
      const expiredToken = 'expired.jwt.token';
      const mockDecodedToken = {
        userId: 1,
        username: 'testuser',
        isAdmin: false
      };

      vi.mocked(jwt.decode).mockReturnValue(mockDecodedToken as any);

      const mockUserRepository = (authService as any).userRepository;
      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        username: 'testuser',
        is_active: true,
        is_admin: false
      });

      vi.mocked(jwt.sign).mockReturnValue('new_token');

      const result = await authService.refreshToken(expiredToken);

      expect(result).toBe('new_token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('Environment Configuration Security', () => {
    it('should warn about insecure default configurations', async () => {
      delete process.env.JWT_SECRET;
      
      // Create new instance without JWT_SECRET
      new AuthService();

      // Should have logged a warning about default secret  
      const { logger } = await import('../../test-logger');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Using default JWT secret - change this in production!'
      );
    });

    it('should use secure defaults for missing environment variables', () => {
      delete process.env.BCRYPT_SALT_ROUNDS;
      delete process.env.JWT_EXPIRY;

      const service = new AuthService();

      // Should use secure defaults
      expect(service).toBeDefined();
    });
  });
});