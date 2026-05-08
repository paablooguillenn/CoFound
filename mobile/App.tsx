import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { InAppNotificationProvider } from './src/components/InAppNotificationProvider';

export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <InAppNotificationProvider navigationRef={navigationRef}>
            <RootNavigator />
          </InAppNotificationProvider>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
