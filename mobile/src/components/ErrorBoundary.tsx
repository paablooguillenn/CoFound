import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

/**
 * Top-level safety net. Catches unhandled exceptions thrown during render
 * (and inside lifecycle methods) so the app never falls back to the white
 * "JS error" screen. Offers a single recovery action: reset and re-render.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Best-effort console log. In a real production app this would forward
    // to Sentry / Bugsnag etc.
    console.error('[ErrorBoundary] Captured', error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle" size={44} color="#F87171" />
        </View>
        <Text style={styles.title}>Algo se ha roto</Text>
        <Text style={styles.message}>
          La aplicación encontró un error inesperado. Tus datos están a salvo —
          puedes intentar continuar pulsando el botón de abajo.
        </Text>
        {this.state.error?.message && (
          <Text style={styles.errorDetail} numberOfLines={3}>
            {this.state.error.message}
          </Text>
        )}
        <TouchableOpacity style={styles.cta} onPress={this.reset} accessibilityRole="button">
          <Ionicons name="refresh" size={18} color={colors.background} />
          <Text style={styles.ctaText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(248,113,113,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  errorDetail: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: spacing.md,
  },
  ctaText: { color: colors.background, fontWeight: '800', fontSize: 15 },
});
