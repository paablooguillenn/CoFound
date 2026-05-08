import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from './Avatar';
import { LatestUnread } from '../services/api';
import { colors } from '../theme/colors';

type Props = {
  message: LatestUnread | null;
  onPress: () => void;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 4000;

export const InAppMessageBanner = ({ message, onPress, onDismiss }: Props) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();

    dismissTimerRef.current = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [message, translateY, onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy < -8,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) {
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          Animated.timing(translateY, {
            toValue: -120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    }),
  ).current;

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8, transform: [{ translateY }] },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={onPress} style={styles.banner} accessibilityRole="button">
        <Avatar
          firstName={message.sender.firstName}
          lastName={message.sender.lastName}
          avatarUrl={message.sender.avatarUrl}
          size={40}
        />
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {message.sender.firstName} {message.sender.lastName}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {message.content}
          </Text>
        </View>
        <View style={styles.dot} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  content: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: '800', fontSize: 14 },
  message: { color: colors.textSecondary, fontSize: 13 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
