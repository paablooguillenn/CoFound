import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api';

console.log('[CoFound] API_URL =', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Debug interceptors
api.interceptors.request.use((config) => {
  console.log(`[CoFound] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[CoFound] Response ${response.status}`);
    return response;
  },
  (error) => {
    console.log('[CoFound] API Error:', error.message, error.code, error.config?.url);
    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// --- Messages ---
export const getMessages = (matchId: string) =>
  api.get(`/matches/${matchId}/messages`).then((r) => r.data.messages);

export const sendMessage = (matchId: string, content: string) =>
  api.post(`/matches/${matchId}/messages`, { content }).then((r) => r.data);

// --- Match actions ---
export const getMatchProfile = (matchId: string) =>
  api.get(`/matches/${matchId}/profile`).then((r) => r.data);

export const unmatchUser = (matchId: string) =>
  api.delete(`/matches/${matchId}`).then((r) => r.data);

export const blockUser = (userId: string, reason?: string) =>
  api.post('/matches/block', { userId, reason }).then((r) => r.data);

export const reportUser = (userId: string, reason: string) =>
  api.post('/matches/report', { userId, reason }).then((r) => r.data);

export const getUnreadCount = () =>
  api.get('/matches/unread').then((r) => r.data.unreadCount as number);

export const markMessagesRead = (matchId: string) =>
  api.post(`/matches/${matchId}/read`).then((r) => r.data);

// --- Photos ---
export const getMyPhotos = () =>
  api.get('/photos').then((r) => r.data.photos);

export const addPhoto = (url: string) =>
  api.post('/photos', { url }).then((r) => r.data);

export const deletePhoto = (photoId: string) =>
  api.delete(`/photos/${photoId}`).then((r) => r.data);

// --- Premium ---
export const upgradePremium = (plan: 'monthly' | 'yearly') =>
  api.post('/profile/premium', { plan }).then((r) => r.data);
