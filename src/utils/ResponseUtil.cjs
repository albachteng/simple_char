/**
 * Utility class for standardized API responses - CommonJS version
 */

class ResponseUtil {
  /**
   * Send success response
   */
  static success(res, data, message, statusCode = 200) {
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
   * Send error response
   */
  static error(res, error, statusCode = 500, details) {
    const response = {
      success: false,
      error,
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
   */
  static created(res, data, message = 'Resource created successfully') {
    ResponseUtil.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res) {
    res.status(204).send();
  }

  /**
   * Send bad request response (400)
   */
  static badRequest(res, error = 'Bad request', details) {
    ResponseUtil.error(res, error, 400, details);
  }

  /**
   * Send not found response (404)
   */
  static notFound(res, error = 'Resource not found') {
    ResponseUtil.error(res, error, 404);
  }

  /**
   * Send internal server error response (500)
   */
  static internalError(res, error = 'Internal server error') {
    ResponseUtil.error(res, error, 500);
  }
}

module.exports = { ResponseUtil };