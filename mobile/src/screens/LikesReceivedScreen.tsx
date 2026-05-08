import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          Descubre quién quiere conectar contigo sin tener que explorar a ciegas.
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
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de conexión</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : likes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin solicitudes pendientes</Text>
          <Text style={styles.emptyText}>
            Cuando alguien muestre interés en tu perfil, aparecerá aquí.
          </Text>
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
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  userId: item.id,
                  preview: {
                    firstName: item.firstName,
                    lastName: item.lastName,
                    avatarUrl: item.avatarUrl,
                  },
                })
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${item.firstName} ${item.lastName}`}
            >
              <View style={[styles.avatarWrap, item.isSuper && styles.avatarSuper]}>
                <Avatar
                  firstName={item.firstName}
                  lastName={item.lastName}
                  avatarUrl={item.avatarUrl}
                  size={56}
                />
                {item.isSuper && (
                  <View style={styles.superBadge}>
                    <Ionicons name="rocket" size={12} color="#fff" />
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
              <Pressable
                style={styles.likeBack}
                onPress={(e) => {
                  e.stopPropagation();
                  handleLikeBack(item);
                }}
                accessibilityRole="button"
                accessibilityLabel="Aceptar conexión"
              >
                <Ionicons name="person-add" size={22} color="#3B82F6" />
              </Pressable>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
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
