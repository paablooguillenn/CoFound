import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { NavigationContainerRefWithCurrent, NavigationState } from '@react-navigation/native';

import { InAppMessageBanner } from './InAppMessageBanner';
import { LatestUnread, getLatestUnread } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 8000;

const findActiveRoute = (state: NavigationState | undefined): { name: string; params?: any } | null => {
  if (!state) return null;
  const route = state.routes[state.index];
  if (route.state) {
    return findActiveRoute(route.state as NavigationState);
  }
  return { name: route.name, params: route.params };
};

/**
 * Polls the latest-unread endpoint every 8 s while the user is logged in, and
 * additionally polls on every navigation change so the banner pops as soon as
 * the user leaves a chat. Suppressed when the user is already inside the chat
 * for that match.
 */
export const InAppNotificationProvider = ({
  children,
  navigationRef,
}: {
  children: React.ReactNode;
  navigationRef: NavigationContainerRefWithCurrent<any>;
}) => {
  const { token } = useAuth();
  const [active, setActive] = useState<LatestUnread | null>(null);
  const lastShownIdRef = useRef<string | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const tick = useRef(async () => {});
  tick.current = async () => {
    if (!tokenRef.current) return;
    try {
      const message = await getLatestUnread();
      if (!message) return;

      if (message.messageId === lastShownIdRef.current) return;

      const route = findActiveRoute(navigationRef.getRootState());
      if (route?.name === 'Chat' && route.params?.matchId === message.matchId) {
        // Already in that chat — silently mark seen so we don't re-pop later.
        lastShownIdRef.current = message.messageId;
        return;
      }

      lastShownIdRef.current = message.messageId;
      setActive(message);
    } catch (err) {
      console.log('[InAppNotif] poll error', err);
    }
  };

  useEffect(() => {
    if (!token) {
      lastShownIdRef.current = null;
      setActive(null);
      return;
    }

    tick.current();
    let interval: ReturnType<typeof setInterval> | null = setInterval(
      () => tick.current(),
      POLL_INTERVAL_MS,
    );

    // Pause polling while the app is in background to save battery + data.
    // Resume + tick immediately when the user brings the app forward again.
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (!interval) {
          interval = setInterval(() => tick.current(), POLL_INTERVAL_MS);
          tick.current(); // fresh check on resume
        }
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });

    // Poll on every navigation state change.
    const unsubscribe = navigationRef.addListener('state', () => {
      tick.current();
    });

    return () => {
      if (interval) clearInterval(interval);
      appStateSub.remove();
      unsubscribe();
    };
  }, [token, navigationRef]);

  const handlePress = () => {
    if (!active) return;
    const target = {
      matchId: active.matchId,
      matchName: `${active.sender.firstName} ${active.sender.lastName}`,
      matchAvatar: active.sender.avatarUrl,
    };
    setActive(null);
    navigationRef.navigate('Chat' as never, target as never);
  };

  return (
    <>
      {children}
      <InAppMessageBanner
        message={active}
        onPress={handlePress}
        onDismiss={() => setActive(null)}
      />
    </>
  );
};
