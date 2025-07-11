/**
 * Admin controller handling administrative operations and user management
 * Provides REST API endpoints for admin-only functionality like user management and statistics
 */

const { AuthService } = require('../services/AuthService.cjs');
const { UserRepository } = require('../repositories/UserRepository.cjs');
const { logger } = require('../logger.cjs');

/**
 * User statistics structure
 * @typedef {Object} UserStats
 * @property {number} totalUsers - Total number of users
 * @property {number} activeUsers - Number of active users
 * @property {number} adminUsers - Number of admin users
 * @property {number} recentRegistrations - Registrations in last 7 days
 */

/**
 * User search parameters
 * @typedef {Object} UserSearchParams
 * @property {string} q - Search query
 * @property {string} [limit] - Maximum results (default 20)
 * @property {string} [offset] - Results to skip (default 0)
 */

/**
 * Admin controller class
 * Handles all administrative HTTP endpoints requiring admin privileges
 */
class AdminController {
  constructor() {
    /** @type {AuthService} Authentication service instance */
    this.authService = new AuthService();
    
    /** @type {UserRepository} User repository instance */
    this.userRepository = new UserRepository();
  }

  /**
   * Get user statistics for admin dashboard
   * @route GET /api/admin/stats
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  getUserStats = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const stats = await this.authService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get user stats', {
        error: error.message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Search users by username or email
   * @route GET /api/admin/users/search
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  searchUsers = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const { q: query, limit = '20', offset = '0' } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'MISSING_QUERY'
        });
        return;
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid limit or offset parameters',
          code: 'INVALID_PARAMS'
        });
        return;
      }

      const users = await this.userRepository.searchUsers(query, limitNum, offsetNum);

      res.status(200).json({
        success: true,
        data: {
          users,
          query,
          limit: limitNum,
          offset: offsetNum
        }
      });
    } catch (error) {
      logger.error('User search failed', {
        error: error.message,
        adminId: req.user?.userId,
        query: req.query.q
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Get user details by ID (admin only)
   * @route GET /api/admin/users/:userId
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  getUserById = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      const user = await this.userRepository.findById(userIdNum);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Remove sensitive fields from user object
      const { password_hash, salt, ...safeUser } = user;

      res.status(200).json({
        success: true,
        data: {
          user: safeUser
        }
      });
    } catch (error) {
      logger.error('Failed to get user by ID', {
        error: error.message,
        adminId: req.user?.userId,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Promote user to admin status
   * @route POST /api/admin/users/:userId/promote
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  promoteToAdmin = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      // Check if user exists
      const user = await this.userRepository.findById(userIdNum);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check if user is already an admin
      if (user.is_admin) {
        res.status(400).json({
          success: false,
          error: 'User is already an admin',
          code: 'ALREADY_ADMIN'
        });
        return;
      }

      await this.authService.promoteToAdmin(userIdNum, req.user.userId);

      logger.info('User promoted to admin', {
        promotedUserId: userIdNum,
        promotedBy: req.user.userId,
        promotedByUsername: req.user.username
      });

      res.status(200).json({
        success: true,
        message: 'User promoted to admin successfully'
      });
    } catch (error) {
      logger.error('Failed to promote user to admin', {
        error: error.message,
        adminId: req.user?.userId,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Deactivate user account
   * @route POST /api/admin/users/:userId/deactivate
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  deactivateUser = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      // Prevent self-deactivation
      if (userIdNum === req.user.userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account',
          code: 'SELF_DEACTIVATION'
        });
        return;
      }

      // Check if user exists
      const user = await this.userRepository.findById(userIdNum);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check if user is already inactive
      if (!user.is_active) {
        res.status(400).json({
          success: false,
          error: 'User is already deactivated',
          code: 'ALREADY_DEACTIVATED'
        });
        return;
      }

      await this.userRepository.deactivateUser(userIdNum);

      logger.info('User deactivated', {
        deactivatedUserId: userIdNum,
        deactivatedBy: req.user.userId,
        deactivatedByUsername: req.user.username
      });

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      logger.error('Failed to deactivate user', {
        error: error.message,
        adminId: req.user?.userId,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Reactivate deactivated user account
   * @route POST /api/admin/users/:userId/reactivate
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  reactivateUser = async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
        return;
      }

      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      // Check if user exists
      const user = await this.userRepository.findById(userIdNum);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check if user is already active
      if (user.is_active) {
        res.status(400).json({
          success: false,
          error: 'User is already active',
          code: 'ALREADY_ACTIVE'
        });
        return;
      }

      await this.userRepository.reactivateUser(userIdNum);

      logger.info('User reactivated', {
        reactivatedUserId: userIdNum,
        reactivatedBy: req.user.userId,
        reactivatedByUsername: req.user.username
      });

      res.status(200).json({
        success: true,
        message: 'User reactivated successfully'
      });
    } catch (error) {
      logger.error('Failed to reactivate user', {
        error: error.message,
        adminId: req.user?.userId,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

module.exports = { AdminController };