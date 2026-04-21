import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DiscoveryUser } from '../types/models';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PrimaryButton } from './PrimaryButton';
import { SkillBadge } from './SkillBadge';

export const UserCard = ({
  user,
  onLike,
  loading,
}: {
  user: DiscoveryUser;
  onLike: () => void;
  loading?: boolean;
}) => (
  <View style={styles.card}>
    <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
    <Text style={styles.meta}>{user.location || 'Ubicación no indicada'} · Compatibilidad {user.compatibilityScore}</Text>
    <Text style={styles.bio}>{user.bio || 'Perfil en construcción.'}</Text>

    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Puede aportar</Text>
      <View style={styles.badges}>
        {user.offeredSkills.length ? user.offeredSkills.map((skill) => (
          <SkillBadge key={`offer-${skill.name}`} label={skill.name} variant="offer" />
        )) : <Text style={styles.empty}>Sin habilidades registradas</Text>}
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Quiere aprender</Text>
      <View style={styles.badges}>
        {user.learningSkills.length ? user.learningSkills.map((skill) => (
          <SkillBadge key={`learn-${skill.name}`} label={skill.name} variant="learn" />
        )) : <Text style={styles.empty}>Sin objetivos definidos</Text>}
      </View>
    </View>

    <PrimaryButton label="Me interesa" onPress={onLike} loading={loading} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  bio: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
  },
});
