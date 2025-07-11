import { getDatabase } from '../database/connection';
import { User } from '../types/database';
import { CreateUserData } from '../types/auth';
import { logger } from '../test-logger';

export class UserRepository {
  private db = getDatabase();

  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.db('users')
        .select('*')
        .where('id', id)
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error: (error as Error).message });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db('users')
        .select('*')
        .where('email', email.toLowerCase())
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by email', { email, error: (error as Error).message });
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.db('users')
        .select('*')
        .where('username', username.toLowerCase())
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by username', { username, error: (error as Error).message });
      throw error;
    }
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    try {
      const identifier = emailOrUsername.toLowerCase();
      
      const user = await this.db('users')
        .select('*')
        .where(function() {
          this.where('email', identifier)
              .orWhere('username', identifier);
        })
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by email or username', { 
        emailOrUsername, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async create(userData: CreateUserData & { password_hash: string; salt: string }): Promise<User> {
    try {
      const [user] = await this.db('users')
        .insert({
          username: userData.username.toLowerCase(),
          email: userData.email.toLowerCase(),
          password_hash: userData.password_hash,
          salt: userData.salt,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          is_admin: false
        })
        .returning('*');

      logger.info('User created successfully', { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      });

      return user;
    } catch (error) {
      // Handle unique constraint violations
      if ((error as any).code === '23505') {
        if ((error as any).constraint?.includes('username')) {
          throw new Error('Username already exists');
        }
        if ((error as any).constraint?.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      
      logger.error('Failed to create user', { 
        username: userData.username,
        email: userData.email,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          last_login: new Date(),
          updated_at: new Date()
        });

      logger.debug('Updated user last login', { userId });
    } catch (error) {
      logger.error('Failed to update user last login', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async updatePassword(userId: number, passwordHash: string, salt: string): Promise<void> {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          password_hash: passwordHash,
          salt: salt,
          updated_at: new Date()
        });

      logger.info('User password updated', { userId });
    } catch (error) {
      logger.error('Failed to update user password', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async deactivateUser(userId: number): Promise<void> {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          is_active: false,
          updated_at: new Date()
        });

      logger.info('User deactivated', { userId });
    } catch (error) {
      logger.error('Failed to deactivate user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async reactivateUser(userId: number): Promise<void> {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          is_active: true,
          updated_at: new Date()
        });

      logger.info('User reactivated', { userId });
    } catch (error) {
      logger.error('Failed to reactivate user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentRegistrations: number;
  }> {
    try {
      const [stats] = await this.db('users')
        .select([
          this.db.raw('COUNT(*) as total_users'),
          this.db.raw('COUNT(*) FILTER (WHERE is_active = true) as active_users'),
          this.db.raw('COUNT(*) FILTER (WHERE is_admin = true) as admin_users'),
          this.db.raw(`COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_registrations`)
        ]);

      return {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        adminUsers: parseInt(stats.admin_users),
        recentRegistrations: parseInt(stats.recent_registrations)
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error: (error as Error).message });
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      const users = await this.db('users')
        .select('id', 'username', 'email', 'created_at', 'last_login', 'is_active', 'is_admin')
        .where(function() {
          this.where('username', 'ilike', `%${query}%`)
              .orWhere('email', 'ilike', `%${query}%`);
        })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return users;
    } catch (error) {
      logger.error('Failed to search users', { query, error: (error as Error).message });
      throw error;
    }
  }
}