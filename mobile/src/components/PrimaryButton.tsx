import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const PrimaryButton = ({
  label,
  onPress,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) => (
  <Pressable
    onPress={onPress}
    disabled={loading}
    style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed]}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.black} />
    ) : (
      <Text style={[styles.label, variant === 'secondary' && styles.labelSecondary]}>{label}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
  labelSecondary: {
    color: colors.text,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
});
