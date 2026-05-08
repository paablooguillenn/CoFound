import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  visible: boolean;
  score: number;
  /** Skills you offer that the other person is looking for. */
  iOfferTheySeek: string[];
  /** Skills the other person offers that you are looking for. */
  theyOfferISeek: string[];
  onClose: () => void;
};

/**
 * Reveals the maths behind the "X% compatible · N sinergias" badge: shows
 * which exact skills coincide in each direction. Builds trust in the
 * algorithm and turns an opaque number into a story.
 */
export const CompatibilityDetailModal = ({
  visible,
  score,
  iOfferTheySeek,
  theyOfferISeek,
  onClose,
}: Props) => {
  const totalSynergies = iOfferTheySeek.length + theyOfferISeek.length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.cardWrap} onPress={() => {}}>
          <View style={styles.card}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{score}%</Text>
              <Text style={styles.scoreLabel}>compatible</Text>
            </View>

            <Text style={styles.title}>Sinergia detectada</Text>
            <Text style={styles.subtitle}>
              {totalSynergies === 0
                ? 'No hay coincidencias directas, pero el perfil puede aportarte otras cosas.'
                : `${totalSynergies} ${totalSynergies === 1 ? 'coincidencia' : 'coincidencias'} entre lo que cada uno ofrece y busca.`}
            </Text>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {iOfferTheySeek.length > 0 && (
                <View style={styles.block}>
                  <View style={styles.blockHeader}>
                    <Ionicons name="arrow-forward-circle" size={18} color="#4ADE80" />
                    <Text style={styles.blockTitle}>Tú ofreces, ellos buscan</Text>
                  </View>
                  <View style={styles.pillRow}>
                    {iOfferTheySeek.map((s) => (
                      <View key={`o-${s}`} style={[styles.pill, styles.pillOffer]}>
                        <Text style={styles.pillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {theyOfferISeek.length > 0 && (
                <View style={styles.block}>
                  <View style={styles.blockHeader}>
                    <Ionicons name="arrow-back-circle" size={18} color="#60A5FA" />
                    <Text style={styles.blockTitle}>Ellos ofrecen, tú buscas</Text>
                  </View>
                  <View style={styles.pillRow}>
                    {theyOfferISeek.map((s) => (
                      <View key={`l-${s}`} style={[styles.pill, styles.pillLearn]}>
                        <Text style={styles.pillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardWrap: { width: '100%' },
  card: {
    backgroundColor: '#141414',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    padding: spacing.lg,
    maxHeight: '80%',
  },
  scoreCircle: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(74,222,128,0.12)',
  },
  scoreText: {
    color: '#4ADE80',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  scroll: { flexGrow: 0, marginBottom: spacing.md },
  block: { marginBottom: spacing.md },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillOffer: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.18)',
  },
  pillLearn: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96,165,250,0.18)',
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#0A0A0A',
    fontWeight: '900',
    fontSize: 15,
  },
});
