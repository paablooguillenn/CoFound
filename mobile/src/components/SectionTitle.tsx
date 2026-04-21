import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </>
);

const styles = StyleSheet.create({
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 6,
  },
});
