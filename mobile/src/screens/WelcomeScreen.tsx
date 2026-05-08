import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../../assets/logocofound.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useEntrance } from '../utils/useEntrance';

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

const AnimatedFeature = ({
  icon,
  title,
  description,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  index: number;
}) => {
  const anim = useEntrance(index + 1);
  return (
    <Animated.View style={[styles.featureRow, anim]}>
      <Ionicons name={icon} size={22} color={colors.primary} style={styles.featureIcon} />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </Animated.View>
  );
};

const PressableScale = ({
  onPress,
  style,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
  accessibilityLabel: string;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
        }
        style={style}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export const WelcomeScreen = ({ navigation }: Props) => {
  const heroAnim = useEntrance(0);
  const buttonsAnim = useEntrance(features.length + 1);
  const termsAnim = useEntrance(features.length + 2);

  // Subtle floating animation on the logo (loop)
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.hero, heroAnim, { transform: [...(heroAnim.transform || []), { translateY: floatY }] }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <View style={styles.features}>
          {features.map((f, i) => (
            <AnimatedFeature key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </View>

        <Animated.View style={[styles.buttons, buttonsAnim]}>
          <PressableScale
            onPress={() => navigation.navigate('Register')}
            style={styles.btnPrimary}
            accessibilityLabel="Crear cuenta"
          >
            <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
          </PressableScale>

          <PressableScale
            onPress={() => navigation.navigate('Login')}
            style={styles.btnOutline}
            accessibilityLabel="Iniciar sesión"
          >
            <Text style={styles.btnOutlineText}>Iniciar sesión</Text>
          </PressableScale>
        </Animated.View>

        <Animated.Text style={[styles.terms, termsAnim]}>
          Al continuar aceptas nuestros términos y política de privacidad
        </Animated.Text>
      </SafeAreaView>
    </View>
  );
};

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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
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
