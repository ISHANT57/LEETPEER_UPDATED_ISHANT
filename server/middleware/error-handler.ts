import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createAppError = (message: string, statusCode: number) => {
  return new AppError(message, statusCode);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Database connection errors
  if (err.message?.includes('connection') || err.message?.includes('timeout')) {
    err.statusCode = 503;
    err.message = 'Database temporarily unavailable';
  }

  // LeetCode API errors
  if (err.message?.includes('leetcode') || err.message?.includes('graphql')) {
    err.statusCode = 502;
    err.message = 'External service unavailable';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    err.message = 'Invalid request data';
  }

  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.statusCode).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};