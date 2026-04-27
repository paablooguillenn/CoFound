import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
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
import { AppTabsNavigator } from './AppTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { AppStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
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
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { token, isLoading, profileComplete } = useAuth();

  if (isLoading) return <SplashScreen />;
  if (!token) return <AuthNavigator />;
  if (!profileComplete) return <CreateProfileScreen />;
  return <AppStackNavigator />;
};
