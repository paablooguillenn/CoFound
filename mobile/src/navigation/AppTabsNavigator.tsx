import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { EventsScreen } from '../screens/EventsScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { AppTabParamList } from '../types/navigation';
import { getUnreadCount } from '../services/api';

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTabsNavigator = () => {
  const [unread, setUnread] = useState(0);

  // Poll unread count continuously while the tabs navigator is mounted.
  // We use a plain useEffect (not useFocusEffect) so the badge updates even
  // when the user is inside a stack screen pushed on top of the tabs.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getUnreadCount()
        .then((count) => {
          if (!cancelled) setUnread(count);
        })
        .catch(() => {});
    };
    load();
    let interval: ReturnType<typeof setInterval> | null = setInterval(load, 8000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (!interval) {
          interval = setInterval(load, 8000);
          load();
        }
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, []);

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
          title: 'Conexiones',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.pink,
            color: '#fff',
            fontSize: 10,
            fontWeight: '800',
          },
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
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
