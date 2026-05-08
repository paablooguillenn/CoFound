import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';
import {
  AttendeeStatus,
  CATEGORY_META,
  EventDetail,
  deleteEvent,
  getEvent,
  setEventRsvp,
} from '../services/events.service';

const formatLong = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EventDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'EventDetail'>>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getEvent(route.params.eventId);
      setEvent(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el evento.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [route.params.eventId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRsvp = async (status: AttendeeStatus | null) => {
    if (!event) return;
    setSubmitting(true);
    try {
      await setEventRsvp(event.id, status);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo actualizar tu asistencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;
    Alert.alert(
      'Borrar evento',
      '¿Seguro que quieres borrar este evento? Los apuntados serán notificados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo borrar.');
            }
          },
        },
      ],
    );
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = CATEGORY_META[event.category];
  const isOrganizer = event.organizerId === user?.id;
  const goingCount = event.attendees.filter((a) => a.status === 'going').length;
  const capacityFull = event.capacity != null && goingCount >= event.capacity && event.myStatus !== 'going';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
        {isOrganizer && (
          <TouchableOpacity onPress={handleDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.cover, { backgroundColor: meta.bg }]}>
          <Text style={styles.coverEmoji}>{meta.emoji}</Text>
          <View style={[styles.coverChip, { backgroundColor: meta.color }]}>
            <Text style={styles.coverChipText}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatLong(event.startsAt)}</Text>
          </View>
          {(event.city || event.location) && (
            <View style={styles.metaRow}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {[event.city, event.location].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {goingCount}
              {event.capacity ? ` / ${event.capacity}` : ''} confirmados
            </Text>
          </View>
        </View>

        {event.organizer && (
          <View style={styles.organizerRow}>
            <Avatar
              firstName={event.organizer.firstName}
              lastName={event.organizer.lastName}
              avatarUrl={event.organizer.avatarUrl}
              size={40}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.organizerLabel}>Organiza</Text>
              <Text style={styles.organizerName}>
                {event.organizer.firstName} {event.organizer.lastName}
              </Text>
            </View>
          </View>
        )}

        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre el evento</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apuntados ({event.attendees.length})</Text>
          {event.attendees.length === 0 ? (
            <Text style={styles.emptyAttendees}>Aún no hay nadie apuntado.</Text>
          ) : (
            <View style={styles.attendeesGrid}>
              {event.attendees.map((a) => (
                <View key={a.id} style={styles.attendeeChip}>
                  <Avatar
                    firstName={a.firstName}
                    lastName={a.lastName}
                    avatarUrl={a.avatarUrl}
                    size={28}
                  />
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {a.firstName}
                  </Text>
                  {a.status === 'interested' && (
                    <Ionicons name="star" size={11} color="#C9A84C" />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isOrganizer && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              event.myStatus === 'interested' && styles.footerBtnActiveAlt,
            ]}
            onPress={() => handleRsvp(event.myStatus === 'interested' ? null : 'interested')}
            disabled={submitting}
          >
            <Ionicons name="star" size={18} color={event.myStatus === 'interested' ? colors.background : '#C9A84C'} />
            <Text
              style={[
                styles.footerBtnText,
                event.myStatus === 'interested' && { color: colors.background },
              ]}
            >
              Quizás
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              styles.footerBtnPrimary,
              event.myStatus === 'going' && styles.footerBtnActive,
              capacityFull && styles.footerBtnDisabled,
            ]}
            onPress={() => handleRsvp(event.myStatus === 'going' ? null : 'going')}
            disabled={submitting || capacityFull}
          >
            <Ionicons
              name={event.myStatus === 'going' ? 'checkmark-circle' : 'flash'}
              size={18}
              color={colors.background}
            />
            <Text style={[styles.footerBtnText, { color: colors.background }]}>
              {capacityFull ? 'Completo' : event.myStatus === 'going' ? 'Voy' : 'Apuntarme'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  cover: {
    height: 130,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverEmoji: { fontSize: 56 },
  coverChip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  coverChipText: { fontSize: 12, fontWeight: '800', color: colors.white },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  metaBlock: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  organizerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  organizerName: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  descriptionText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  emptyAttendees: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  attendeesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attendeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingRight: 10,
    paddingVertical: 3,
    paddingLeft: 3,
    maxWidth: 140,
  },
  attendeeName: { fontSize: 13, color: colors.text, fontWeight: '600', flexShrink: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  footerBtnActive: { backgroundColor: '#4ADE80', borderColor: '#4ADE80' },
  footerBtnActiveAlt: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  footerBtnDisabled: { opacity: 0.55 },
  footerBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
