/**
 * Authentication service handling user registration, login, and token management
 * Provides secure user authentication with bcrypt hashing and JWT tokens
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepository } = require('../repositories/UserRepository.cjs');
const { logger } = require('../logger.cjs');

/**
 * User data structure from database
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
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
 * @property {string} password - Plain text password
 */

/**
 * Login credentials structure
 * @typedef {Object} LoginCredentials
 * @property {string} emailOrUsername - Email address or username
 * @property {string} password - Plain text password
 */

/**
 * Authentication response structure
 * @typedef {Object} AuthResponse
 * @property {User} user - User object (sanitized)
 * @property {string} token - JWT authentication token
 */

/**
 * JWT token payload structure
 * @typedef {Object} AuthToken
 * @property {number} userId - User ID
 * @property {string} username - Username
 * @property {boolean} isAdmin - Whether user is admin
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} field - Field name with error
 * @property {string} message - Error message
 */

/**
 * Authentication service class
 * Handles user registration, login, password management, and token operations
 */
class AuthService {
  constructor() {
    /** @type {UserRepository} User repository instance */
    this.userRepository = new UserRepository();
    
    /** @type {string} JWT secret key */
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me-in-production';
    
    /** @type {number} Bcrypt salt rounds */
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    
    /** @type {string} JWT token expiry time */
    this.tokenExpiry = process.env.JWT_EXPIRY || '7d';

    if (this.jwtSecret === 'default-secret-change-me-in-production') {
      logger.error('Using default JWT secret - change this in production!');
    }
  }

  /**
   * Register new user account
   * @param {CreateUserData} userData - User registration data
   * @returns {Promise<AuthResponse>} User and authentication token
   * @throws {Error} If validation fails or user already exists
   */
  async register(userData) {
    // Validate input data
    const validationErrors = this.validateRegistrationData(userData);
    if (validationErrors.length > 0) {
      const error = new Error('Validation failed');
      error.validationErrors = validationErrors;
      throw error;
    }

    // Check if user already exists
    const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('Email already registered');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const salt = await bcrypt.genSalt(this.saltRounds);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    try {
      // Create user
      const user = await this.userRepository.create({
        username: userData.username,
        email: userData.email,
        password: userData.password, // This won't be used, just for interface compatibility
        password_hash: passwordHash,
        salt: salt
      });

      logger.info('User registered successfully', { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      });

      // Generate token
      const token = this.generateToken(user);

      return { 
        user: this.sanitizeUser(user), 
        token 
      };
    } catch (error) {
      logger.error('User registration failed', { 
        username: userData.username,
        email: userData.email,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {LoginCredentials} credentials - Login credentials
   * @returns {Promise<AuthResponse>} User and authentication token
   * @throws {Error} If credentials are invalid or user not found
   */
  async login(credentials) {
    // Validate input
    if (!credentials.emailOrUsername || !credentials.password) {
      throw new Error('Email/username and password are required');
    }

    // Find user by email or username
    const user = await this.userRepository.findByEmailOrUsername(credentials.emailOrUsername);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValidPassword) {
      logger.error('Failed login attempt', { 
        emailOrUsername: credentials.emailOrUsername,
        userId: user.id 
      });
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    logger.info('User logged in successfully', { 
      userId: user.id, 
      username: user.username 
    });

    // Generate token
    const token = this.generateToken(user);

    return { 
      user: this.sanitizeUser(user), 
      token 
    };
  }

  /**
   * Validate JWT token and return user
   * @param {string} token - JWT token
   * @returns {Promise<User|null>} User object or null if invalid
   */
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Find user to ensure they still exist and are active
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user || !user.is_active) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Token expired', { error: error.message });
      } else if (error.name === 'JsonWebTokenError') {
        logger.error('Invalid token provided', { error: error.message });
      } else {
        logger.error('Token validation failed', { error: error.message });
      }
      return null;
    }
  }

  /**
   * Refresh expired JWT token
   * @param {string} token - Expired JWT token
   * @returns {Promise<string|null>} New token or null if invalid
   */
  async refreshToken(token) {
    try {
      // Verify the token (even if expired, we can still decode it)
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.userId) {
        return null;
      }

      // Check if user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.is_active) {
        return null;
      }

      // Generate new token
      const newToken = this.generateToken(user);
      
      logger.debug('Token refreshed', { userId: user.id });
      
      return newToken;
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      return null;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @throws {Error} If current password is incorrect or validation fails
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = this.validatePassword(newPassword);
    if (passwordValidation.length > 0) {
      const error = new Error('Password validation failed');
      error.validationErrors = passwordValidation;
      throw error;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(this.saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.userRepository.updatePassword(userId, passwordHash, salt);

    logger.info('User password changed', { userId });
  }

  /**
   * Generate JWT token for user
   * @param {User} user - User object
   * @returns {string} JWT token
   * @private
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.tokenExpiry,
      issuer: 'simple-char-app',
      subject: user.id.toString()
    });
  }

  /**
   * Remove sensitive fields from user object
   * @param {*} user - User object with sensitive fields
   * @returns {User} Sanitized user object
   * @private
   */
  sanitizeUser(user) {
    // Remove sensitive fields
    const { password_hash, salt, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Validate user registration data
   * @param {CreateUserData} userData - User registration data
   * @returns {ValidationError[]} Array of validation errors
   * @private
   */
  validateRegistrationData(userData) {
    const errors = [];

    // Username validation
    if (!userData.username || userData.username.trim().length === 0) {
      errors.push({ field: 'username', message: 'Username is required' });
    } else if (userData.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    } else if (userData.username.length > 50) {
      errors.push({ field: 'username', message: 'Username must be less than 50 characters' });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and hyphens' });
    }

    // Email validation
    if (!userData.email || userData.email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    } else if (userData.email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
    }

    // Password validation
    const passwordErrors = this.validatePassword(userData.password);
    errors.push(...passwordErrors);

    return errors;
  }

  /**
   * Validate password strength and format
   * @param {string} password - Password to validate
   * @returns {ValidationError[]} Array of validation errors
   * @private
   */
  validatePassword(password) {
    const errors = [];

    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
      return errors;
    }

    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one number' });
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one special character' });
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push({ field: 'password', message: 'Password is too common and easily guessed' });
    }

    return errors;
  }

  /**
   * Promote user to admin (admin function)
   * @param {number} userId - User ID to promote
   * @param {number} promotedBy - ID of admin promoting the user
   * @returns {Promise<void>}
   */
  async promoteToAdmin(userId, promotedBy) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.db('users')
      .where('id', userId)
      .update({
        is_admin: true,
        updated_at: new Date()
      });

    logger.info('User promoted to admin', { userId, promotedBy });
  }

  /**
   * Get user statistics (admin function)
   * @returns {Promise<*>} User statistics
   */
  async getUserStats() {
    return await this.userRepository.getUserStats();
  }
}

module.exports = { AuthService };