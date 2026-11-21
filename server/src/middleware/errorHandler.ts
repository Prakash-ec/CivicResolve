import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      fieldErrors[field] = e.message;
    });

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        fieldErrors,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message = err.message || 'An unexpected error occurred. Please try again.';

  if (statusCode === 500) {
    console.error('[Server Error]', err);
  }

  return res.status(statusCode).json({
    error: {
      code,
      message,
      fieldErrors: err.fieldErrors || {},
    },
  });
}
