import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/http-error';

export const errorMiddleware = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return response.status(422).json({
      message: 'Validation error',
      issues: error.issues,
    });
  }

  console.error(error);

  return response.status(500).json({
    message: 'Internal server error',
  });
};
