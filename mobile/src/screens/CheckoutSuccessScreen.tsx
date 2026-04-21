import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'CheckoutSuccess'>;

export const CheckoutSuccessScreen = ({ navigation, route }: Props) => {
  const { plan } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Check Icon */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={48} color={colors.background} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>¡Pago completado!</Text>
        <Text style={styles.subtitle}>
          Bienvenido a CoFound Premium. Tu cuenta ha sido actualizada con éxito.
        </Text>

        {/* Premium Badge */}
        <Animated.View
          style={[
            styles.premiumCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Ionicons name="ribbon" size={48} color="#C9A84C" />
          <Text style={styles.premiumTitle}>Ahora eres Premium</Text>
          <Text style={styles.premiumPlan}>
            Plan {plan === 'yearly' ? 'Anual' : 'Mensual'}
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[styles.featuresCard, { opacity: fadeAnim }]}
        >
          <View style={styles.featuresHeader}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.featuresTitle}>Ya puedes disfrutar de:</Text>
          </View>
          {[
            { bold: 'Likes ilimitados', rest: ' para conectar sin restricciones' },
            { bold: 'Ver quién te dio like', rest: ' y hacer match al instante' },
            { bold: 'Filtros avanzados', rest: ' para encontrar tu match perfecto' },
            { bold: 'Badge Premium', rest: ' visible en tu perfil' },
          ].map((item) => (
            <View key={item.bold} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.featureText}>
                <Text style={styles.featureBold}>{item.bold}</Text>
                {item.rest}
              </Text>
            </View>
          ))}
        </Animated.View>

        <Text style={styles.emailNote}>
          Recibirás un email de confirmación con los detalles de tu suscripción
        </Text>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Tabs')}
          >
            <Text style={styles.primaryBtnText}>Empezar a descubrir</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Tabs')}
          >
            <Text style={styles.secondaryBtnText}>Ver mi perfil</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.supportText}>
          ¿Necesitas ayuda? Contacta con soporte
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: spacing.md,
  },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  subtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  premiumCard: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg,
    alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: '#C9A84C',
  },
  premiumTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  premiumPlan: { fontSize: 14, color: colors.textSecondary },
  featuresCard: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  featuresHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  featuresTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  featureBold: { fontWeight: '700', color: colors.text },
  emailNote: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
  },
  buttons: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
  },
  primaryBtnText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 2, borderColor: colors.border, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  supportText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
});
