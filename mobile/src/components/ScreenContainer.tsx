import React from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const ScreenContainer = ({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: React.ReactElement<typeof RefreshControl>;
}) => {
  if (!scroll) {
    return <SafeAreaView style={[styles.safeArea, contentStyle]}>{children}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView refreshControl={refreshControl} contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
