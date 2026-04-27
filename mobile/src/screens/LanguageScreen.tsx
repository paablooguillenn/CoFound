import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPreferences, updatePreferences } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Language'>;

const LANGUAGES: { code: 'es' | 'en'; label: string; native: string; flag: string }[] = [
  { code: 'es', label: 'Español', native: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', native: 'English', flag: '🇬🇧' },
];

export const LanguageScreen = ({ navigation }: Props) => {
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPreferences()
      .then((data) => {
        const current = data.preferences?.locale;
        if (current === 'en' || current === 'es') setLocale(current);
      })
      .catch(() => {});
  }, []);

  const handleSelect = async (code: 'es' | 'en') => {
    if (code === locale) return;
    setSaving(true);
    setLocale(code);
    try {
      await updatePreferences({ locale: code });
      Alert.alert(
        'Idioma actualizado',
        code === 'en'
          ? 'La interfaz seguirá en español por ahora; la traducción completa al inglés llegará en una próxima actualización. Tu preferencia se ha guardado.'
          : 'Idioma guardado: Español.',
      );
    } catch {
      Alert.alert('Error', 'No se pudo guardar la preferencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Idioma</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sub}>Selecciona el idioma de la aplicación.</Text>
        <View style={styles.section}>
          {LANGUAGES.map((lang, idx) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, idx === LANGUAGES.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleSelect(lang.code)}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{lang.native}</Text>
                <Text style={styles.rowDesc}>{lang.label}</Text>
              </View>
              {locale === lang.code && (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  content: { padding: spacing.md, gap: spacing.md },
  sub: { fontSize: 14, color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  flag: { fontSize: 24 },
});
