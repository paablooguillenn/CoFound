import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { LikeSent, getLikesSent } from '../services/matches.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'MyActivity'>;

const formatRelative = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  return `hace ${w} sem`;
};

export const MyActivityScreen = ({ navigation }: Props) => {
  const [items, setItems] = useState<LikeSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getLikesSent();
      setItems(data);
    } catch {
      /* swallow — show empty state */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi actividad</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="paper-plane-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin solicitudes pendientes</Text>
          <Text style={styles.emptyText}>
            Aquí aparecerán los perfiles a los que has mostrado interés y aún no han correspondido.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
              {items.length} {items.length === 1 ? 'persona' : 'personas'} pendiente{items.length === 1 ? '' : 's'} de respuesta
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
              accessibilityLabel={`Ver perfil de ${item.firstName} ${item.lastName}`}
            >
              <View style={[styles.avatarWrap, item.isSuper && styles.avatarSuper]}>
                <Avatar firstName={item.firstName} lastName={item.lastName} avatarUrl={item.avatarUrl} size={56} />
                {item.isSuper && (
                  <View style={styles.superBadge}>
                    <Ionicons name="rocket" size={11} color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{formatRelative(item.likedAt)}</Text>
                  {item.location ? (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                    </>
                  ) : null}
                </View>
                {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
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
  avatarWrap: { position: 'relative' },
  avatarSuper: { borderWidth: 2, borderColor: '#C9A84C', borderRadius: 32, padding: 1 },
  superBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted, marginHorizontal: 4 },
  bio: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
