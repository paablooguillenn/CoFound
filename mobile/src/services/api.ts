import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://cofound-production-a055.up.railway.app/api';

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

let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

// Retry GET requests up to 2 times on transient network errors with a small
// exponential backoff. Avoids retrying on auth failures, validation errors and
// any non-idempotent verb (POST/PATCH/DELETE).
const MAX_RETRIES = 2;
const isTransientError = (error: any): boolean => {
  // Network failure (no response from server)
  if (!error.response) return true;
  // 5xx from server
  if (error.response.status >= 500 && error.response.status < 600) return true;
  return false;
};

api.interceptors.response.use(
  (response) => {
    console.log(`[CoFound] Response ${response.status}`);
    return response;
  },
  async (error) => {
    console.log('[CoFound] API Error:', error.message, error.code, error.config?.url);
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthFlow = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password');
      if (!isAuthFlow && onUnauthorized) {
        onUnauthorized();
      }
    }
    // Auto-retry idempotent transient failures.
    const cfg = error.config;
    if (cfg && cfg.method?.toLowerCase() === 'get' && isTransientError(error)) {
      cfg.__retryCount = (cfg.__retryCount ?? 0) + 1;
      if (cfg.__retryCount <= MAX_RETRIES) {
        const delayMs = 300 * 2 ** (cfg.__retryCount - 1); // 300ms, 600ms
        console.log(`[CoFound] Retrying ${cfg.url} (attempt ${cfg.__retryCount}/${MAX_RETRIES}) in ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(cfg);
      }
    }
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

export type LatestUnread = {
  messageId: string;
  matchId: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
};

export const getLatestUnread = () =>
  api.get('/matches/latest-unread').then((r) => r.data.message as LatestUnread | null);

export const sendSupportMessage = (subject: string, body: string) =>
  api
    .post<{ success: boolean; ticketId: string; createdAt: string }>('/support', { subject, body })
    .then((r) => r.data);

export const getPublicUserProfile = (userId: string) =>
  api.get(`/users/${userId}`).then((r) => r.data);

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
