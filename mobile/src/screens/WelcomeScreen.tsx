import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../../assets/logocofound.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const features = [
  {
    icon: 'people-outline' as const,
    title: 'Encuentra tu equipo ideal',
    description: 'Conecta con personas que tienen las habilidades que necesitas',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Matching inteligente',
    description: 'Algoritmo que empareja según compatibilidad de intereses y habilidades',
  },
  {
    icon: 'rocket-outline' as const,
    title: 'Impulsa tu proyecto',
    description: 'Colabora, aprende y crea proyectos increíbles juntos',
  },
];

export const WelcomeScreen = ({ navigation }: Props) => (
  <View style={styles.root}>
    <LinearGradient
      colors={['#1A1A1A', '#0A0A0A']}
      style={StyleSheet.absoluteFillObject}
    />
    <SafeAreaView style={styles.safe}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Features */}
      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Ionicons name={f.icon} size={22} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        Al continuar aceptas nuestros términos y política de privacidad
      </Text>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  logo: {
    width: 400,
    height: 400,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  features: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  buttons: {
    gap: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  btnOutline: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  terms: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
