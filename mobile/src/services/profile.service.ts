import { api } from './api';
import { Skill, UserProfile } from '../types/models';

export const getMyProfile = async () => {
  const response = await api.get<UserProfile>('/profile/me');
  return response.data;
};

export const updateMyProfile = async (payload: {
  firstName: string;
  lastName: string;
  bio: string;
  interests: string;
  location: string;
  offeredSkills: Skill[];
  learningSkills: Skill[];
}) => {
  const response = await api.put<UserProfile>('/profile/me', payload);
  return response.data;
};

export const changeEmailRequest = async (newEmail: string, password: string) => {
  const response = await api.patch<{ email: string }>('/profile/email', { newEmail, password });
  return response.data;
};

export const changePasswordRequest = async (currentPassword: string, newPassword: string) => {
  const response = await api.patch<{ success: boolean }>('/profile/password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccountRequest = async (password: string) => {
  const response = await api.delete<{ success: boolean }>('/profile/me', { data: { password } });
  return response.data;
};

export const deactivateAccountRequest = async () => {
  const response = await api.post<{ success: boolean }>('/profile/deactivate');
  return response.data;
};

export const reactivateAccountRequest = async () => {
  const response = await api.post<{ success: boolean }>('/profile/reactivate');
  return response.data;
};

export type UserPreferences = {
  notifMatches?: boolean;
  notifMessages?: boolean;
  notifRecommendations?: boolean;
  notifEmail?: boolean;
  notifMarketing?: boolean;
  doNotDisturb?: boolean;
  vibration?: boolean;
  privacyProfileVisible?: boolean;
  privacyShowOnline?: boolean;
  privacyShowDistance?: boolean;
  privacyReadReceipts?: boolean;
  locale?: 'es' | 'en';
};

export const getPreferences = async () => {
  const response = await api.get<{ preferences: UserPreferences; twoFactorEnabled: boolean }>('/profile/preferences');
  return response.data;
};

export const updatePreferences = async (preferences: UserPreferences) => {
  const response = await api.patch<{ preferences: UserPreferences }>('/profile/preferences', { preferences });
  return response.data.preferences;
};

export const toggle2FARequest = async (enable: boolean) => {
  const response = await api.post<{ twoFactorEnabled: boolean }>('/profile/2fa', { enable });
  return response.data;
};

export const exportDataRequest = async () => {
  const response = await api.get<unknown>('/profile/export');
  return response.data;
};

export type Completeness = { percent: number; missing: string[] };

export const getCompleteness = async () => {
  const response = await api.get<Completeness>('/profile/completeness');
  return response.data;
};

export type BoostStatus = {
  isPremium: boolean;
  active: boolean;
  boostUntil: string | null;
  cooldownUntil: string | null;
};

export const getBoostStatusRequest = async () => {
  const response = await api.get<BoostStatus>('/profile/boost');
  return response.data;
};

export const activateBoostRequest = async () => {
  const response = await api.post<{ boostUntil: string; durationMin: number }>('/profile/boost');
  return response.data;
};

export const requestEmailVerificationCode = async () => {
  const response = await api.post<{ success: boolean }>('/profile/verify-email/request');
  return response.data;
};

export const confirmEmailVerificationCode = async (code: string) => {
  const response = await api.post<{ success: boolean }>('/profile/verify-email/confirm', { code });
  return response.data;
};
