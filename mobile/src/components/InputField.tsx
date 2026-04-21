import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = TextInputProps & { label: string; icon?: React.ReactNode; error?: string };

export const InputField = ({ label, icon, error, style, ...props }: Props) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          icon ? styles.inputWithIcon : undefined,
          error ? styles.inputError : undefined,
          style,
        ]}
        {...props}
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
});
