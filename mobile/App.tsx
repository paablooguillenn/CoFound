import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { InAppNotificationProvider } from './src/components/InAppNotificationProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ToastProvider } from './src/components/Toast';

export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" />
              <InAppNotificationProvider navigationRef={navigationRef}>
                <RootNavigator navigationRef={navigationRef} />
              </InAppNotificationProvider>
              <OfflineBanner />
            </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
