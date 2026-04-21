import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from './Avatar';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  visible: boolean;
  matchName: string;
  matchAvatar?: string | null;
  onChat: () => void;
  onClose: () => void;
};

export const MatchNotification = ({ visible, matchName, matchAvatar, onChat, onClose }: Props) => {
  const heartScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      heartScale.setValue(0);
      contentOpacity.setValue(0);
      contentSlide.setValue(30);

      Animated.sequence([
        Animated.spring(heartScale, {
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
            toValue: 1.12,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [visible, heartScale, contentOpacity, contentSlide, pulseAnim]);

  const firstName = matchName.split(' ')[0] ?? '?';
  const lastName = matchName.split(' ')[1] ?? '?';

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Heart icon */}
        <Animated.View
          style={[
            styles.heartCircle,
            {
              transform: [{ scale: Animated.multiply(heartScale, pulseAnim) }],
            },
          ]}
        >
          <Ionicons name="heart" size={44} color={colors.white} />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.title}>¡Es un Match!</Text>
          <Text style={styles.subtitle}>
            A {firstName} también le interesa colaborar contigo
          </Text>

          {/* Avatars */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Avatar firstName="Tú" lastName="" size={68} />
            </View>
            <View style={styles.heartSmall}>
              <Ionicons name="heart" size={18} color={colors.pink} />
            </View>
            <View style={styles.avatarWrapper}>
              <Avatar
                firstName={firstName}
                lastName={lastName}
                avatarUrl={matchAvatar}
                size={68}
              />
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.8}>
            <Ionicons name="chatbubble" size={20} color={colors.white} />
            <Text style={styles.chatBtnText}>Enviar mensaje</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>Seguir descubriendo</Text>
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
  heartCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
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
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderColor: colors.pink,
    borderRadius: 38,
    padding: 2,
  },
  heartSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: colors.pink,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: spacing.sm,
  },
  chatBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
