import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { env } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.id;

  // Log error
  logger.error(
    {
      requestId,
      err: {
        message: err.message,
        name: err.name,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined
      },
      method: req.method,
      url: req.originalUrl
    },
    `Error processing request: ${err.message}`
  );

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      })),
      requestId
    });
    return;
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: `Invalid identifier format for field '${err.path}'`,
      requestId
    });
    return;
  }

  // 3. Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: 'Data validation error',
      details: Object.values(err.errors).map((e) => e.message),
      requestId
    });
    return;
  }

  // 4. Mongo Duplicate Key Error (11000)
  if (err.code === 11000) {
    res.status(409).json({
      error: 'Duplicate record already exists',
      details: err.keyValue,
      requestId
    });
    return;
  }

  // 5. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      requestId
    });
    return;
  }

  // 6. Generic or Unhandled Errors
  const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
  res.status(status).json({
    error: status === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Internal Server Error',
    requestId
  });
};
