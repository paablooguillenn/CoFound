import { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/http-error';
import { updateLastSeen } from '../services/profile.service';

const lastSeenCache = new Map<string, number>();
const LAST_SEEN_THROTTLE_MS = 60 * 1000;

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

    const now = Date.now();
    const last = lastSeenCache.get(payload.userId) ?? 0;
    if (now - last > LAST_SEEN_THROTTLE_MS) {
      lastSeenCache.set(payload.userId, now);
      updateLastSeen(payload.userId).catch(() => {});
    }

    next();
  } catch {
    next(new AppError('Invalid authentication token', 401));
  }
};
