import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Avatar } from '../components/Avatar';
import { Coachmark, CoachmarkStep } from '../components/Coachmark';
import { getLikesReceived, getMatches } from '../services/matches.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MatchItem } from '../types/models';
import { AppStackParamList } from '../types/navigation';

const MATCHES_TUTORIAL_KEY = 'cofound:matchesTutorialSeen';

const MATCHES_STEPS: CoachmarkStep[] = [
  {
    arrowTopRatio: 0.13,
    arrowAlign: 'center',
    arrowDirection: 'up',
    title: 'Tus conexiones',
    description:
      'Aquí aparecen las personas con las que has conectado. Las que tienen mensaje sin leer se marcan con un punto verde.',
  },
  {
    arrowTopRatio: 0.21,
    arrowAlign: 'left',
    arrowDirection: 'up',
    title: 'Buscador',
    description:
      'Si tienes muchas conexiones, escribe el nombre aquí para filtrar la lista al vuelo.',
  },
  {
    arrowTopRatio: 0.21,
    arrowAlign: 'right',
    arrowDirection: 'up',
    title: 'Solicitudes',
    description:
      'El icono de la izquierda te lleva a las personas que te han mostrado interés todavía sin responder.',
  },
  {
    arrowTopRatio: 0.5,
    arrowAlign: 'center',
    arrowDirection: 'down',
    title: 'Caducidad',
    description:
      'Una conexión sin mensajes en 7 días desaparece automáticamente — el aviso "Caduca en…" te avisa cuando queda poco.',
  },
];

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// ─── Animated Match Row ─────────────────────────────────────────────────────

const AnimatedMatchRow = ({
  match,
  index,
  onPress,
}: {
  match: MatchItem;
  index: number;
  onPress: () => void;
}) => {
  const slideIn = useRef(new Animated.Value(60)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideIn, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideIn, fadeIn, index]);

  const matchName = `${match.user.firstName} ${match.user.lastName}`;
  const unread = match.unreadCount ?? 0;
  const lastMsg = match.lastMessage;
  const lastMsgAt = match.lastMessageAt;
  const lastMsgIsMe = match.lastMessageIsMe;

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateX: slideIn }],
      }}
    >
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View>
          <Avatar
            firstName={match.user.firstName}
            lastName={match.user.lastName}
            avatarUrl={match.user.avatarUrl}
            size={56}
          />
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>

        <View style={styles.rowContent}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>
              {matchName}
            </Text>
            {lastMsgAt && (
              <Text style={[styles.time, unread > 0 && styles.timeUnread]}>
                {formatTime(lastMsgAt)}
              </Text>
            )}
          </View>
          {lastMsg ? (
            <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {lastMsgIsMe ? 'Tú: ' : ''}{lastMsg}
            </Text>
          ) : (
            <View style={styles.newMatchRow}>
              <Ionicons name="sparkles" size={12} color="#4ADE80" />
              <Text style={styles.noMessage}>Nueva conexión — envía un primer mensaje</Text>
            </View>
          )}
          {!match.hasMessage && match.expiresAt && (() => {
            const ms = new Date(match.expiresAt).getTime() - Date.now();
            if (ms <= 0) return null;
            const days = Math.floor(ms / (24 * 3600 * 1000));
            const hours = Math.floor(ms / (3600 * 1000));
            const isUrgent = ms < 24 * 3600 * 1000;
            const label =
              days >= 1 ? `Expira en ${days} ${days === 1 ? 'día' : 'días'}` : `Expira en ${Math.max(hours, 1)} h`;
            return (
              <View style={[styles.expiryRow, isUrgent && styles.expiryRowUrgent]}>
                <Ionicons name="time-outline" size={11} color={isUrgent ? '#fca5a5' : colors.textMuted} />
                <Text style={[styles.expiryText, isUrgent && styles.expiryTextUrgent]}>{label}</Text>
              </View>
            );
          })()}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main MatchesScreen ─────────────────────────────────────────────────────

export const MatchesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  // Show first-visit coachmark only if the user has at least one match — no
  // point teaching the matches list when it's empty.
  useEffect(() => {
    if (matches.length === 0) return;
    let cancelled = false;
    AsyncStorage.getItem(MATCHES_TUTORIAL_KEY).then((seen) => {
      if (!cancelled && !seen) setShowTutorial(true);
    });
    return () => {
      cancelled = true;
    };
  }, [matches.length]);

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    AsyncStorage.setItem(MATCHES_TUTORIAL_KEY, '1').catch(() => {});
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(q);
  });

  const loadMatches = useCallback(async () => {
    try {
      const [matchesData, likesData] = await Promise.all([
        getMatches(),
        getLikesReceived().catch(() => []),
      ]);
      setMatches(matchesData);
      setLikesCount(likesData.length);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las conexiones.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, [loadMatches]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Conexiones</Text>
          <Text style={styles.headerSubtitle}>
            {matches.length} {matches.length === 1 ? 'conexión activa' : 'conexiones activas'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.likesReceivedBtn, likesCount > 0 && styles.likesReceivedBtnActive]}
          onPress={() => navigation.navigate('LikesReceived')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Solicitudes de conexión — ${likesCount} pendientes`}
        >
          <Ionicons
            name="person-add"
            size={16}
            color={likesCount > 0 ? colors.white : '#3B82F6'}
          />
          <Text style={[styles.likesReceivedText, likesCount > 0 && styles.likesReceivedTextActive]}>
            Solicitudes
          </Text>
          {likesCount > 0 && (
            <View style={styles.likesBadge}>
              <Text style={styles.likesBadgeText}>{likesCount > 99 ? '99+' : likesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {matches.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={40} color="#4ADE80" />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes conexiones</Text>
            <Text style={styles.emptyText}>
              Cuando alguien en quien hayas mostrado interés te corresponda, aparecerá aquí como conexión.
            </Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => navigation.getParent()?.navigate('Discover')}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={18} color={colors.background} />
              <Text style={styles.discoverBtnText}>Explorar perfiles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar conexión por nombre..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {filteredMatches.length === 0 && (
              <Text style={styles.searchEmpty}>No hay conexiones que coincidan con "{searchQuery}".</Text>
            )}
            {filteredMatches.map((match, index) => {
              const matchName = `${match.user.firstName} ${match.user.lastName}`;
              return (
                <AnimatedMatchRow
                  key={match.id}
                  match={match}
                  index={index}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      matchId: match.id,
                      matchName,
                      matchAvatar: match.user.avatarUrl,
                    })
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
      {showTutorial && <Coachmark steps={MATCHES_STEPS} onFinish={dismissTutorial} />}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  likesReceivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  likesReceivedBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  likesReceivedText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
  likesReceivedTextActive: { color: colors.white },
  likesBadge: {
    backgroundColor: colors.white,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  likesBadgeText: { color: '#3B82F6', fontSize: 11, fontWeight: '900' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  listContainer: { paddingTop: spacing.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  searchEmpty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74,222,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: spacing.sm,
  },
  discoverBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: colors.textMuted, marginLeft: 8 },
  timeUnread: { color: colors.pink },
  lastMessage: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  lastMessageUnread: { color: colors.textSecondary, fontWeight: '600' },
  newMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noMessage: { fontSize: 13, color: '#4ADE80', fontWeight: '600' },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.pink,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  unreadText: { fontSize: 11, fontWeight: '800', color: colors.white },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(160,160,160,0.08)',
  },
  expiryRowUrgent: {
    backgroundColor: 'rgba(252,165,165,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.35)',
  },
  expiryText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  expiryTextUrgent: { color: '#fca5a5' },
});
