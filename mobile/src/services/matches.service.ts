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

export const superLikeProfile = async (targetUserId: string) => {
  const response = await api.post<{ isMatch: boolean; matchId: string | null; isSuper: true; likedUserId: string }>(
    '/matches/superlike',
    { targetUserId },
  );
  return response.data;
};

export const rewindLastSwipe = async () => {
  const response = await api.post<{ success: boolean; undoneType: 'like' | 'pass'; targetUserId: string }>(
    '/matches/rewind',
  );
  return response.data;
};

export type LikeReceived = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  isSuper: boolean;
  likedAt: string;
};

export const getLikesReceived = async () => {
  const response = await api.get<{ likes: LikeReceived[] }>('/matches/likes-received');
  return response.data.likes;
};

export const getMatches = async () => {
  const response = await api.get<{ matches: MatchItem[] }>('/matches');
  return response.data.matches;
};
