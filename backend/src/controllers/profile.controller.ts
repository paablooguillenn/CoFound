import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import {
  changeEmail,
  changePassword,
  deactivateAccount,
  deleteAccount,
  exportUserData,
  getPreferences,
  getProfileById,
  reactivateAccount,
  toggle2FA,
  updatePreferences,
  updateProfile,
  upgradeToPremium,
} from '../services/profile.service';

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

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const deleteAccountSchema = z.object({
  password: z.string().min(6),
});

const preferencesSchema = z.object({
  preferences: z.record(z.string(), z.unknown()),
});

const twoFactorSchema = z.object({
  enable: z.boolean(),
});

const premiumSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
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

export const upgradePremiumController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { plan } = premiumSchema.parse(request.body);
    const result = await upgradeToPremium(request.user!.id, plan);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const changeEmailController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { newEmail, password } = changeEmailSchema.parse(request.body);
    const result = await changeEmail(request.user!.id, newEmail, password);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
    const result = await changePassword(request.user!.id, currentPassword, newPassword);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteAccountController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { password } = deleteAccountSchema.parse(request.body);
    const result = await deleteAccount(request.user!.id, password);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const deactivateAccountController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await deactivateAccount(request.user!.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const reactivateAccountController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await reactivateAccount(request.user!.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const updatePreferencesController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { preferences } = preferencesSchema.parse(request.body);
    const result = await updatePreferences(request.user!.id, preferences);
    response.json({ preferences: result });
  } catch (error) {
    next(error);
  }
};

export const getPreferencesController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await getPreferences(request.user!.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const toggle2FAController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { enable } = twoFactorSchema.parse(request.body);
    const result = await toggle2FA(request.user!.id, enable);
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const exportDataController = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const data = await exportUserData(request.user!.id);
    response.setHeader('Content-Disposition', 'attachment; filename="cofound-export.json"');
    response.json(data);
  } catch (error) {
    next(error);
  }
};
