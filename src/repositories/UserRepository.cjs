/**
 * User repository for database operations related to users
 * Handles all user CRUD operations, authentication queries, and user management
 */

const { getDatabase } = require('../database/connection.cjs');
const { logger } = require('../logger.cjs');

/**
 * User data structure from database
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username (unique)
 * @property {string} email - Email address (unique)
 * @property {string} password_hash - Hashed password
 * @property {string} salt - Password salt
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 * @property {Date} [last_login] - Last login timestamp
 * @property {boolean} is_active - Whether user account is active
 * @property {boolean} is_admin - Whether user has admin privileges
 */

/**
 * User creation data structure
 * @typedef {Object} CreateUserData
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} password - Plain text password (not stored)
 * @property {string} password_hash - Hashed password
 * @property {string} salt - Password salt
 */

/**
 * User statistics structure
 * @typedef {Object} UserStats
 * @property {number} totalUsers - Total number of users
 * @property {number} activeUsers - Number of active users
 * @property {number} adminUsers - Number of admin users
 * @property {number} recentRegistrations - Registrations in last 7 days
 */

/**
 * User repository class for database operations
 * Provides methods for user management, authentication, and admin operations
 */
class UserRepository {
  constructor() {
    /** @type {import('knex').Knex} Database connection */
    this.db = getDatabase();
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} User object or null if not found
   */
  async findById(id) {
    try {
      const user = await this.db('users')
        .select('*')
        .where('id', id)
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find user by email address
   * @param {string} email - Email address
   * @returns {Promise<User|null>} User object or null if not found
   */
  async findByEmail(email) {
    try {
      const user = await this.db('users')
        .select('*')
        .where('email', email.toLowerCase())
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by email', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User object or null if not found
   */
  async findByUsername(username) {
    try {
      const user = await this.db('users')
        .select('*')
        .where('username', username.toLowerCase())
        .first();
      
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by username', { username, error: error.message });
      throw error;
    }
  }

  /**
   * Find user by email or username (for login)
   * @param {string} emailOrUsername - Email address or username
   * @returns {Promise<User|null>} User object or null if not found
   */
  async findByEmailOrUsername(emailOrUsername) {
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
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create new user account
   * @param {CreateUserData} userData - User creation data with hashed password
   * @returns {Promise<User>} Created user object
   * @throws {Error} If username or email already exists
   */
  async create(userData) {
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
      if (error.code === '23505') {
        if (error.constraint?.includes('username')) {
          throw new Error('Username already exists');
        }
        if (error.constraint?.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      
      logger.error('Failed to create user', { 
        username: userData.username,
        email: userData.email,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          last_login: new Date(),
          updated_at: new Date()
        });

      logger.debug('Updated user last login', { userId });
    } catch (error) {
      logger.error('Failed to update user last login', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {number} userId - User ID
   * @param {string} passwordHash - New hashed password
   * @param {string} salt - New salt
   * @returns {Promise<void>}
   */
  async updatePassword(userId, passwordHash, salt) {
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
      logger.error('Failed to update user password', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async deactivateUser(userId) {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          is_active: false,
          updated_at: new Date()
        });

      logger.info('User deactivated', { userId });
    } catch (error) {
      logger.error('Failed to deactivate user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Reactivate user account
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async reactivateUser(userId) {
    try {
      await this.db('users')
        .where('id', userId)
        .update({
          is_active: true,
          updated_at: new Date()
        });

      logger.info('User reactivated', { userId });
    } catch (error) {
      logger.error('Failed to reactivate user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user statistics for admin dashboard
   * @returns {Promise<UserStats>} User statistics
   */
  async getUserStats() {
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
      logger.error('Failed to get user stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Search users by username or email
   * @param {string} query - Search query
   * @param {number} [limit=20] - Maximum number of results
   * @param {number} [offset=0] - Number of results to skip
   * @returns {Promise<User[]>} Array of matching users
   */
  async searchUsers(query, limit = 20, offset = 0) {
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
      logger.error('Failed to search users', { query, error: error.message });
      throw error;
    }
  }
}

module.exports = { UserRepository };