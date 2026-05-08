import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { ProfileVisitor, getProfileVisitors } from '../services/matches.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatPresence } from '../utils/presence';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'ProfileVisitors'>;

export const ProfileVisitorsScreen = ({ navigation }: Props) => {
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumGate, setPremiumGate] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getProfileVisitors();
      setVisitors(data);
      setPremiumGate(false);
    } catch (err: any) {
      if (err?.response?.status === 403) setPremiumGate(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (premiumGate) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.gateIcon}>
          <Ionicons name="eye" size={36} color={colors.premiumStart} />
        </View>
        <Text style={styles.gateTitle}>Solo para Premium</Text>
        <Text style={styles.gateText}>
          Descubre quién ha visto tu perfil y conecta con quienes muestran interés.
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('Pricing')}>
          <Ionicons name="diamond" size={16} color={colors.background} />
          <Text style={styles.gateBtnText}>Ver planes Premium</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Te han visitado</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="eye-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Aún nadie ha visto tu perfil</Text>
          <Text style={styles.emptyText}>
            Cuando alguien abra tu perfil aparecerá aquí. Activa el Boost para destacar y atraer visitas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={
            <Text style={styles.subtitle}>
              {visitors.length} {visitors.length === 1 ? 'visita' : 'visitas'} en los últimos 30 días
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  userId: item.id,
                  preview: { firstName: item.firstName, lastName: item.lastName, avatarUrl: item.avatarUrl },
                })
              }
              accessibilityRole="button"
            >
              <Avatar firstName={item.firstName} lastName={item.lastName} avatarUrl={item.avatarUrl} size={56} />
              <View style={styles.rowContent}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{formatPresence(item.lastViewAt).label.replace('Activo', 'Visto')}</Text>
                  {item.viewCount > 1 && (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.metaText}>{item.viewCount} vistas</Text>
                    </>
                  )}
                </View>
                {item.location ? <Text style={styles.location} numberOfLines={1}>{item.location}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: spacing.lg },
  subtitle: { color: colors.textMuted, fontSize: 12, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowContent: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted, marginHorizontal: 4 },
  location: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  gateIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201,168,76,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gateTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  gateText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.premiumStart,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  gateBtnText: { color: colors.background, fontWeight: '800', fontSize: 14 },
});
