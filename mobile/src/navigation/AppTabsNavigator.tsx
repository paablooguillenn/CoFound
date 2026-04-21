import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { ExploreScreen } from '../screens/ExploreScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { AppTabParamList } from '../types/navigation';
import { getUnreadCount } from '../services/api';

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTabsNavigator = () => {
  const [unread, setUnread] = useState(0);

  // Poll unread count when tabs are visible
  useFocusEffect(
    useCallback(() => {
      const load = () => getUnreadCount().then(setUnread).catch(() => {});
      load();
      const interval = setInterval(load, 10000); // every 10s
      return () => clearInterval(interval);
    }, []),
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={ExploreScreen}
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.pink,
            color: colors.white,
            fontSize: 11,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
