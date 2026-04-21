import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

interface NotifSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  enabled: boolean;
}

const INITIAL_SETTINGS: NotifSetting[] = [
  {
    id: 'matches',
    title: 'Nuevos matches',
    description: 'Recibe una notificación cuando alguien te da like',
    icon: 'heart',
    iconColor: '#F87171',
    enabled: true,
  },
  {
    id: 'messages',
    title: 'Mensajes',
    description: 'Notificaciones de nuevos mensajes en el chat',
    icon: 'chatbubble',
    iconColor: colors.info,
    enabled: true,
  },
  {
    id: 'recommendations',
    title: 'Recomendaciones',
    description: 'Perfiles altamente compatibles contigo',
    icon: 'sparkles',
    iconColor: colors.primary,
    enabled: true,
  },
  {
    id: 'email',
    title: 'Notificaciones por email',
    description: 'Resumen semanal de actividad',
    icon: 'mail',
    iconColor: colors.success,
    enabled: false,
  },
  {
    id: 'marketing',
    title: 'Promociones y ofertas',
    description: 'Descuentos en suscripciones premium',
    icon: 'notifications',
    iconColor: '#C9A84C',
    enabled: false,
  },
];

export const NotificationsScreen = ({ navigation }: Props) => {
  const [settings, setSettings] = useState<NotifSetting[]>(INITIAL_SETTINGS);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  const toggle = (id: string) =>
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Gestiona cómo y cuándo quieres recibir notificaciones de CoFound
          </Text>
        </View>

        {/* Push section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notificaciones push</Text>
            <Text style={styles.sectionSubtitle}>
              Activa o desactiva notificaciones individuales
            </Text>
          </View>

          {settings.map((s) => (
            <View key={s.id} style={styles.row}>
              <Ionicons name={s.icon} size={20} color={s.iconColor} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowDesc}>{s.description}</Text>
              </View>
              <Switch
                value={s.enabled}
                onValueChange={() => toggle(s.id)}
                trackColor={{ false: colors.border, true: colors.primaryDark }}
                thumbColor={s.enabled ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
        </View>

        {/* Do not disturb */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Horario de notificaciones</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="moon" size={20} color={colors.primary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Modo No molestar</Text>
              <Text style={styles.rowDesc}>Silencia notificaciones por la noche</Text>
            </View>
            <Switch
              value={doNotDisturb}
              onValueChange={setDoNotDisturb}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={doNotDisturb ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Desde</Text>
              <Text style={styles.timeValue}>22:00</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Hasta</Text>
              <Text style={styles.timeValue}>08:00</Text>
            </View>
          </View>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sonido y vibración</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="volume-medium" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Sonido</Text>
              <Text style={styles.rowDesc}>Predeterminado</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>

          <View style={styles.row}>
            <Ionicons name="phone-portrait" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Vibración</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={colors.primary}
            />
          </View>
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
  sectionSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  timeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
  },
  timeLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '700', color: colors.text },
});
