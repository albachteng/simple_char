import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/database';
import { CreateUserData, LoginCredentials, AuthResponse, AuthToken, ValidationError } from '../types/auth';
import { logger } from '../test-logger';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private saltRounds: number;
  private tokenExpiry: string;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me-in-production';
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.tokenExpiry = process.env.JWT_EXPIRY || '7d';

    if (this.jwtSecret === 'default-secret-change-me-in-production') {
      logger.error('Using default JWT secret - change this in production!');
    }
  }

  async register(userData: CreateUserData): Promise<AuthResponse> {
    // Validate input data
    const validationErrors = this.validateRegistrationData(userData);
    if (validationErrors.length > 0) {
      const error = new Error('Validation failed') as any;
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
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
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

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthToken;
      
      // Find user to ensure they still exist and are active
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user || !user.is_active) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Token expired', { error: (error as Error).message });
      } else if (error.name === 'JsonWebTokenError') {
        logger.error('Invalid token provided', { error: (error as Error).message });
      } else {
        logger.error('Token validation failed', { error: (error as Error).message });
      }
      return null;
    }
  }

  async refreshToken(token: string): Promise<string | null> {
    try {
      // Verify the token (even if expired, we can still decode it)
      const decoded = jwt.decode(token) as AuthToken;
      
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
      logger.error('Token refresh failed', { error: (error as Error).message });
      return null;
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
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
      const error = new Error('Password validation failed') as any;
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

  private generateToken(user: User): string {
    const payload: Omit<AuthToken, 'iat' | 'exp'> = {
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

  private sanitizeUser(user: User): User {
    // Remove sensitive fields
    const { password_hash, salt, ...sanitized } = user as any;
    return sanitized;
  }

  private validateRegistrationData(userData: CreateUserData): ValidationError[] {
    const errors: ValidationError[] = [];

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

  private validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

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

  // Admin functions
  async promoteToAdmin(userId: number, promotedBy: number): Promise<void> {
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

  async getUserStats(): Promise<any> {
    return await this.userRepository.getUserStats();
  }
}