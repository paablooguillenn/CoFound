import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export const SplashScreen = () => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo bounces in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fades in
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Dots appear
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous subtle pulse on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [logoScale, logoOpacity, subtitleOpacity, subtitleSlide, dotsOpacity, pulseAnim]);

  return (
    <LinearGradient
      colors={['#0A0A0A', '#141414', '#0A0A0A']}
      style={styles.container}
    >
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(logoScale, pulseAnim) },
          ],
          opacity: logoOpacity,
        }}
      >
        <Text style={styles.title}>CoFound</Text>
      </Animated.View>

      <Animated.View
        style={{
          opacity: subtitleOpacity,
          transform: [{ translateY: subtitleSlide }],
        }}
      >
        <Text style={styles.subtitle}>Conecta talento, ideas y ambición.</Text>
      </Animated.View>

      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <LoadingDots />
      </Animated.View>
    </LinearGradient>
  );
};

const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      );
    animate(dot1, 0).start();
    animate(dot2, 150).start();
    animate(dot3, 300).start();
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.8] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ flexDirection: 'row' }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  dotsRow: {
    marginTop: 32,
  },
});
