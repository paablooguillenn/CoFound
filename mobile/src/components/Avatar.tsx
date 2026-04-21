import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: number;
};

export const Avatar = ({ firstName, lastName, avatarUrl, size = 56 }: Props) => {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const fontSize = size * 0.36;
  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.border,
  },
  fallback: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textSecondary,
    fontWeight: '900',
  },
});
