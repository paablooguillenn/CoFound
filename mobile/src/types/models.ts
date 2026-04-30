export type Skill = {
  id?: string;
  name: string;
  level?: number;
};

export type UserProfile = {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  bio: string;
  interests: string;
  location: string;
  offeredSkills: Skill[];
  learningSkills: Skill[];
};

export type Photo = {
  id: string;
  url: string;
  sortOrder: number;
};

export type DiscoveryUser = UserProfile & {
  compatibilityScore: number;
  superLikedByThem?: boolean;
  isBoosted?: boolean;
  photos?: Photo[];
};

export type MatchItem = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  hasMessage: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageIsMe: boolean;
  unreadCount: number;
  user: UserProfile & { lastSeenAt?: string | null };
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
};
