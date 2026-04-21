import { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/http-error';

export const authMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyToken(token);
    request.user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch {
    next(new AppError('Invalid authentication token', 401));
  }
};
