import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from './Avatar';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 24;

/** Subtle confetti burst that explodes from the centre when the modal opens. */
const ConfettiBurst = ({ accent }: { accent: string }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        progress: new Animated.Value(0),
        angle: (i / CONFETTI_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        distance: 180 + Math.random() * 140,
        size: 6 + Math.random() * 8,
        color: i % 3 === 0 ? '#C9A84C' : accent,
      })),
    [accent],
  );

  useEffect(() => {
    Animated.stagger(
      18,
      pieces.map((p) =>
        Animated.timing(p.progress, {
          toValue: 1,
          duration: 1100 + Math.random() * 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [pieces]);

  return (
    <View pointerEvents="none" style={confettiStyles.container}>
      {pieces.map((p, i) => {
        const tx = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const ty = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance],
        });
        const opacity = p.progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0, 1, 0],
        });
        const rotate = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 360}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={[
              confettiStyles.piece,
              {
                width: p.size,
                height: p.size * 0.4,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const confettiStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 40,
    left: SCREEN_WIDTH / 2 - 6,
    width: 12,
    height: 12,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});

type Props = {
  visible: boolean;
  matchName: string;
  matchAvatar?: string | null;
  myFirstName?: string;
  myLastName?: string;
  myAvatarUrl?: string | null;
  isSuper?: boolean;
  commonSkills?: string[];
  onChat: () => void;
  onClose: () => void;
};

export const MatchNotification = ({
  visible,
  matchName,
  matchAvatar,
  myFirstName = 'Tú',
  myLastName = '',
  myAvatarUrl = null,
  isSuper = false,
  commonSkills = [],
  onChat,
  onClose,
}: Props) => {
  // Professional palette: gold for super, green for normal connection.
  const accent = isSuper ? '#C9A84C' : '#4ADE80';
  const accentLight = isSuper ? 'rgba(201,168,76,0.15)' : 'rgba(74,222,128,0.15)';

  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    iconScale.setValue(0);
    contentOpacity.setValue(0);
    contentSlide.setValue(30);

    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [visible, iconScale, contentOpacity, contentSlide, pulseAnim]);

  const firstName = matchName.split(' ')[0] ?? '?';
  const lastName = matchName.split(' ')[1] ?? '?';
  const skillsToShow = commonSkills.slice(0, 4);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <ConfettiBurst accent={accent} />
        {/* Handshake / rocket icon — professional, not romantic */}
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: accent,
              shadowColor: accent,
              transform: [{ scale: Animated.multiply(iconScale, pulseAnim) }],
            },
          ]}
        >
          <Text style={styles.bigEmoji}>{isSuper ? '🚀' : '🤝'}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.title}>
            {isSuper ? '¡Conexión prioritaria!' : '¡Conexión establecida!'}
          </Text>
          <Text style={styles.subtitle}>
            {isSuper
              ? `Has destacado tu interés en ${firstName} y la conexión es mutua.`
              : `${firstName} también está interesado/a en colaborar contigo.`}
          </Text>

          {/* Common skills (why you're compatible) */}
          {skillsToShow.length > 0 && (
            <View style={[styles.skillsCard, { backgroundColor: accentLight, borderColor: accent }]}>
              <Text style={[styles.skillsTitle, { color: accent }]}>Sinergia detectada</Text>
              <View style={styles.skillsRow}>
                {skillsToShow.map((s) => (
                  <View key={s} style={[styles.skillPill, { borderColor: accent }]}>
                    <Text style={[styles.skillPillText, { color: accent }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.avatarRow}>
            <View style={[styles.avatarWrapper, { borderColor: accent }]}>
              <Avatar firstName={myFirstName} lastName={myLastName} avatarUrl={myAvatarUrl} size={68} />
            </View>
            <View style={[styles.iconSmall, { backgroundColor: accentLight }]}>
              <Text style={styles.smallEmoji}>{isSuper ? '🚀' : '🤝'}</Text>
            </View>
            <View style={[styles.avatarWrapper, { borderColor: accent }]}>
              <Avatar
                firstName={firstName}
                lastName={lastName}
                avatarUrl={matchAvatar}
                size={68}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: accent }]}
            onPress={onChat}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Enviar primer mensaje"
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.background} />
            <Text style={styles.chatBtnText}>Enviar primer mensaje</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>Seguir explorando</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  bigEmoji: { fontSize: 48 },
  smallEmoji: { fontSize: 18 },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  skillsCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  skillsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  skillPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  skillPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderRadius: 38,
    padding: 2,
  },
  iconSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: spacing.sm,
  },
  chatBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
