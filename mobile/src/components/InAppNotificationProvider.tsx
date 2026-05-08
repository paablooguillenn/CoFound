import React, { useEffect, useRef, useState } from 'react';
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
    const interval = setInterval(() => tick.current(), POLL_INTERVAL_MS);

    // Poll on every navigation state change. Two reasons:
    //   1. Leaving a chat → instant banner if a new message arrived while
    //      we were inside (mark-as-read happens on chat mount, so anything
    //      that arrived after that still counts as unread).
    //   2. App resume / deep link / etc. — any nav transition gets a fresh check.
    const unsubscribe = navigationRef.addListener('state', () => {
      tick.current();
    });

    return () => {
      clearInterval(interval);
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
