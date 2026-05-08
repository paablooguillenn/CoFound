import { api } from './api';
import { DiscoveryUser, EntrepreneurLevel, Goal } from '../types/models';

export type DiscoveryFilters = {
  location?: string;
  skill?: string;
  level?: EntrepreneurLevel;
  goal?: Goal;
};

export const getDiscoveryProfiles = async (filters: DiscoveryFilters = {}) => {
  const params: Record<string, string> = {};
  if (filters.location) params.location = filters.location;
  if (filters.skill) params.skill = filters.skill;
  if (filters.level) params.level = filters.level;
  if (filters.goal) params.goal = filters.goal;
  const response = await api.get<{ profiles: DiscoveryUser[] }>('/discovery', { params });
  return response.data.profiles;
};

export const getLocations = async () => {
  const response = await api.get<{ locations: string[] }>('/discovery/locations');
  return response.data.locations;
};
