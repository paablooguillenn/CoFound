import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPreferences, toggle2FARequest } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Setup2FA'>;

export const Setup2FAScreen = ({ navigation }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPreferences()
      .then((data) => setEnabled(data.twoFactorEnabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const result = await toggle2FARequest(value);
      setEnabled(result.twoFactorEnabled);
      Alert.alert(
        result.twoFactorEnabled ? '2FA activado' : '2FA desactivado',
        result.twoFactorEnabled
          ? 'A partir del próximo inicio de sesión te enviaremos un código por email para verificar tu identidad.'
          : 'La autenticación de dos factores se ha desactivado.',
      );
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado de 2FA.');
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Autenticación 2FA</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={48} color={colors.success} />
        </View>
        <Text style={styles.title}>Verificación en dos pasos</Text>
        <Text style={styles.sub}>
          Cuando inicias sesión, te pediremos un código de 6 dígitos enviado a tu email registrado, además de tu contraseña.
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons
              name={enabled ? 'lock-closed' : 'lock-open-outline'}
              size={22}
              color={enabled ? colors.success : colors.textMuted}
            />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>2FA por email</Text>
              <Text style={styles.rowDesc}>{enabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              disabled={saving}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={enabled ? colors.white : colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.note}>
          Próximamente: 2FA por aplicación autenticadora (TOTP) y respaldo con códigos de un solo uso.
        </Text>
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
  content: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md },
  section: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.md, marginTop: spacing.md, lineHeight: 18 },
});
