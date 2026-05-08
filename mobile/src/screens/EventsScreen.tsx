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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';
import {
  CATEGORY_META,
  EVENT_CATEGORIES,
  EventCategory,
  EventSummary,
  listEvents,
} from '../services/events.service';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EventsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [category, setCategory] = useState<EventCategory | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listEvents({ category });
      setEvents(data);
    } catch {
      // Soft-fail: list stays empty, user can pull-to-refresh.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateEvent')}
          style={styles.createBtn}
          accessibilityRole="button"
          accessibilityLabel="Crear evento"
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <FlatList
          data={[undefined, ...EVENT_CATEGORIES]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c ?? 'all'}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
          renderItem={({ item }) => {
            const active = category === item || (item === undefined && !category);
            const meta = item ? CATEGORY_META[item] : null;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {meta ? `${meta.emoji} ${meta.label}` : 'Todos'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No hay eventos por aquí</Text>
              <Text style={styles.emptyText}>
                Sé el primero en organizar uno. Tap en "+" para crear.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = CATEGORY_META[item.category];
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
              >
                <View style={[styles.cardCategoryBar, { backgroundColor: meta.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardChip, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.cardChipText, { color: meta.color }]}>
                        {meta.emoji} {meta.label}
                      </Text>
                    </View>
                    {item.myStatus && (
                      <View style={styles.rsvpBadge}>
                        <Ionicons
                          name={item.myStatus === 'going' ? 'checkmark-circle' : 'star'}
                          size={12}
                          color="#4ADE80"
                        />
                        <Text style={styles.rsvpBadgeText}>
                          {item.myStatus === 'going' ? 'Voy' : 'Quizás'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cardMeta}>{formatDate(item.startsAt)}</Text>
                  </View>
                  {(item.city || item.location) && (
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {[item.city, item.location].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cardMeta}>
                      {item.attendeeCount}
                      {item.capacity ? ` / ${item.capacity}` : ''} apuntados
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: { paddingVertical: spacing.sm },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, gap: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardCategoryBar: { width: 4 },
  cardBody: { flex: 1, padding: spacing.md, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardChipText: { fontSize: 11, fontWeight: '800' },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rsvpBadgeText: { fontSize: 11, color: '#4ADE80', fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { fontSize: 12, color: colors.textSecondary, flex: 1 },
});
