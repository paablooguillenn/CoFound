import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CoachmarkStep = {
  arrowTopRatio: number;
  arrowAlign: 'left' | 'center' | 'right';
  arrowDirection: 'up' | 'down';
  title: string;
  description: string;
};

type Props = {
  steps: CoachmarkStep[];
  onFinish: () => void;
};

/**
 * Generic stepped coachmark overlay. Reusable for first-time-on-screen
 * tutorials (matches, chat, etc.). For the discovery feed we keep the
 * existing DiscoveryTutorial component because its content is tightly
 * coupled to that screen.
 */
export const Coachmark = ({ steps, onFinish }: Props) => {
  const [stepIndex, setStepIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const arrowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [stepIndex, fade]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(arrowPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [arrowPulse]);

  const advance = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onFinish();
    }
  };

  if (steps.length === 0) return null;

  const step = steps[stepIndex];
  const arrowTop = step.arrowTopRatio * SCREEN_HEIGHT;
  const arrowLeft =
    step.arrowAlign === 'left'
      ? 24
      : step.arrowAlign === 'right'
        ? SCREEN_WIDTH - 24 - 36
        : SCREEN_WIDTH / 2 - 18;
  const pulseTranslate = arrowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: step.arrowDirection === 'up' ? [0, -8] : [0, 8],
  });

  return (
    <Pressable
      style={styles.overlay}
      onPress={advance}
      accessibilityRole="button"
      accessibilityLabel={`Paso ${stepIndex + 1} de ${steps.length}. Toca para continuar.`}
    >
      <Animated.View
        style={[
          styles.arrow,
          {
            top: arrowTop,
            left: arrowLeft,
            transform: [{ translateY: pulseTranslate }],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons
          name={step.arrowDirection === 'up' ? 'arrow-up' : 'arrow-down'}
          size={36}
          color="#4ADE80"
        />
      </Animated.View>

      <Animated.View style={[styles.card, { opacity: fade }]}>
        <Text style={styles.stepCounter}>
          {stepIndex + 1} / {steps.length}
        </Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.tapHint}>
            Toca la pantalla para {stepIndex < steps.length - 1 ? 'continuar' : 'empezar'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      </Animated.View>

      <Pressable
        onPress={onFinish}
        hitSlop={12}
        style={styles.skipBtn}
        accessibilityRole="button"
        accessibilityLabel="Saltar tutorial"
      >
        <Text style={styles.skipText}>Saltar</Text>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 50,
    elevation: 50,
  },
  arrow: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    top: '38%',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
  },
  stepCounter: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.md,
  },
  tapHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
