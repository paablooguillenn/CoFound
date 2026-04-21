import { api } from './api';
import { DiscoveryUser } from '../types/models';

export const getDiscoveryProfiles = async (locationFilter?: string) => {
  const params: Record<string, string> = {};
  if (locationFilter) params.location = locationFilter;
  const response = await api.get<{ profiles: DiscoveryUser[] }>('/discovery', { params });
  return response.data.profiles;
};

export const getLocations = async () => {
  const response = await api.get<{ locations: string[] }>('/discovery/locations');
  return response.data.locations;
};
