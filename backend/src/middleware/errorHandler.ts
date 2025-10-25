import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500, code?: string): CustomError => {
  return new CustomError(message, statusCode, true, code);
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log the error
  logger.error('Request Error', {
    message: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    success: false,
    error: {
      message: statusCode === 500 && !isDevelopment ? 'Internal Server Error' : message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add additional error details in development
  if (isDevelopment) {
    errorResponse.error.stack = error.stack;
    errorResponse.error.name = error.name;
    if (error.code) {
      errorResponse.error.code = error.code;
    }
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, true, 'ROUTE_NOT_FOUND');
  next(error);
};

// Validation error handler
export const validationErrorHandler = (errors: any[]): CustomError => {
  const message = errors.map(error => error.message).join(', ');
  return new CustomError(`Validation Error: ${message}`, 400, true, 'VALIDATION_ERROR');
};

// Database error handler
export const databaseErrorHandler = (error: any): CustomError => {
  if (error.code === '23505') { // PostgreSQL unique violation
    return new CustomError('Duplicate entry', 409, true, 'DUPLICATE_ENTRY');
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    return new CustomError('Referenced record not found', 400, true, 'FOREIGN_KEY_VIOLATION');
  } else if (error.code === '23502') { // PostgreSQL not null violation
    return new CustomError('Required field missing', 400, true, 'NOT_NULL_VIOLATION');
  }
  
  return new CustomError('Database operation failed', 500, true, 'DATABASE_ERROR');
};

// Rate limit error handler
export const rateLimitErrorHandler = (): CustomError => {
  return new CustomError('Too many requests, please try again later', 429, true, 'RATE_LIMIT_EXCEEDED');
};

// Authentication error handler
export const authErrorHandler = (message: string = 'Authentication failed'): CustomError => {
  return new CustomError(message, 401, true, 'AUTH_ERROR');
};

// Authorization error handler
export const authorizationErrorHandler = (message: string = 'Access denied'): CustomError => {
  return new CustomError(message, 403, true, 'AUTHORIZATION_ERROR');
};

// File upload error handler
export const fileUploadErrorHandler = (error: any): CustomError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new CustomError('File too large', 413, true, 'FILE_TOO_LARGE');
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    return new CustomError('Too many files', 400, true, 'TOO_MANY_FILES');
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new CustomError('Unexpected file field', 400, true, 'UNEXPECTED_FILE');
  }
  
  return new CustomError('File upload failed', 400, true, 'FILE_UPLOAD_ERROR');
};

// AI service error handler
export const aiServiceErrorHandler = (error: any): CustomError => {
  if (error.message?.includes('rate limit')) {
    return new CustomError('AI service rate limit exceeded', 429, true, 'AI_RATE_LIMIT');
  } else if (error.message?.includes('quota')) {
    return new CustomError('AI service quota exceeded', 429, true, 'AI_QUOTA_EXCEEDED');
  } else if (error.message?.includes('timeout')) {
    return new CustomError('AI service timeout', 504, true, 'AI_TIMEOUT');
  }
  
  return new CustomError('AI service error', 502, true, 'AI_SERVICE_ERROR');
};

// Agent error handler
export const agentErrorHandler = (agentType: string, error: any): CustomError => {
  const message = `${agentType} agent error: ${error.message || 'Unknown error'}`;
  return new CustomError(message, 500, true, 'AGENT_ERROR');
};

// Global unhandled rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise
  });
  
  // Graceful shutdown
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
});

export default errorHandler;