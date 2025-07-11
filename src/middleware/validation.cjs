/**
 * Request validation middleware for Express routes
 * Provides comprehensive field validation with type checking, length limits, and custom rules
 */

const { logger } = require('../logger.cjs');

/**
 * Validation rule configuration
 * @typedef {Object} ValidationRule
 * @property {string} field - Field name to validate
 * @property {boolean} [required] - Whether field is required
 * @property {'string'|'number'|'email'|'boolean'} [type] - Expected field type
 * @property {number} [minLength] - Minimum string length
 * @property {number} [maxLength] - Maximum string length
 * @property {number} [min] - Minimum numeric value
 * @property {number} [max] - Maximum numeric value
 * @property {RegExp} [pattern] - Regular expression pattern for strings
 * @property {function(any): boolean|string} [custom] - Custom validation function
 */

/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} field - Field name with error
 * @property {string} message - Error message
 */

/**
 * Request validation middleware factory
 * Creates middleware that validates request data against specified rules
 * @param {ValidationRule[]} rules - Array of validation rules
 * @returns {Function} Express middleware function
 */
const validateRequest = (rules) => {
  return (req, res, next) => {
    /** @type {ValidationError[]} */
    const errors = [];
    const data = { ...req.body, ...req.params, ...req.query };

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldErrors = validateField(rule.field, value, rule);
      errors.push(...fieldErrors);
    }

    if (errors.length > 0) {
      logger.error('Request validation failed', {
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
 * Validate a single field against a validation rule
 * @param {string} fieldName - Name of the field being validated
 * @param {*} value - Value to validate
 * @param {ValidationRule} rule - Validation rule to apply
 * @returns {ValidationError[]} Array of validation errors
 */
function validateField(fieldName, value, rule) {
  /** @type {ValidationError[]} */
  const errors = [];

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
 * Validate field type against expected type
 * @param {string} fieldName - Name of the field
 * @param {*} value - Value to validate
 * @param {'string'|'number'|'email'|'boolean'} expectedType - Expected type
 * @returns {ValidationError|null} Type validation error or null if valid
 */
function validateType(fieldName, value, expectedType) {
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
 * Pre-defined validation rule sets for common use cases
 */
const validationRules = {
  // User registration validation
  userRegistration: [
    {
      field: 'username',
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
    {
      field: 'email',
      required: true,
      type: 'email',
      maxLength: 255,
    },
    {
      field: 'password',
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      custom: (value) => {
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

  // User login validation
  userLogin: [
    {
      field: 'emailOrUsername',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    {
      field: 'password',
      required: true,
      type: 'string',
      minLength: 1,
    },
  ],

  // Password change validation
  passwordChange: [
    {
      field: 'currentPassword',
      required: true,
      type: 'string',
      minLength: 1,
    },
    {
      field: 'newPassword',
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      custom: (value) => {
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

  // User search validation (admin)
  userSearch: [
    {
      field: 'q',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    {
      field: 'limit',
      required: false,
      type: 'number',
      min: 1,
      max: 100,
    },
    {
      field: 'offset',
      required: false,
      type: 'number',
      min: 0,
    },
  ],

  // User ID parameter validation
  userId: [
    {
      field: 'userId',
      required: true,
      type: 'number',
      min: 1,
    },
  ],
};

/**
 * Rate limiting validation middleware factory
 * Creates in-memory rate limiting based on IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const rateLimitValidation = (maxRequests, windowMs) => {
  /** @type {Map<string, {count: number, resetTime: number}>} */
  const requests = new Map();

  return (req, res, next) => {
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
      logger.error('Rate limit exceeded', {
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

module.exports = {
  validateRequest,
  validationRules,
  rateLimitValidation
};