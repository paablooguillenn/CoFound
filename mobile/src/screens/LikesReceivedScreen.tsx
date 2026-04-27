import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { LikeReceived, getLikesReceived, likeProfile } from '../services/matches.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

export const LikesReceivedScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const [likes, setLikes] = useState<LikeReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumGate, setPremiumGate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLikesReceived();
      setLikes(data);
      setPremiumGate(false);
    } catch (err: any) {
      if (err?.response?.status === 403) setPremiumGate(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLikeBack = async (item: LikeReceived) => {
    try {
      const result = await likeProfile(item.id);
      setLikes((prev) => prev.filter((l) => l.id !== item.id));
      if (result.isMatch && result.matchId) {
        navigation.navigate('Chat', {
          matchId: result.matchId,
          matchName: `${item.firstName} ${item.lastName}`,
          matchAvatar: item.avatarUrl ?? null,
        });
      }
    } catch {}
  };

  if (premiumGate) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.gateIcon}>
          <Ionicons name="lock-closed" size={36} color={colors.premiumStart} />
        </View>
        <Text style={styles.gateTitle}>Solo para Premium</Text>
        <Text style={styles.gateText}>
          Descubre quién te ha dado like sin necesidad de hacer swipe a ciegas.
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('Pricing')}>
          <Ionicons name="diamond" size={16} color={colors.background} />
          <Text style={styles.gateBtnText}>Ver planes Premium</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Te han dado like</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : likes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Aún no tienes likes</Text>
          <Text style={styles.emptyText}>Sigue completando tu perfil y haciendo swipe.</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.avatarWrap, item.isSuper && styles.avatarSuper]}>
                <Avatar
                  firstName={item.firstName}
                  lastName={item.lastName}
                  avatarUrl={item.avatarUrl}
                  size={56}
                />
                {item.isSuper && (
                  <View style={styles.superBadge}>
                    <Ionicons name="star" size={12} color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                {item.location ? (
                  <View style={styles.locRow}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.locText}>{item.location}</Text>
                  </View>
                ) : null}
                {!isPremium && <Text style={styles.bioBlur}>•••••••••••••••••••••</Text>}
                {isPremium && item.bio ? (
                  <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.likeBack} onPress={() => handleLikeBack(item)} activeOpacity={0.7}>
                <Ionicons name="heart" size={22} color={colors.pink} />
              </TouchableOpacity>
            </View>
          )}
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
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatarSuper: { borderWidth: 2, borderColor: colors.info, borderRadius: 32 },
  superBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowContent: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locText: { fontSize: 12, color: colors.textMuted },
  bio: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
  bioBlur: { fontSize: 13, color: colors.textMuted, marginTop: 4, letterSpacing: 1 },
  likeBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pinkLight,
    borderWidth: 1,
    borderColor: 'rgba(233,30,99,0.3)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  gateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201,168,76,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  gateTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  gateText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.premiumStart,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  gateBtnText: { color: colors.background, fontSize: 15, fontWeight: '700' },
});
