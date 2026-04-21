import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { upgradePremium } from '../services/api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Checkout'>;

export const CheckoutScreen = ({ navigation, route }: Props) => {
  const { plan, price } = route.params;
  const { user, updateUser } = useAuth();
  const [method, setMethod] = useState<'card' | 'paypal'>('card');
  const [processing, setProcessing] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const annualTotal = plan === 'yearly' ? (price * 12).toFixed(2) : null;

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePay = async () => {
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        return Alert.alert('Error', 'Número de tarjeta inválido');
      }
      if (!cardName.trim()) return Alert.alert('Error', 'Introduce el nombre del titular');
      if (expiry.length < 5) return Alert.alert('Error', 'Fecha de expiración inválida');
      if (cvv.length < 3) return Alert.alert('Error', 'CVV inválido');
    }

    setProcessing(true);
    try {
      await upgradePremium(plan);
      // Update user in AuthContext to reflect premium status
      if (user) {
        updateUser({ ...user, isPremium: true });
      }
      navigation.replace('CheckoutSuccess', { plan });
    } catch {
      Alert.alert('Error', 'No se pudo procesar el pago. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar compra</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Pago 100% seguro</Text>
            <Text style={styles.securityText}>
              Tus datos están protegidos con encriptación SSL de nivel bancario
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan Premium</Text>
            <Text style={styles.summaryValue}>
              {plan === 'monthly' ? 'Mensual' : 'Anual'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Precio</Text>
            <Text style={styles.summaryValue}>{price}€/mes</Text>
          </View>
          {annualTotal && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Facturación anual</Text>
              <Text style={styles.summaryValue}>{annualTotal}€</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{price}€</Text>
          </View>
          {plan === 'yearly' && (
            <View style={styles.savingsBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.savingsText}>
                Ahorras {(5.99 * 12 - Number(annualTotal)).toFixed(2)}€ al año
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Método de pago</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
              onPress={() => setMethod('card')}
            >
              <Ionicons
                name="card"
                size={24}
                color={method === 'card' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.methodText, method === 'card' && styles.methodTextActive]}>
                Tarjeta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodBtn, method === 'paypal' && styles.methodBtnActive]}
              onPress={() => setMethod('paypal')}
            >
              <Text
                style={[
                  styles.paypalLogo,
                  { color: method === 'paypal' ? colors.primary : colors.textMuted },
                ]}
              >
                PP
              </Text>
              <Text style={[styles.methodText, method === 'paypal' && styles.methodTextActive]}>
                PayPal
              </Text>
            </TouchableOpacity>
          </View>

          {method === 'card' ? (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Número de tarjeta</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={(v) => setCardNumber(formatCard(v))}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre del titular</Text>
                <TextInput
                  style={styles.input}
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Expiración</Text>
                  <TextInput
                    style={styles.input}
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    placeholder="MM/AA"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
              <PrimaryButton
                label={processing ? 'Procesando...' : `Pagar ${price}€`}
                onPress={handlePay}
                loading={processing}
              />
            </View>
          ) : (
            <View style={styles.paypalSection}>
              <Text style={styles.paypalDesc}>
                Serás redirigido a PayPal para completar el pago de forma segura
              </Text>
              <PrimaryButton
                label={processing ? 'Procesando...' : 'Continuar con PayPal'}
                onPress={handlePay}
                loading={processing}
              />
            </View>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Lo que obtienes con Premium:</Text>
          {[
            'Likes ilimitados para conectar sin límites',
            'Ve quién te dio like antes de dar match',
            'Filtros avanzados por ubicación e industria',
            'Badge Premium visible en tu perfil',
          ].map((text) => (
            <View key={text} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.legalText}>
          Al continuar, aceptas la renovación automática. Puedes cancelar en cualquier momento desde la configuración.
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
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  securityBanner: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.successLight,
    borderWidth: 1, borderColor: '#1A3D25', borderRadius: 14, padding: spacing.md,
  },
  securityTitle: { fontSize: 13, fontWeight: '700', color: colors.success },
  securityText: { fontSize: 11, color: colors.success, marginTop: 1, opacity: 0.8 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: { borderBottomWidth: 0, marginTop: spacing.sm },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalPrice: { fontSize: 22, fontWeight: '900', color: colors.primary },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.successLight, borderRadius: 10, padding: spacing.sm, marginTop: spacing.sm,
  },
  savingsText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  methodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  methodBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', gap: 6,
  },
  methodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  methodTextActive: { color: colors.primary },
  paypalLogo: { fontSize: 22, fontWeight: '900' },
  form: { gap: spacing.md },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: colors.background,
  },
  paypalSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md },
  paypalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  benefitsCard: {
    backgroundColor: colors.primaryLight, borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  benefitsTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  benefitText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  legalText: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: spacing.sm,
  },
});
