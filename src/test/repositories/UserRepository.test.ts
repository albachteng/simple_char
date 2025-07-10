import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserRepository } from '../../repositories/UserRepository';
import { getDatabase } from '../../database/connection';
import { logger } from '../../logger';

// Mock the database connection
vi.mock('../../database/connection');

// Mock logger properly
vi.mock('../../logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create a mock database object with chaining methods
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
      raw: vi.fn().mockImplementation((query) => query)
    };

    // Mock the getDatabase function to return our mock
    (getDatabase as any).mockReturnValue(mockDb);
    
    // Mock the knex function call directly
    vi.mocked(getDatabase).mockImplementation(() => {
      const knexMock = vi.fn().mockImplementation((tableName: string) => mockDb);
      return knexMock as any;
    });

    userRepository = new UserRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        is_admin: false
      };

      mockDb.first.mockResolvedValue(mockUser);

      const result = await userRepository.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalledWith('*');
      expect(mockDb.where).toHaveBeenCalledWith('id', 1);
      expect(mockDb.first).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      mockDb.first.mockResolvedValue(undefined);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockDb.first.mockRejectedValue(error);

      await expect(userRepository.findById(1)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to find user by ID',
        { id: 1, error: error.message }
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true
      };

      mockDb.first.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(mockDb.where).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('should return null when user not found', async () => {
      mockDb.first.mockResolvedValue(undefined);

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      mockDb.first.mockResolvedValue(null);

      await userRepository.findByEmail('UPPER@EXAMPLE.COM');

      expect(mockDb.where).toHaveBeenCalledWith('email', 'upper@example.com');
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      mockDb.first.mockResolvedValue(mockUser);

      const result = await userRepository.findByUsername('TestUser');

      expect(result).toEqual(mockUser);
      expect(mockDb.where).toHaveBeenCalledWith('username', 'testuser');
    });

    it('should normalize username to lowercase', async () => {
      mockDb.first.mockResolvedValue(null);

      await userRepository.findByUsername('UPPERCASE');

      expect(mockDb.where).toHaveBeenCalledWith('username', 'uppercase');
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockDb.first.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmailOrUsername('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should find user by username', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockDb.first.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmailOrUsername('testuser');

      expect(result).toEqual(mockUser);
    });

    it('should normalize input to lowercase', async () => {
      mockDb.first.mockResolvedValue(null);

      await userRepository.findByEmailOrUsername('UPPERCASE@EXAMPLE.COM');

      // The where function should be called with our function
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password_hash: 'hashed_password',
        salt: 'salt123'
      };

      const mockCreatedUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        is_admin: false
      };

      mockDb.returning.mockResolvedValue([mockCreatedUser]);

      const result = await userRepository.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockDb.insert).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        salt: 'salt123',
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        is_active: true,
        is_admin: false
      });
      expect(logger.info).toHaveBeenCalledWith(
        'User created successfully',
        {
          userId: 1,
          username: 'newuser',
          email: 'new@example.com'
        }
      );
    });

    it('should handle username constraint violation', async () => {
      const userData = {
        username: 'existing',
        email: 'new@example.com',
        password: 'password123',
        password_hash: 'hashed_password',
        salt: 'salt123'
      };

      const error = new Error('Constraint violation') as any;
      error.code = '23505';
      error.constraint = 'users_username_unique';

      mockDb.returning.mockRejectedValue(error);

      await expect(userRepository.create(userData)).rejects.toThrow('Username already exists');
    });

    it('should handle email constraint violation', async () => {
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        password_hash: 'hashed_password',
        salt: 'salt123'
      };

      const error = new Error('Constraint violation') as any;
      error.code = '23505';
      error.constraint = 'users_email_unique';

      mockDb.returning.mockRejectedValue(error);

      await expect(userRepository.create(userData)).rejects.toThrow('Email already exists');
    });

    it('should normalize username and email to lowercase', async () => {
      const userData = {
        username: 'NewUser',
        email: 'NEW@EXAMPLE.COM',
        password: 'password123',
        password_hash: 'hashed_password',
        salt: 'salt123'
      };

      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      await userRepository.create(userData);

      expect(mockDb.insert).toHaveBeenCalledWith(expect.objectContaining({
        username: 'newuser',
        email: 'new@example.com'
      }));
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockDb.update.mockResolvedValue(1);

      await userRepository.updateLastLogin(1);

      expect(mockDb.where).toHaveBeenCalledWith('id', 1);
      expect(mockDb.update).toHaveBeenCalledWith({
        last_login: expect.any(Date),
        updated_at: expect.any(Date)
      });
      expect(logger.debug).toHaveBeenCalledWith('Updated user last login', { userId: 1 });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockDb.update.mockRejectedValue(error);

      await expect(userRepository.updateLastLogin(1)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to update user last login',
        { userId: 1, error: error.message }
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockDb.update.mockResolvedValue(1);

      await userRepository.updatePassword(1, 'new_hash', 'new_salt');

      expect(mockDb.where).toHaveBeenCalledWith('id', 1);
      expect(mockDb.update).toHaveBeenCalledWith({
        password_hash: 'new_hash',
        salt: 'new_salt',
        updated_at: expect.any(Date)
      });
      expect(logger.info).toHaveBeenCalledWith('User password updated', { userId: 1 });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      mockDb.update.mockResolvedValue(1);

      await userRepository.deactivateUser(1);

      expect(mockDb.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(Date)
      });
      expect(logger.info).toHaveBeenCalledWith('User deactivated', { userId: 1 });
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      mockDb.update.mockResolvedValue(1);

      await userRepository.reactivateUser(1);

      expect(mockDb.update).toHaveBeenCalledWith({
        is_active: true,
        updated_at: expect.any(Date)
      });
      expect(logger.info).toHaveBeenCalledWith('User reactivated', { userId: 1 });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total_users: '10',
        active_users: '8',
        admin_users: '2',
        recent_registrations: '3'
      };

      mockDb.select.mockResolvedValue([mockStats]);

      const result = await userRepository.getUserStats();

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        adminUsers: 2,
        recentRegistrations: 3
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: 1, username: 'testuser', email: 'test@example.com' },
        { id: 2, username: 'anotheruser', email: 'another@example.com' }
      ];

      mockDb.offset.mockResolvedValue(mockUsers);

      const result = await userRepository.searchUsers('test', 10, 0);

      expect(result).toEqual(mockUsers);
      expect(mockDb.select).toHaveBeenCalledWith(
        'id', 'username', 'email', 'created_at', 'last_login', 'is_active', 'is_admin'
      );
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });

    it('should use default limit and offset', async () => {
      mockDb.offset.mockResolvedValue([]);

      await userRepository.searchUsers('test');

      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });
  });
});