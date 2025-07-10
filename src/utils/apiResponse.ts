import { Response } from 'express';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Utility class for standardized API responses
 */
export class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: ApiSuccessResponse<T> = {
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
  static error(
    res: Response,
    error: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ): void {
    const response: ApiErrorResponse = {
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
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): void {
    ResponseUtil.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send bad request response (400)
   */
  static badRequest(
    res: Response,
    error: string = 'Bad request',
    details?: any
  ): void {
    ResponseUtil.error(res, error, 'BAD_REQUEST', 400, details);
  }

  /**
   * Send unauthorized response (401)
   */
  static unauthorized(
    res: Response,
    error: string = 'Unauthorized',
    code: string = 'UNAUTHORIZED'
  ): void {
    ResponseUtil.error(res, error, code, 401);
  }

  /**
   * Send forbidden response (403)
   */
  static forbidden(
    res: Response,
    error: string = 'Forbidden',
    code: string = 'FORBIDDEN'
  ): void {
    ResponseUtil.error(res, error, code, 403);
  }

  /**
   * Send not found response (404)
   */
  static notFound(
    res: Response,
    error: string = 'Resource not found',
    code: string = 'NOT_FOUND'
  ): void {
    ResponseUtil.error(res, error, code, 404);
  }

  /**
   * Send conflict response (409)
   */
  static conflict(
    res: Response,
    error: string = 'Resource conflict',
    code: string = 'CONFLICT'
  ): void {
    ResponseUtil.error(res, error, code, 409);
  }

  /**
   * Send validation error response (422)
   */
  static validationError(
    res: Response,
    errors: Array<{ field: string; message: string }>,
    message: string = 'Validation failed'
  ): void {
    ResponseUtil.error(res, message, 'VALIDATION_ERROR', 422, errors);
  }

  /**
   * Send rate limited response (429)
   */
  static rateLimited(
    res: Response,
    error: string = 'Too many requests',
    retryAfter?: number
  ): void {
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    ResponseUtil.error(res, error, 'RATE_LIMITED', 429);
  }

  /**
   * Send internal server error response (500)
   */
  static internalError(
    res: Response,
    error: string = 'Internal server error',
    code: string = 'INTERNAL_ERROR'
  ): void {
    ResponseUtil.error(res, error, code, 500);
  }
}

/**
 * Express middleware to add response utilities to res object
 */
export const addResponseUtils = (req: any, res: any, next: any): void => {
  res.success = (data: any, message?: string, statusCode?: number) =>
    ResponseUtil.success(res, data, message, statusCode);

  res.error = (error: string, code: string, statusCode?: number, details?: any) =>
    ResponseUtil.error(res, error, code, statusCode, details);

  res.created = (data: any, message?: string) =>
    ResponseUtil.created(res, data, message);

  res.noContent = () => ResponseUtil.noContent(res);

  res.badRequest = (error?: string, details?: any) =>
    ResponseUtil.badRequest(res, error, details);

  res.unauthorized = (error?: string, code?: string) =>
    ResponseUtil.unauthorized(res, error, code);

  res.forbidden = (error?: string, code?: string) =>
    ResponseUtil.forbidden(res, error, code);

  res.notFound = (error?: string, code?: string) =>
    ResponseUtil.notFound(res, error, code);

  res.conflict = (error?: string, code?: string) =>
    ResponseUtil.conflict(res, error, code);

  res.validationError = (errors: Array<{ field: string; message: string }>, message?: string) =>
    ResponseUtil.validationError(res, errors, message);

  res.rateLimited = (error?: string, retryAfter?: number) =>
    ResponseUtil.rateLimited(res, error, retryAfter);

  res.internalError = (error?: string, code?: string) =>
    ResponseUtil.internalError(res, error, code);

  next();
};

// Type declaration for Express Response with utility methods
declare global {
  namespace Express {
    interface Response {
      success: (data: any, message?: string, statusCode?: number) => void;
      error: (error: string, code: string, statusCode?: number, details?: any) => void;
      created: (data: any, message?: string) => void;
      noContent: () => void;
      badRequest: (error?: string, details?: any) => void;
      unauthorized: (error?: string, code?: string) => void;
      forbidden: (error?: string, code?: string) => void;
      notFound: (error?: string, code?: string) => void;
      conflict: (error?: string, code?: string) => void;
      validationError: (errors: Array<{ field: string; message: string }>, message?: string) => void;
      rateLimited: (error?: string, retryAfter?: number) => void;
      internalError: (error?: string, code?: string) => void;
    }
  }
}