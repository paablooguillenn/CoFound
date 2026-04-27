import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserPreferences, getPreferences, updatePreferences } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

type ToggleId = keyof Pick<
  UserPreferences,
  'notifMatches' | 'notifMessages' | 'notifRecommendations' | 'notifEmail' | 'notifMarketing' | 'doNotDisturb' | 'vibration'
>;

const DEFAULT_NOTIF: Required<Pick<UserPreferences, ToggleId>> = {
  notifMatches: true,
  notifMessages: true,
  notifRecommendations: true,
  notifEmail: false,
  notifMarketing: false,
  doNotDisturb: false,
  vibration: true,
};

export const NotificationsScreen = ({ navigation }: Props) => {
  const [prefs, setPrefs] = useState(DEFAULT_NOTIF);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPreferences()
      .then(({ preferences }) => {
        setPrefs((prev) => ({ ...prev, ...preferences }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: ToggleId) => {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    updatePreferences({ [key]: next }).catch(() => {
      setPrefs((p) => ({ ...p, [key]: !next }));
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const pushItems: { id: ToggleId; title: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { id: 'notifMatches', title: 'Nuevos matches', description: 'Cuando alguien hace match contigo', icon: 'heart', color: '#F87171' },
    { id: 'notifMessages', title: 'Mensajes', description: 'Nuevos mensajes en tus chats', icon: 'chatbubble', color: colors.info },
    { id: 'notifRecommendations', title: 'Recomendaciones', description: 'Perfiles altamente compatibles', icon: 'sparkles', color: colors.primary },
    { id: 'notifEmail', title: 'Email semanal', description: 'Resumen de actividad por email', icon: 'mail', color: colors.success },
    { id: 'notifMarketing', title: 'Promociones', description: 'Descuentos en suscripciones premium', icon: 'notifications', color: '#C9A84C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Tus preferencias se guardan automáticamente y se sincronizan en todos tus dispositivos.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notificaciones push</Text>
          </View>
          {pushItems.map((item, idx) => (
            <View key={item.id} style={[styles.row, idx === pushItems.length - 1 && { borderBottomWidth: 0 }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.description}</Text>
              </View>
              <Switch
                value={!!prefs[item.id]}
                onValueChange={() => toggle(item.id)}
                trackColor={{ false: colors.border, true: colors.primaryDark }}
                thumbColor={prefs[item.id] ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Horario y comportamiento</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="moon" size={20} color={colors.primary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Modo No molestar</Text>
              <Text style={styles.rowDesc}>Silencia notificaciones de 22:00 a 08:00</Text>
            </View>
            <Switch
              value={!!prefs.doNotDisturb}
              onValueChange={() => toggle('doNotDisturb')}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={prefs.doNotDisturb ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Ionicons name="phone-portrait" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Vibración</Text>
              <Text style={styles.rowDesc}>Vibrar al recibir notificaciones</Text>
            </View>
            <Switch
              value={!!prefs.vibration}
              onValueChange={() => toggle('vibration')}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={prefs.vibration ? colors.primary : colors.textMuted}
            />
          </View>
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
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: '#1A3A5C',
    borderRadius: 14,
    padding: spacing.md,
  },
  infoText: { fontSize: 13, color: colors.info, lineHeight: 20 },
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
});
