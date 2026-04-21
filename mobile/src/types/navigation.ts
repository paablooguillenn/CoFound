export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  Chat: { matchId: string; matchName: string; matchAvatar?: string | null };
  Settings: undefined;
  Privacy: undefined;
  Notifications: undefined;
  Pricing: undefined;
  Checkout: { plan: 'monthly' | 'yearly'; price: number };
  CheckoutSuccess: { plan: 'monthly' | 'yearly' };
};
