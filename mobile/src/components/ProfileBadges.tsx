import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GOAL_META, LEVEL_META } from '../utils/profileLabels';
import { EntrepreneurLevel, Goal } from '../types/models';

type Props = {
  level?: EntrepreneurLevel | null;
  goal?: Goal | null;
  size?: 'sm' | 'md';
};

export const ProfileBadges = ({ level, goal, size = 'md' }: Props) => {
  if (!level && !goal) return null;

  const fontSize = size === 'sm' ? 11 : 12;
  const padV = size === 'sm' ? 3 : 5;
  const padH = size === 'sm' ? 8 : 10;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View style={styles.row}>
      {level && (
        <View
          style={[
            styles.badge,
            { backgroundColor: LEVEL_META[level].bg, paddingVertical: padV, paddingHorizontal: padH },
          ]}
        >
          <Ionicons name={LEVEL_META[level].icon as any} size={iconSize} color={LEVEL_META[level].color} />
          <Text style={[styles.text, { color: LEVEL_META[level].color, fontSize }]}>
            {LEVEL_META[level].label}
          </Text>
        </View>
      )}
      {goal && (
        <View
          style={[
            styles.badge,
            { backgroundColor: GOAL_META[goal].bg, paddingVertical: padV, paddingHorizontal: padH },
          ]}
        >
          <Ionicons name={GOAL_META[goal].icon as any} size={iconSize} color={GOAL_META[goal].color} />
          <Text style={[styles.text, { color: GOAL_META[goal].color, fontSize }]}>
            {size === 'sm' ? GOAL_META[goal].short : GOAL_META[goal].label}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
  },
  text: { fontWeight: '700' },
});
