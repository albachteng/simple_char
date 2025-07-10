import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest, validationRules } from '../middleware/validation';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin privileges
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get user statistics
 * @access  Admin only
 * @returns { success: boolean, data: { totalUsers: number, activeUsers: number, adminUsers: number, recentRegistrations: number } }
 */
router.get('/stats', adminController.getUserStats);

/**
 * @route   GET /api/admin/users/search
 * @desc    Search users by username or email
 * @access  Admin only
 * @query   { q: string, limit?: number, offset?: number }
 * @returns { success: boolean, data: { users: User[], query: string, limit: number, offset: number } }
 */
router.get('/users/search', validateRequest(validationRules.userSearch), adminController.searchUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user by ID
 * @access  Admin only
 * @params  { userId: number }
 * @returns { success: boolean, data: { user: User } }
 */
router.get('/users/:userId', validateRequest(validationRules.userId), adminController.getUserById);

/**
 * @route   POST /api/admin/users/:userId/promote
 * @desc    Promote user to admin
 * @access  Admin only
 * @params  { userId: number }
 * @returns { success: boolean, message: string }
 */
router.post('/users/:userId/promote', validateRequest(validationRules.userId), adminController.promoteToAdmin);

/**
 * @route   POST /api/admin/users/:userId/deactivate
 * @desc    Deactivate user account
 * @access  Admin only
 * @params  { userId: number }
 * @returns { success: boolean, message: string }
 */
router.post('/users/:userId/deactivate', validateRequest(validationRules.userId), adminController.deactivateUser);

/**
 * @route   POST /api/admin/users/:userId/reactivate
 * @desc    Reactivate user account
 * @access  Admin only
 * @params  { userId: number }
 * @returns { success: boolean, message: string }
 */
router.post('/users/:userId/reactivate', validateRequest(validationRules.userId), adminController.reactivateUser);

export default router;