import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PremiumPromoScreen } from '../screens/PremiumPromoScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PricingScreen } from '../screens/PricingScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { CheckoutSuccessScreen } from '../screens/CheckoutSuccessScreen';
import { ChangeEmailScreen } from '../screens/ChangeEmailScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { LanguageScreen } from '../screens/LanguageScreen';
import { DataExportScreen } from '../screens/DataExportScreen';
import { Setup2FAScreen } from '../screens/Setup2FAScreen';
import { LikesReceivedScreen } from '../screens/LikesReceivedScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { AppTabsNavigator } from './AppTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { AppStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator = ({ initialRouteName }: { initialRouteName: keyof AppStackParamList }) => (
  <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={AppTabsNavigator} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Pricing" component={PricingScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="Language" component={LanguageScreen} />
    <Stack.Screen name="DataExport" component={DataExportScreen} />
    <Stack.Screen name="Setup2FA" component={Setup2FAScreen} />
    <Stack.Screen name="LikesReceived" component={LikesReceivedScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
  </Stack.Navigator>
);

const ONBOARDING_KEY = 'cofound:onboardingSeen';
const PREMIUM_PROMO_KEY = 'cofound:premiumPromoSeen';

type RootNavigatorProps = {
  navigationRef?: NavigationContainerRefWithCurrent<any>;
};

export const RootNavigator = ({ navigationRef }: RootNavigatorProps = {}) => {
  const { token, isLoading, profileComplete, user } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [promoSeen, setPromoSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboardingSeen(v === 'true'))
      .catch(() => setOnboardingSeen(true));
    AsyncStorage.getItem(PREMIUM_PROMO_KEY)
      .then((v) => setPromoSeen(v === 'true'))
      .catch(() => setPromoSeen(true));
  }, []);

  if (isLoading || onboardingSeen === null || promoSeen === null) return <SplashScreen />;
  if (!token) return <AuthNavigator />;

  // First-time users see the onboarding carousel before the profile wizard.
  if (!onboardingSeen && !profileComplete) {
    return (
      <OnboardingScreen
        onFinish={() => {
          AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
          setOnboardingSeen(true);
        }}
      />
    );
  }

  if (!profileComplete) return <CreateProfileScreen />;

  // After the wizard completes for the very first time, show the Premium upsell
  // exactly once. The flag is persisted so it never re-appears on this device.
  if (!promoSeen) {
    return (
      <PremiumPromoScreen
        onSkip={() => {
          AsyncStorage.setItem(PREMIUM_PROMO_KEY, 'true').catch(() => {});
          setPromoSeen(true);
        }}
        onUpgrade={() => {
          AsyncStorage.setItem(PREMIUM_PROMO_KEY, 'true').catch(() => {});
          setPromoSeen(true);
          // Wait for AppStackNavigator to mount, then push Pricing onto the
          // stack so the user lands on the upgrade flow with a working back
          // button to Tabs.
          setTimeout(() => {
            navigationRef?.navigate('Pricing' as never);
          }, 80);
        }}
      />
    );
  }

  const initialRoute: keyof AppStackParamList = user?.emailVerified === false ? 'VerifyEmail' : 'Tabs';
  return <AppStackNavigator initialRouteName={initialRoute} />;
};
