import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { ProfileBadges } from '../components/ProfileBadges';
import { SkillBadge } from '../components/SkillBadge';
import { SocialLinks } from '../components/SocialLinks';
import { getPublicUserProfile } from '../services/api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';
import { formatPresence } from '../utils/presence';

type Props = NativeStackScreenProps<AppStackParamList, 'UserProfile'>;

type PublicProfile = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string;
  interests: string;
  location: string;
  entrepreneurLevel: 'principiante' | 'intermedio' | 'avanzado' | null;
  goal: 'learn_skill' | 'find_partner' | 'networking' | null;
  linkedinUsername: string | null;
  instagramUsername: string | null;
  isPremium: boolean;
  lastSeenAt: string | null;
  emailVerified: boolean;
  offeredSkills: { name: string }[];
  learningSkills: { name: string }[];
  photos: { id: string; url: string; sortOrder: number }[];
};

export const UserProfileScreen = ({ navigation, route }: Props) => {
  const { userId, preview } = route.params;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPublicUserProfile(userId);
        if (!cancelled) setProfile(data);
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.response?.data?.message ?? 'No se pudo cargar el perfil.';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    // Show a skeleton with the preview data we already have so the navigation
    // feels instant — no blank screen flash on tap.
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {preview ? `${preview.firstName} ${preview.lastName}` : 'Cargando...'}
            </Text>
            <View style={{ width: 22 }} />
          </View>
        </SafeAreaView>
        <View style={[styles.heroSection, { paddingTop: spacing.xl }]}>
          {preview && (
            <>
              <Avatar
                firstName={preview.firstName}
                lastName={preview.lastName}
                avatarUrl={preview.avatarUrl ?? null}
                size={104}
              />
              <Text style={styles.fullName}>
                {preview.firstName} {preview.lastName}
              </Text>
            </>
          )}
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorTitle}>{error ?? 'Perfil no disponible'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {profile.firstName} {profile.lastName}
          </Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Avatar
            firstName={profile.firstName}
            lastName={profile.lastName}
            avatarUrl={profile.avatarUrl ?? preview?.avatarUrl ?? null}
            size={104}
          />
          <Text style={styles.fullName}>
            {profile.firstName} {profile.lastName}
            {profile.isPremium ? ' ⭐' : ''}
          </Text>
          {profile.lastSeenAt && (
            <Text style={styles.presence}>{formatPresence(profile.lastSeenAt).label}</Text>
          )}
          {profile.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          ) : null}

          {(profile.entrepreneurLevel || profile.goal) && (
            <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
              <ProfileBadges level={profile.entrepreneurLevel} goal={profile.goal} />
            </View>
          )}

          {(profile.linkedinUsername || profile.instagramUsername) && (
            <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
              <SocialLinks
                linkedinUsername={profile.linkedinUsername}
                instagramUsername={profile.instagramUsername}
                size={36}
              />
            </View>
          )}
        </View>

        {profile.photos && profile.photos.length > 0 && (
          <View style={styles.photoGrid}>
            {profile.photos.map((p) => (
              <View key={p.id} style={styles.photoSlot}>
                <Image source={{ uri: p.url }} style={styles.photoImg} />
              </View>
            ))}
          </View>
        )}

        {profile.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sobre mí</Text>
            <Text style={styles.cardText}>{profile.bio}</Text>
          </View>
        ) : null}

        {profile.interests ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Intereses</Text>
            <Text style={styles.cardText}>{profile.interests}</Text>
          </View>
        ) : null}

        {profile.offeredSkills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Habilidades que ofrece</Text>
            <View style={styles.skillRow}>
              {profile.offeredSkills.map((s) => (
                <SkillBadge key={s.name} label={s.name} variant="offer" />
              ))}
            </View>
          </View>
        )}

        {profile.learningSkills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Habilidades que busca</Text>
            <View style={styles.skillRow}>
              {profile.learningSkills.map((s) => (
                <SkillBadge key={s.name} label={s.name} variant="learn" />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  headerSafe: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: spacing.md },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  presence: { fontSize: 13, color: '#4ADE80', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  photoSlot: {
    width: '48.5%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoImg: { width: '100%', height: '100%' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
  },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.text, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  errorTitle: { fontSize: 15, color: colors.text, fontWeight: '700', textAlign: 'center', paddingHorizontal: spacing.md },
  backBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backBtnText: { color: colors.background, fontWeight: '700' },
});
