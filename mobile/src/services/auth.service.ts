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
