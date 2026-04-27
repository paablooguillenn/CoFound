import { api } from './api';
import { AuthUser } from '../types/models';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export const loginRequest = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const registerRequest = async (payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const forgotPasswordRequest = async (email: string) => {
  const response = await api.post<{ success: boolean }>('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordRequest = async (payload: {
  email: string;
  code: string;
  newPassword: string;
}) => {
  const response = await api.post<{ success: boolean }>('/auth/reset-password', payload);
  return response.data;
};
