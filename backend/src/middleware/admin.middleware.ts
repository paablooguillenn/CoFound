import { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/http-error';

const adminEmails = env.ADMIN_EMAILS
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const adminMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  const userEmail = request.user?.email?.toLowerCase();
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return next(new AppError('Forbidden', 403));
  }
  next();
};
