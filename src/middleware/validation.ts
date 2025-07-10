import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Request validation middleware factory
 */
export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];
    const data = { ...req.body, ...req.params, ...req.query };

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldErrors = validateField(rule.field, value, rule);
      errors.push(...fieldErrors);
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        errors,
        path: req.path,
        method: req.method,
        body: req.body
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
      return;
    }

    next();
  };
};

/**
 * Validate a single field against a rule
 */
function validateField(fieldName: string, value: any, rule: ValidationRule): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  // Required validation
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`
    });
    return errors; // Don't continue if required field is missing
  }

  // Skip other validations if field is not provided and not required
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Type validation
  if (rule.type) {
    const typeError = validateType(fieldName, value, rule.type);
    if (typeError) {
      errors.push(typeError);
      return errors; // Don't continue if type is wrong
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters long`
      });
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rule.maxLength} characters long`
      });
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} format is invalid`
      });
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rule.min}`
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rule.max}`
      });
    }
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      errors.push({
        field: fieldName,
        message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`
      });
    }
  }

  return errors;
}

/**
 * Validate field type
 */
function validateType(fieldName: string, value: any, expectedType: ValidationRule['type']): { field: string; message: string } | null {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field: fieldName,
          message: `${fieldName} must be a string`
        };
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid number`
        };
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid email address`
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          field: fieldName,
          message: `${fieldName} must be a boolean value`
        };
      }
      break;
  }

  return null;
}

/**
 * Common validation rules
 */
export const validationRules = {
  // User registration
  userRegistration: [
    {
      field: 'username',
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
    {
      field: 'email',
      required: true,
      type: 'email' as const,
      maxLength: 255,
    },
    {
      field: 'password',
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Password must contain at least one number';
        }
        if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {
          return 'Password must contain at least one special character';
        }
        return true;
      },
    },
  ],

  // User login
  userLogin: [
    {
      field: 'emailOrUsername',
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255,
    },
    {
      field: 'password',
      required: true,
      type: 'string' as const,
      minLength: 1,
    },
  ],

  // Password change
  passwordChange: [
    {
      field: 'currentPassword',
      required: true,
      type: 'string' as const,
      minLength: 1,
    },
    {
      field: 'newPassword',
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) {
          return 'New password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'New password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'New password must contain at least one number';
        }
        if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {
          return 'New password must contain at least one special character';
        }
        return true;
      },
    },
  ],

  // User search (admin)
  userSearch: [
    {
      field: 'q',
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
    },
    {
      field: 'limit',
      required: false,
      type: 'number' as const,
      min: 1,
      max: 100,
    },
    {
      field: 'offset',
      required: false,
      type: 'number' as const,
      min: 0,
    },
  ],

  // User ID parameter
  userId: [
    {
      field: 'userId',
      required: true,
      type: 'number' as const,
      min: 1,
    },
  ],
};

/**
 * Rate limiting validation
 */
export const rateLimitValidation = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    const userRequests = requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }

    userRequests.count++;
    next();
  };
};