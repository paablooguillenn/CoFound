import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Stagger-style entrance animation: each call returns an Animated.Value ready to be
 * applied via opacity/translateY transforms. Pass the `index` to delay subsequent
 * elements (~80ms each) so the screen "lands" with a subtle waterfall.
 */
export const useEntrance = (index: number = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  return {
    opacity,
    transform: [{ translateY }],
  };
};
