import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

type Props = {
  linkedinUsername?: string | null;
  instagramUsername?: string | null;
  size?: number;
};

const open = (url: string) => Linking.openURL(url).catch(() => undefined);

export const SocialLinks = ({ linkedinUsername, instagramUsername, size = 36 }: Props) => {
  if (!linkedinUsername && !instagramUsername) return null;

  return (
    <View style={styles.row}>
      {linkedinUsername && (
        <Pressable
          onPress={() => open(`https://www.linkedin.com/in/${linkedinUsername}`)}
          style={[styles.btn, styles.linkedin, { width: size, height: size, borderRadius: size / 2 }]}
          accessibilityRole="link"
          accessibilityLabel={`Abrir LinkedIn de ${linkedinUsername}`}
        >
          <Ionicons name="logo-linkedin" size={size * 0.55} color="#fff" />
        </Pressable>
      )}
      {instagramUsername && (
        <Pressable
          onPress={() => open(`https://www.instagram.com/${instagramUsername}`)}
          style={[styles.btn, styles.instagram, { width: size, height: size, borderRadius: size / 2 }]}
          accessibilityRole="link"
          accessibilityLabel={`Abrir Instagram de ${instagramUsername}`}
        >
          <Ionicons name="logo-instagram" size={size * 0.55} color="#fff" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  linkedin: { backgroundColor: '#0A66C2' },
  instagram: { backgroundColor: '#E4405F' },
});

export const stripSocialHandle = (raw: string): string =>
  raw.trim().replace(/^@+/, '').replace(/\s+/g, '').replace(/\/+$/, '');

export const isValidHandle = (raw: string): boolean => {
  const cleaned = stripSocialHandle(raw);
  return cleaned.length >= 2 && cleaned.length <= 80 && /^[A-Za-z0-9._-]+$/.test(cleaned);
};
