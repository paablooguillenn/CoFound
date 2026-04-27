export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
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
  ChangeEmail: undefined;
  ChangePassword: undefined;
  Language: undefined;
  DataExport: undefined;
  Setup2FA: undefined;
  LikesReceived: undefined;
};
