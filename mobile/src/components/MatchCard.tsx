import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MatchItem } from '../types/models';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { SkillBadge } from './SkillBadge';

export const MatchCard = ({ match }: { match: MatchItem }) => (
  <View style={styles.card}>
    <Text style={styles.name}>{match.user.firstName} {match.user.lastName}</Text>
    <Text style={styles.location}>{match.user.location || 'Ubicación no indicada'}</Text>
    <Text style={styles.bio}>{match.user.bio || 'Sin biografía todavía.'}</Text>

    <View style={styles.badges}>
      {match.user.offeredSkills.slice(0, 4).map((skill) => (
        <SkillBadge key={`${match.id}-${skill.name}`} label={skill.name} variant="offer" />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  location: {
    color: colors.primary,
    fontWeight: '600',
  },
  bio: {
    color: colors.text,
    lineHeight: 21,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
