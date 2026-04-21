import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Pricing'>;

interface Feature {
  text: string;
  included: boolean;
}

const FREE_FEATURES: Feature[] = [
  { text: '5 likes por día', included: true },
  { text: 'Matches básicos', included: true },
  { text: 'Chat con matches', included: true },
  { text: 'Ver perfiles básicos', included: true },
  { text: 'Likes ilimitados', included: false },
  { text: 'Ver quién te dio like', included: false },
  { text: 'Filtros avanzados', included: false },
  { text: 'Super Likes', included: false },
  { text: 'Modo incógnito', included: false },
];

const PREMIUM_FEATURES: Feature[] = [
  { text: 'Likes ilimitados', included: true },
  { text: 'Ver quién te dio like', included: true },
  { text: 'Filtros avanzados por ubicación e industria', included: true },
  { text: 'Rewind (deshacer swipe)', included: true },
  { text: '5 Super Likes por semana', included: true },
  { text: 'Modo incógnito', included: true },
  { text: 'Destacar tu perfil 1x al mes', included: true },
  { text: 'Prioridad en el algoritmo', included: true },
  { text: 'Sin anuncios', included: true },
  { text: 'Badge Premium en tu perfil', included: true },
  { text: 'Soporte prioritario', included: true },
];

const BENEFITS = [
  { icon: 'heart' as const, color: colors.primary, bg: colors.primaryLight, title: 'Likes ilimitados', desc: 'Sin restricciones diarias' },
  { icon: 'eye' as const, color: colors.primary, bg: colors.primaryLight, title: 'Ver quién te dio like', desc: 'Match instantáneo' },
  { icon: 'filter' as const, color: colors.info, bg: colors.infoLight, title: 'Filtros avanzados', desc: 'Encuentra tu match perfecto' },
  { icon: 'flash' as const, color: '#C9A84C', bg: '#1A1708', title: 'Prioridad', desc: 'Destaca en búsquedas' },
];

const FAQ = [
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.' },
  { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard), PayPal y transferencia bancaria.' },
  { q: '¿Hay periodo de prueba?', a: 'Ofrecemos 7 días de prueba gratuita para el plan Premium.' },
  { q: '¿Los precios incluyen IVA?', a: 'Sí, todos los precios mostrados ya incluyen todos los impuestos aplicables.' },
];

export const PricingScreen = ({ navigation }: Props) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const price = billing === 'monthly' ? 5.99 : 4.19;
  const annualTotal = (4.19 * 12).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planes y precios</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Ionicons name="ribbon" size={56} color="#C9A84C" />
          <Text style={styles.heroTitle}>Impulsa tus conexiones</Text>
          <Text style={styles.heroSubtitle}>
            Desbloquea todo el potencial de CoFound y conecta con emprendedores sin límites
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
              Mensual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'yearly' && styles.toggleBtnActive]}
            onPress={() => setBilling('yearly')}
          >
            <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>
              Anual
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>-30%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Benefits Grid */}
        <Text style={styles.sectionTitle}>¿Por qué Premium?</Text>
        <View style={styles.benefitsGrid}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                <Ionicons name={b.icon} size={24} color={b.color} />
              </View>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>

        {/* Premium Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {billing === 'monthly' ? 'Popular' : 'Ahorra 30%'}
            </Text>
          </View>
          <Text style={styles.planName}>Premium</Text>
          <Text style={styles.planDesc}>Todas las funciones para conectar sin límites</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{price}€</Text>
            <Text style={styles.pricePeriod}>/mes</Text>
          </View>
          {billing === 'yearly' && (
            <Text style={styles.planSavings}>Facturado anualmente ({annualTotal}€)</Text>
          )}

          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => navigation.navigate('Checkout', { plan: billing, price })}
          >
            <Text style={styles.selectBtnText}>Seleccionar plan</Text>
          </TouchableOpacity>
        </View>

        {/* Free Plan Card */}
        <View style={styles.freePlanCard}>
          <Text style={styles.freePlanName}>Gratuito</Text>
          <Text style={styles.freePlanDesc}>Perfecto para empezar a conectar</Text>
          <Text style={styles.freePlanPrice}>Gratis</Text>
          <View style={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Ionicons
                  name={f.included ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={f.included ? colors.success : colors.textMuted}
                />
                <Text style={[styles.featureText, !f.included && styles.featureDisabled]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.freeBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.freeBtnText}>Plan actual</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons
                name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
            {expandedFaq === i && <Text style={styles.faqAnswer}>{item.a}</Text>}
          </TouchableOpacity>
        ))}

        {/* Guarantee */}
        <View style={styles.guarantee}>
          <Ionicons name="sparkles" size={20} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Garantía de satisfacción</Text>
            <Text style={styles.guaranteeText}>
              Si no estás satisfecho con Premium en los primeros 7 días, te devolvemos el 100% de tu dinero.
            </Text>
          </View>
        </View>

        <Text style={styles.legalText}>
          Al suscribirte aceptas nuestros Términos de servicio y Política de privacidad
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.surface, alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.lg, gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.text },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  toggleContainer: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: -20,
    backgroundColor: colors.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', position: 'relative' },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: '700', color: colors.textSecondary },
  toggleTextActive: { color: colors.background },
  saveBadge: {
    position: 'absolute', top: -8, right: -4,
    backgroundColor: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
  },
  saveBadgeText: { color: colors.background, fontSize: 10, fontWeight: '700' },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center',
    marginTop: spacing.lg, marginBottom: spacing.md,
  },
  benefitsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  benefitCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  benefitIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  benefitTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  benefitDesc: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  planCard: {
    margin: spacing.md, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg,
    borderWidth: 2, borderColor: colors.primary, alignItems: 'center',
  },
  planBadge: {
    position: 'absolute', top: -14, backgroundColor: '#C9A84C',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  planBadgeText: { color: colors.background, fontSize: 13, fontWeight: '700' },
  planName: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: spacing.sm },
  planDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md },
  priceAmount: { fontSize: 40, fontWeight: '900', color: colors.text },
  pricePeriod: { fontSize: 16, color: colors.textSecondary, marginBottom: 6 },
  planSavings: { fontSize: 13, color: colors.success, fontWeight: '600', marginTop: 4 },
  featureList: { width: '100%', gap: spacing.sm, marginTop: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  featureDisabled: { color: colors.textMuted },
  selectBtn: {
    width: '100%', backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
  },
  selectBtnText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  freePlanCard: {
    margin: spacing.md, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  freePlanName: { fontSize: 22, fontWeight: '900', color: colors.text },
  freePlanDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  freePlanPrice: { fontSize: 36, fontWeight: '900', color: colors.textSecondary, marginTop: spacing.md },
  freeBtn: {
    width: '100%', borderWidth: 2, borderColor: colors.border, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg,
  },
  freeBtnText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  faqItem: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface,
    borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  faqAnswer: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  guarantee: {
    flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.infoLight, borderWidth: 1, borderColor: '#1A3A5C', borderRadius: 14, padding: spacing.md,
  },
  guaranteeTitle: { fontSize: 14, fontWeight: '700', color: colors.info },
  guaranteeText: { fontSize: 12, color: colors.info, lineHeight: 18, marginTop: 2 },
  legalText: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.lg,
  },
});
