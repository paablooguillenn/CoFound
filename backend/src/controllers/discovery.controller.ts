import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { getDiscoveryFeed, getAvailableLocations } from '../services/discovery.service';

const discoveryQuerySchema = z.object({
  location: z.string().optional(),
  skill: z.string().optional(),
  level: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
  goal: z.enum(['learn_skill', 'find_partner', 'networking']).optional(),
});

export const getDiscoveryController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { location, skill, level, goal } = discoveryQuerySchema.parse(request.query);
    const profiles = await getDiscoveryFeed(request.user!.id, {
      locationFilter: location,
      skillFilter: skill,
      levelFilter: level,
      goalFilter: goal,
    });
    response.json({ profiles });
  } catch (error) {
    next(error);
  }
};

export const getLocationsController = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const locations = await getAvailableLocations();
    response.json({ locations });
  } catch (error) {
    next(error);
  }
};
