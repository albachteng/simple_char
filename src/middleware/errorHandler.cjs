/**
 * Error handling middleware for Express application
 * Provides global error handling, async error wrapping, 404 handling, and request timeout management
 */

const { logger } = require('../logger.cjs');

/**
 * API error structure with additional properties
 * @typedef {Error} ApiError
 * @property {number} [statusCode] - HTTP status code
 * @property {string} [code] - Error code for client handling
 * @property {*} [details] - Additional error details
 */

/**
 * Global error handler middleware
 * Should be the last middleware in the chain
 * @param {ApiError} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  } else if (err.message.includes('duplicate key')) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  /** @type {Object} Error response object */
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  // Include error details if available and not in production
  if (err.details && process.env.NODE_ENV !== 'production') {
    response.details = err.details;
  }

  // Include request ID if available
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler for unmatched routes
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Request timeout handler middleware factory
 * @param {number} [timeout=30000] - Timeout in milliseconds
 * @returns {Function} Timeout middleware function
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          code: 'TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, timeout);

    // Clear timeout if response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  timeoutHandler
};