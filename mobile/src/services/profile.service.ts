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
