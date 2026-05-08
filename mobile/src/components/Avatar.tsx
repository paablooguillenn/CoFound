import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: number;
};

// Curated palette of dark-mode-friendly gradients. Picking deterministically
// from the user's name keeps the same visual identity across renders.
const GRADIENTS: readonly [string, string][] = [
  ['#4ADE80', '#0EA5E9'], // green → cyan
  ['#A855F7', '#EC4899'], // purple → pink
  ['#F59E0B', '#EF4444'], // amber → red
  ['#3B82F6', '#8B5CF6'], // blue → violet
  ['#10B981', '#06B6D4'], // emerald → cyan
  ['#F97316', '#FBBF24'], // orange → yellow
  ['#EC4899', '#8B5CF6'], // pink → violet
  ['#0EA5E9', '#6366F1'], // sky → indigo
];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

export const Avatar = ({ firstName, lastName, avatarUrl, size = 56 }: Props) => {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const fontSize = size * 0.4;
  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  // Deterministic gradient based on the name so the same user always renders
  // with the same avatar tint until they upload a real photo.
  const gradient = GRADIENTS[hashString(`${firstName}${lastName}`) % GRADIENTS.length];

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fallback, { width: size, height: size, borderRadius }]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#1A1A1A',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
