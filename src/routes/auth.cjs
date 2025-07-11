/**
 * Authentication routes for user registration, login, logout, and profile management
 * Provides REST API endpoints for user authentication operations
 */

const { Router } = require('express');
const { AuthController } = require('../controllers/AuthController.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { validateRequest, validationRules } = require('../middleware/validation.cjs');

const router = Router();
const authController = new AuthController();

/**
 * Register a new user account
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @body { username: string, email: string, password: string, confirmPassword?: string }
 * @returns { success: boolean, data: { user: User, token: string }, message: string }
 */
router.post('/register', validateRequest(validationRules.userRegistration), authController.register);

/**
 * Login user and return JWT token
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 * @body { emailOrUsername: string, password: string, rememberMe?: boolean }
 * @returns { success: boolean, data: { user: User, token: string }, message: string }
 */
router.post('/login', validateRequest(validationRules.userLogin), authController.login);

/**
 * Logout user (clear token cookie)
 * @route POST /api/auth/logout
 * @desc Logout user (clear token cookie)
 * @access Private
 * @returns { success: boolean, message: string }
 */
router.post('/logout', authMiddleware.optionalAuth, authController.logout);

/**
 * Get current authenticated user profile
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 * @returns { success: boolean, data: { user: User } }
 */
router.get('/me', authMiddleware.authenticate, authController.me);

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Private
 * @body Token in Authorization header or cookie
 * @returns { success: boolean, data: { token: string }, message: string }
 */
router.post('/refresh', authMiddleware.optionalAuth, authController.refreshToken);

/**
 * Change user password
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 * @body { currentPassword: string, newPassword: string, confirmNewPassword?: string }
 * @returns { success: boolean, message: string }
 */
router.post('/change-password', authMiddleware.authenticate, validateRequest(validationRules.passwordChange), authController.changePassword);

module.exports = router;