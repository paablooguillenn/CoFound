import { NextFunction, Request, Response } from 'express';

import { getPublicUserProfile } from '../services/users.service';

export const getPublicUserProfileController = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const profile = await getPublicUserProfile(request.user!.id, request.params.userId);
    response.json(profile);
  } catch (error) {
    next(error);
  }
};
