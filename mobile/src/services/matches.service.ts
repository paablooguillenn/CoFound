import { api } from './api';
import { MatchItem } from '../types/models';

export const likeProfile = async (targetUserId: string) => {
  const response = await api.post<{ isMatch: boolean; matchId: string | null; likedUserId: string }>(
    '/matches/like',
    { targetUserId },
  );
  return response.data;
};

export const passProfile = async (targetUserId: string) => {
  const response = await api.post<{ success: boolean }>(
    '/matches/pass',
    { targetUserId },
  );
  return response.data;
};

export const getMatches = async () => {
  const response = await api.get<{ matches: MatchItem[] }>('/matches');
  return response.data.matches;
};
