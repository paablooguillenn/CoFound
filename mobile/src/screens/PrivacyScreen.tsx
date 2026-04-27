import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserPreferences, getPreferences, updatePreferences } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Privacy'>;

type PrivacyKey = keyof Pick<
  UserPreferences,
  'privacyProfileVisible' | 'privacyShowOnline' | 'privacyShowDistance' | 'privacyReadReceipts'
>;

const DEFAULTS: Required<Pick<UserPreferences, PrivacyKey>> = {
  privacyProfileVisible: true,
  privacyShowOnline: true,
  privacyShowDistance: true,
  privacyReadReceipts: true,
};

export const PrivacyScreen = ({ navigation }: Props) => {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    getPreferences()
      .then(({ preferences, twoFactorEnabled }) => {
        setPrefs((prev) => ({ ...prev, ...preferences }));
        setTwoFA(twoFactorEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: PrivacyKey) => {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    updatePreferences({ [key]: next }).catch(() => {
      setPrefs((p) => ({ ...p, [key]: !next }));
    });
  };

  const switchProps = (value: boolean, onChange: () => void) => ({
    value,
    onValueChange: onChange,
    trackColor: { false: colors.border, true: colors.primaryDark },
    thumbColor: value ? colors.primary : colors.textMuted,
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad y seguridad</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tus datos están protegidos</Text>
            <Text style={styles.infoText}>
              Cumplimos con el RGPD y nunca compartimos tu información con terceros sin tu
              consentimiento.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visibilidad del perfil</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Ionicons
              name={prefs.privacyProfileVisible ? 'eye' : 'eye-off'}
              size={20}
              color={prefs.privacyProfileVisible ? colors.primary : colors.textMuted}
            />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Perfil visible</Text>
              <Text style={styles.rowDesc}>Aparece en búsquedas de otros usuarios</Text>
            </View>
            <Switch {...switchProps(prefs.privacyProfileVisible, () => toggle('privacyProfileVisible'))} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="person-circle" size={20} color={colors.success} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Estado en línea</Text>
              <Text style={styles.rowDesc}>Muestra cuando estás activo</Text>
            </View>
            <Switch {...switchProps(prefs.privacyShowOnline, () => toggle('privacyShowOnline'))} />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Ionicons name="location" size={20} color="#C9A84C" />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Mostrar distancia</Text>
              <Text style={styles.rowDesc}>Ubicación aproximada en tu perfil</Text>
            </View>
            <Switch {...switchProps(prefs.privacyShowDistance, () => toggle('privacyShowDistance'))} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mensajería</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Ionicons name="checkmark-done" size={20} color={colors.info} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Confirmaciones de lectura</Text>
              <Text style={styles.rowDesc}>Muestra cuando lees los mensajes</Text>
            </View>
            <Switch {...switchProps(prefs.privacyReadReceipts, () => toggle('privacyReadReceipts'))} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Datos y privacidad</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('DataExport')} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Descargar mis datos</Text>
              <Text style={styles.rowDesc}>Obtén una copia de toda tu información</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://co-found-backend.vercel.app/privacy.html').catch(() => {})}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Política de privacidad</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://co-found-backend.vercel.app/terms.html').catch(() => {})}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Términos y condiciones</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.securityHeader]}>
            <Ionicons name="lock-closed" size={18} color={colors.success} />
            <View>
              <Text style={styles.securityTitle}>Autenticación de dos factores</Text>
              <Text style={styles.securityDesc}>
                Protege tu cuenta con una capa extra de seguridad
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Setup2FA')}
            activeOpacity={0.7}
          >
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Configurar 2FA</Text>
              <Text style={[styles.rowDesc, twoFA && { color: colors.success }]}>
                {twoFA ? 'Activado' : 'No configurado'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: '#1A3A5C',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.info, marginBottom: 2 },
  infoText: { fontSize: 12, color: colors.info, lineHeight: 18, opacity: 0.8 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderBottomColor: '#1A3D25',
  },
  securityTitle: { fontSize: 14, fontWeight: '700', color: colors.success },
  securityDesc: { fontSize: 12, color: colors.success, marginTop: 1, opacity: 0.8 },
});
