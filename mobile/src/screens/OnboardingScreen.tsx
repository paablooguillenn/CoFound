import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  key: string;
  emoji: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    key: 'compat',
    emoji: '🧩',
    iconName: 'sparkles',
    iconColor: '#4ADE80',
    title: 'Compatibilidad real, no por foto',
    description:
      'Nuestro algoritmo cruza las habilidades que ofreces con las que buscas tus posibles cofounders y muestra el % de sinergia.',
  },
  {
    key: 'conexion',
    emoji: '🤝',
    iconName: 'people',
    iconColor: '#C9A84C',
    title: 'Conexiones, no matches',
    description:
      'CoFound es una herramienta profesional. Cuando alguien muestra interés y tú correspondes, se establece una conexión y se abre el chat.',
  },
  {
    key: 'ia',
    emoji: '✨',
    iconName: 'flash',
    iconColor: '#60A5FA',
    title: 'Asistente con IA en tu chat',
    description:
      'Cada mensaje se enriquece con sugerencias de IA generativa para que las conversaciones fluyan desde el primer momento.',
  },
];

type Props = {
  onFinish: () => void;
};

/**
 * Three-slide onboarding shown once after register, before the wizard.
 * Persisted via the `seenOnboarding` flag in AsyncStorage so it never
 * re-appears for the same account on the same device.
 */
export const OnboardingScreen = ({ onFinish }: Props) => {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setIndex(viewableItems[0].index);
    }
  }).current;

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      onFinish();
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <View style={[styles.iconCircle, { backgroundColor: `${item.iconColor}22` }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.skipRow}>
          <TouchableOpacity
            onPress={onFinish}
            accessibilityRole="button"
            accessibilityLabel="Saltar onboarding"
          >
            <Text style={styles.skip}>Saltar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        />

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={index === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}
        >
          <Text style={styles.ctaText}>{index === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, paddingBottom: spacing.lg },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  skip: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emoji: { fontSize: 72 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: '#4ADE80',
    width: 24,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: spacing.lg,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaText: { color: colors.background, fontWeight: '800', fontSize: 15 },
});
