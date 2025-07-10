// Authentication types

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  is_admin: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthToken {
  userId: number;
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

// Validation errors
export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthError {
  message: string;
  code: string;
  validationErrors?: ValidationError[];
}

// Session data
export interface SessionData {
  userId: number;
  username: string;
  isAdmin: boolean;
  sessionId: number;
}

// API request/response types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthMiddlewareRequest extends Request {
  user?: SessionData;
}

// Password validation rules
export interface PasswordValidation {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}