import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { getMatches } from '../services/matches.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MatchItem } from '../types/models';
import { AppStackParamList } from '../types/navigation';

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
              <Ionicons name="sparkles" size={12} color={colors.pink} />
              <Text style={styles.noMessage}>Nuevo match — ¡saluda!</Text>
            </View>
          )}
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
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los matches.');
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
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSubtitle}>
            {matches.length} {matches.length === 1 ? 'conexión' : 'conexiones'}
          </Text>
        </View>
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
              <Ionicons name="heart-outline" size={40} color={colors.pink} />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes matches</Text>
            <Text style={styles.emptyText}>
              Cuando alguien a quien le diste like también te dé like, aparecerá aquí.
              ¡Sigue descubriendo!
            </Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => navigation.getParent()?.navigate('Discover')}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color={colors.background} />
              <Text style={styles.discoverBtnText}>Descubrir perfiles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {matches.map((match, index) => {
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  listContainer: { paddingTop: spacing.xs },
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
    backgroundColor: colors.pinkLight,
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
    backgroundColor: colors.pink,
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
  noMessage: { fontSize: 13, color: colors.pink, fontWeight: '600' },
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
});
