/**
 * API response utilities for standardized HTTP responses
 * Provides consistent response formatting and utility methods for common HTTP status codes
 */

/**
 * Success response structure
 * @typedef {Object} ApiSuccessResponse
 * @property {true} success - Always true for success responses
 * @property {*} data - Response data
 * @property {string} [message] - Optional success message
 * @property {string} [timestamp] - ISO timestamp
 * @property {string} [requestId] - Request ID for tracing
 */

/**
 * Error response structure
 * @typedef {Object} ApiErrorResponse
 * @property {false} success - Always false for error responses
 * @property {string} error - Error message
 * @property {string} code - Error code for client handling
 * @property {*} [details] - Additional error details
 * @property {string} [timestamp] - ISO timestamp
 * @property {string} [requestId] - Request ID for tracing
 */

/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} field - Field name with error
 * @property {string} message - Error message
 */

/**
 * Utility class for standardized API responses
 * Provides static methods for common HTTP response patterns
 */
class ResponseUtil {
  /**
   * Send standardized success response
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Response data
   * @param {string} [message] - Optional success message
   * @param {number} [statusCode=200] - HTTP status code
   * @returns {void}
   */
  static success(res, data, message, statusCode = 200) {
    /** @type {ApiSuccessResponse} */
    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };

    if (message) {
      response.message = message;
    }

    // Add request ID if available
    const requestId = res.get('X-Request-ID');
    if (requestId) {
      response.requestId = requestId;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Send standardized error response
   * @param {import('express').Response} res - Express response object
   * @param {string} error - Error message
   * @param {string} code - Error code for client handling
   * @param {number} [statusCode=400] - HTTP status code
   * @param {*} [details] - Additional error details
   * @returns {void}
   */
  static error(res, error, code, statusCode = 400, details) {
    /** @type {ApiErrorResponse} */
    const response = {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString()
    };

    if (details) {
      response.details = details;
    }

    // Add request ID if available
    const requestId = res.get('X-Request-ID');
    if (requestId) {
      response.requestId = requestId;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Response data
   * @param {string} [message='Resource created successfully'] - Success message
   * @returns {void}
   */
  static created(res, data, message = 'Resource created successfully') {
    ResponseUtil.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   * @param {import('express').Response} res - Express response object
   * @returns {void}
   */
  static noContent(res) {
    res.status(204).send();
  }

  /**
   * Send bad request response (400)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Bad request'] - Error message
   * @param {*} [details] - Additional error details
   * @returns {void}
   */
  static badRequest(res, error = 'Bad request', details) {
    ResponseUtil.error(res, error, 'BAD_REQUEST', 400, details);
  }

  /**
   * Send unauthorized response (401)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Unauthorized'] - Error message
   * @param {string} [code='UNAUTHORIZED'] - Error code
   * @returns {void}
   */
  static unauthorized(res, error = 'Unauthorized', code = 'UNAUTHORIZED') {
    ResponseUtil.error(res, error, code, 401);
  }

  /**
   * Send forbidden response (403)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Forbidden'] - Error message
   * @param {string} [code='FORBIDDEN'] - Error code
   * @returns {void}
   */
  static forbidden(res, error = 'Forbidden', code = 'FORBIDDEN') {
    ResponseUtil.error(res, error, code, 403);
  }

  /**
   * Send not found response (404)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Resource not found'] - Error message
   * @param {string} [code='NOT_FOUND'] - Error code
   * @returns {void}
   */
  static notFound(res, error = 'Resource not found', code = 'NOT_FOUND') {
    ResponseUtil.error(res, error, code, 404);
  }

  /**
   * Send conflict response (409)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Resource conflict'] - Error message
   * @param {string} [code='CONFLICT'] - Error code
   * @returns {void}
   */
  static conflict(res, error = 'Resource conflict', code = 'CONFLICT') {
    ResponseUtil.error(res, error, code, 409);
  }

  /**
   * Send validation error response (422)
   * @param {import('express').Response} res - Express response object
   * @param {ValidationError[]} errors - Array of validation errors
   * @param {string} [message='Validation failed'] - Error message
   * @returns {void}
   */
  static validationError(res, errors, message = 'Validation failed') {
    ResponseUtil.error(res, message, 'VALIDATION_ERROR', 422, errors);
  }

  /**
   * Send rate limited response (429)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Too many requests'] - Error message
   * @param {number} [retryAfter] - Retry after seconds
   * @returns {void}
   */
  static rateLimited(res, error = 'Too many requests', retryAfter) {
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    ResponseUtil.error(res, error, 'RATE_LIMITED', 429);
  }

  /**
   * Send internal server error response (500)
   * @param {import('express').Response} res - Express response object
   * @param {string} [error='Internal server error'] - Error message
   * @param {string} [code='INTERNAL_ERROR'] - Error code
   * @returns {void}
   */
  static internalError(res, error = 'Internal server error', code = 'INTERNAL_ERROR') {
    ResponseUtil.error(res, error, code, 500);
  }
}

/**
 * Express middleware to add response utility methods to res object
 * Attaches convenience methods to the response object for easy use in route handlers
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
const addResponseUtils = (req, res, next) => {
  // Add utility methods to response object
  res.success = (data, message, statusCode) =>
    ResponseUtil.success(res, data, message, statusCode);

  res.error = (error, code, statusCode, details) =>
    ResponseUtil.error(res, error, code, statusCode, details);

  res.created = (data, message) =>
    ResponseUtil.created(res, data, message);

  res.noContent = () => ResponseUtil.noContent(res);

  res.badRequest = (error, details) =>
    ResponseUtil.badRequest(res, error, details);

  res.unauthorized = (error, code) =>
    ResponseUtil.unauthorized(res, error, code);

  res.forbidden = (error, code) =>
    ResponseUtil.forbidden(res, error, code);

  res.notFound = (error, code) =>
    ResponseUtil.notFound(res, error, code);

  res.conflict = (error, code) =>
    ResponseUtil.conflict(res, error, code);

  res.validationError = (errors, message) =>
    ResponseUtil.validationError(res, errors, message);

  res.rateLimited = (error, retryAfter) =>
    ResponseUtil.rateLimited(res, error, retryAfter);

  res.internalError = (error, code) =>
    ResponseUtil.internalError(res, error, code);

  next();
};

module.exports = {
  ResponseUtil,
  addResponseUtils
};