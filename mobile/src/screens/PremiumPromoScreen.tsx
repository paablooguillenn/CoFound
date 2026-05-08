import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'flash',
    iconColor: '#4ADE80',
    bg: 'rgba(74,222,128,0.18)',
    title: 'Destaca tu perfil',
    description:
      'Aparece al principio del feed durante 24 h y multiplica las conexiones recibidas.',
  },
  {
    icon: 'people',
    iconColor: '#A855F7',
    bg: 'rgba(168,85,247,0.18)',
    title: 'Conexiones instantáneas',
    description:
      'Descubre quién ya ha mostrado interés en tu perfil y conecta con un solo toque.',
  },
  {
    icon: 'options',
    iconColor: '#60A5FA',
    bg: 'rgba(96,165,250,0.18)',
    title: 'Filtros avanzados',
    description:
      'Filtra por ciudad, industria y disponibilidad para encontrar a tu cofounder ideal.',
  },
];

type Props = {
  /** Called when the user dismisses the screen (X o "Por ahora no"). */
  onSkip: () => void;
  /** Called when the user taps "Hazte Premium" — typically navega a Pricing. */
  onUpgrade: () => void;
};

/**
 * One-shot Premium upsell shown immediately after the wizard finishes for the
 * first time. Persisted via AsyncStorage so it never re-appears for the same
 * device. Inspired by typical first-launch paywalls in dating apps but
 * reworded around "conexiones" to fit the cofound product narrative.
 */
export const PremiumPromoScreen = ({ onSkip, onUpgrade }: Props) => {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F1A12', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.closeRow}>
          <TouchableOpacity
            onPress={onSkip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>
            Conecta más rápido{'\n'}con las personas{'\n'}adecuadas
          </Text>

          <View style={styles.featuresList}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={26} color={f.iconColor} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.tinyDisclaimer}>
            Sin compromiso. Cancela cuando quieras desde Configuración.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Hazte Premium"
          >
            <Text style={styles.ctaText}>Hazte Premium</Text>
          </Pressable>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Por ahora no, gracias</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headline: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  tinyDisclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  cta: {
    backgroundColor: '#4ADE80',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: {
    color: '#0A0A0A',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
