import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export const SkillBadge = ({ label, variant = 'offer' }: { label: string; variant?: 'offer' | 'learn' }) => (
  <View style={[styles.badge, styles[variant]]}>
    <Text style={[styles.text, styles[`${variant}Text` as 'offerText' | 'learnText']]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  offer: {
    backgroundColor: colors.infoLight,
  },
  learn: {
    backgroundColor: colors.successLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerText: {
    color: colors.infoText,
  },
  learnText: {
    color: colors.successText,
  },
});
