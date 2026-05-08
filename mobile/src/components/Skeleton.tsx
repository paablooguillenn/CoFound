import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

/**
 * Pulsing placeholder block. Use to suggest the shape of content while it
 * loads — feels much faster than a generic ActivityIndicator.
 *
 * Example:
 *   <Skeleton style={{ width: 120, height: 18, borderRadius: 4 }} />
 */
export const Skeleton = ({ style }: { style?: ViewStyle | ViewStyle[] }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });

  return <Animated.View style={[styles.base, style, { opacity }]} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
  },
});

/** Pre-built skeleton for a row in the connections / requests list. */
export const SkeletonRow = () => (
  <View style={rowStyles.row}>
    <Skeleton style={rowStyles.avatar} />
    <View style={rowStyles.content}>
      <Skeleton style={rowStyles.name} />
      <Skeleton style={rowStyles.subline} />
    </View>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  content: { flex: 1, gap: 8 },
  name: { width: '60%', height: 14, borderRadius: 4 },
  subline: { width: '85%', height: 11, borderRadius: 4 },
});
