import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { getProfileById, updateProfile, upgradeToPremium } from '../services/profile.service';

const skillSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(5).optional(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  bio: z.string().optional().default(''),
  interests: z.string().optional().default(''),
  location: z.string().optional().default(''),
  offeredSkills: z.array(skillSchema).default([]),
  learningSkills: z.array(skillSchema).default([]),
});

export const getMyProfileController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const profile = await getProfileById(request.user!.id);
    response.json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfileController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = updateProfileSchema.parse(request.body);
    const profile = await updateProfile(request.user!.id, payload);
    response.json(profile);
  } catch (error) {
    next(error);
  }
};

const premiumSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export const upgradePremiumController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { plan } = premiumSchema.parse(request.body);
    const result = await upgradeToPremium(request.user!.id, plan);
    response.json(result);
  } catch (error) {
    next(error);
  }
};
