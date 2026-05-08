import { NextFunction, Request, Response } from 'express';

import { recordProfileView } from '../services/match.service';
import { getPublicUserProfile } from '../services/users.service';

export const getPublicUserProfileController = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const profile = await getPublicUserProfile(request.user!.id, request.params.userId);
    // Fire-and-forget: tracks the view without delaying the response.
    recordProfileView(request.user!.id, request.params.userId).catch(() => {});
    response.json(profile);
  } catch (error) {
    next(error);
  }
};
