import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPARK_COUNT = 10;

/**
 * Full-screen super-like burst: a glowing blue star pops in the centre while
 * 10 sparkle particles fly outward, then everything fades. Mounted as an
 * overlay above the swipe deck and unmounted via the onComplete callback.
 */
export const SuperLikeAnimation = ({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete: () => void;
}) => {
  const starScale = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const sparks = useRef(
    Array.from({ length: SPARK_COUNT }, () => ({
      progress: new Animated.Value(0),
      angle: 0,
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Reset
    starScale.setValue(0);
    starOpacity.setValue(0);
    starRotate.setValue(0);
    haloScale.setValue(0);
    haloOpacity.setValue(0);
    sparks.forEach((s, i) => {
      s.angle = (i / SPARK_COUNT) * Math.PI * 2;
      s.progress.setValue(0);
    });

    Animated.parallel([
      // Halo expanding ring
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(haloOpacity, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Star pop with bounce
      Animated.spring(starScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(starOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Sparks fly outward
      Animated.stagger(
        20,
        sparks.map((s) =>
          Animated.timing(s.progress, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
      // Star fade out at the end
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(starOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(starScale, {
            toValue: 1.6,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => onComplete());
  }, [visible]);

  if (!visible) return null;

  const rotate = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Halo expanding ring */}
      <Animated.View
        style={[
          styles.halo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3] }) }],
          },
        ]}
      />

      {/* Sparks (10 radial particles) */}
      {sparks.map((s, i) => {
        const distance = 180;
        const tx = s.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(s.angle) * distance],
        });
        const ty = s.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(s.angle) * distance],
        });
        const opacity = s.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 0],
        });
        const scale = s.progress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0.5, 1, 0.3],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.spark,
              {
                opacity,
                transform: [{ translateX: tx }, { translateY: ty }, { scale }],
              },
            ]}
          />
        );
      })}

      {/* Big star */}
      <Animated.View
        style={[
          styles.starWrap,
          {
            opacity: starOpacity,
            transform: [{ scale: starScale }, { rotate }],
          },
        ]}
      >
        <Ionicons name="star" size={120} color="#60A5FA" style={styles.starIcon} />
      </Animated.View>

      {/* Label "SUPER LIKE" */}
      <Animated.Text
        style={[
          styles.label,
          {
            opacity: starOpacity,
            transform: [{ scale: starScale }],
          },
        ]}
      >
        SUPER LIKE
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  starWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    textShadowColor: '#60A5FA',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  spark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#93C5FD',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  label: {
    position: 'absolute',
    top: '60%',
    color: '#60A5FA',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(96,165,250,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
