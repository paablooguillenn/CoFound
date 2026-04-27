import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '../components/Avatar';
import { MatchNotification } from '../components/MatchNotification';
import { useAuth } from '../context/AuthContext';
import { getDiscoveryProfiles, getLocations } from '../services/discovery.service';
import { likeProfile, passProfile, rewindLastSwipe, superLikeProfile } from '../services/matches.service';
import { DiscoveryUser } from '../types/models';
import { AppStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 300;

export const ExploreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const [profiles, setProfiles] = useState<DiscoveryUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  // Refs so PanResponder always reads fresh values
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSuperPremiumModal, setShowSuperPremiumModal] = useState(false);
  const [showSuperLimitModal, setShowSuperLimitModal] = useState(false);

  const [matchModal, setMatchModal] = useState<{
    visible: boolean;
    name: string;
    matchId: string;
    avatarUrl: string | null;
    isSuper: boolean;
  }>({
    visible: false,
    name: '',
    matchId: '',
    avatarUrl: null,
    isSuper: false,
  });

  // Location filter (premium only)
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const [showFilter, setShowFilter] = useState(false);

  // Swipe animation values
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.85)).current;

  // Entrance animation for new card
  const cardEntrance = useRef(new Animated.Value(0)).current;

  const animateEntrance = useCallback(() => {
    cardEntrance.setValue(0);
    Animated.spring(cardEntrance, {
      toValue: 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [cardEntrance]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDiscoveryProfiles(selectedLocation);
      setProfiles(data);
      setCurrentIndex(0);
      position.setValue({ x: 0, y: 0 });
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los perfiles.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, position]);

  // Load locations for filter
  useEffect(() => {
    if (isPremium) {
      getLocations().then(setLocations).catch(() => {});
    }
  }, [isPremium]);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles]),
  );

  useEffect(() => {
    animateEntrance();
  }, [currentIndex, animateEntrance]);

  const advanceToNext = () => {
    setCurrentIndex((i) => i + 1);
    position.setValue({ x: 0, y: 0 });
    nextCardScale.setValue(0.95);
    nextCardOpacity.setValue(0.85);
  };

  // Fire-and-forget like in the background; advance the card immediately
  const handleLikeInBackground = (profile: DiscoveryUser) => {
    setLiking(true);
    likeProfile(profile.id)
      .then((result) => {
        if (result.isMatch && result.matchId) {
          setMatchModal({
            visible: true,
            name: `${profile.firstName} ${profile.lastName}`,
            matchId: result.matchId,
            avatarUrl: profile.avatarUrl ?? null,
            isSuper: false,
          });
        }
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 429) {
          setShowLimitModal(true);
        }
      })
      .finally(() => setLiking(false));
  };

  const handleRewind = async () => {
    if (!isPremium) {
      setShowSuperPremiumModal(true);
      return;
    }
    try {
      await rewindLastSwipe();
      await loadProfiles();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        Alert.alert('Sin swipes', 'No hay nada que deshacer.');
      } else if (status === 403) {
        setShowSuperPremiumModal(true);
      } else {
        Alert.alert('Error', 'No se pudo deshacer el último swipe.');
      }
    }
  };

  const handleSuperLike = () => {
    const profile = profilesRef.current[currentIndexRef.current];
    if (!profile || liking) return;

    if (!isPremium) {
      setShowSuperPremiumModal(true);
      return;
    }

    // Advance the card immediately with a rightward swipe animation
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: -200 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      advanceToNext();
    });

    setLiking(true);
    superLikeProfile(profile.id)
      .then((result) => {
        if (result.isMatch && result.matchId) {
          setMatchModal({
            visible: true,
            name: `${profile.firstName} ${profile.lastName}`,
            matchId: result.matchId,
            avatarUrl: profile.avatarUrl ?? null,
            isSuper: true,
          });
        }
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 403) setShowSuperPremiumModal(true);
        else if (status === 429) setShowSuperLimitModal(true);
      })
      .finally(() => setLiking(false));
  };

  // Persist dislikes so profiles don't reappear after returning to the screen
  const handlePassInBackground = (profile: DiscoveryUser) => {
    passProfile(profile.id).catch((err: any) => {
      const status = err?.response?.status;
      if (status === 429) setShowLimitModal(true);
    });
  };

  const doSwipeRef = useRef((_direction: 'left' | 'right') => {});
  doSwipeRef.current = (direction: 'left' | 'right') => {
    const profile = profilesRef.current[currentIndexRef.current];
    if (!profile) return;

    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(nextCardScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      advanceToNext();
      if (direction === 'right') {
        handleLikeInBackground(profile);
      } else {
        handlePassInBackground(profile);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });

        // Scale up next card as user swipes
        const progress = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
        nextCardScale.setValue(0.95 + progress * 0.05);
        nextCardOpacity.setValue(0.85 + progress * 0.15);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          doSwipeRef.current('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          doSwipeRef.current('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
          nextCardScale.setValue(0.95);
          nextCardOpacity.setValue(0.85);
        }
      },
    }),
  ).current;

  // Interpolations for current card
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [
      ...position.getTranslateTransform(),
      { rotate },
    ],
  };

  const entranceScale = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const entranceOpacity = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const current = profiles[currentIndex];
  const next = profiles[currentIndex + 1];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>CoFound</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <Animated.View style={styles.loadingDots}>
            <LoadingDots />
          </Animated.View>
          <Text style={styles.loadingText}>Buscando perfiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>CoFound</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sparkles" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {isPremium ? 'No quedan perfiles nuevos' : 'No hay más perfiles por hoy'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isPremium
              ? 'Ya has visto todos los perfiles disponibles. ¡Vuelve pronto!'
              : 'Vuelve mañana para descubrir más emprendedores'}
          </Text>
          {!isPremium && (
            <View style={styles.premiumBanner}>
              <Ionicons name="ribbon" size={28} color={colors.premiumStart} />
              <Text style={styles.premiumTitle}>Actualiza a Premium</Text>
              <Text style={styles.premiumText}>
                Descubre perfiles ilimitados todos los días
              </Text>
              <TouchableOpacity style={styles.premiumBtn} onPress={() => navigation.navigate('Pricing')}>
                <Text style={styles.premiumBtnText}>Ver planes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isPremium && (
              <TouchableOpacity
                style={[styles.filterBtn, selectedLocation && styles.filterBtnActive]}
                onPress={() => setShowFilter(!showFilter)}
              >
                <Ionicons name="options-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle}>CoFound</Text>
          <View style={styles.headerRight}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {profiles.length}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Cards Stack */}
      <View style={styles.cardStack}>
        {/* Next card (behind) */}
        {next && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              {
                transform: [{ scale: nextCardScale }],
                opacity: nextCardOpacity,
              },
            ]}
          >
            <CardContent profile={next} />
          </Animated.View>
        )}

        {/* Current card (on top, draggable) */}
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              transform: [
                ...position.getTranslateTransform(),
                { rotate },
                { scale: entranceScale },
              ],
              opacity: entranceOpacity,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <CardContent profile={current} />

          {/* LIKE stamp overlay */}
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={styles.stampLikeText}>LIKE</Text>
          </Animated.View>

          {/* NOPE stamp overlay */}
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={styles.stampNopeText}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Location Filter Dropdown */}
      {showFilter && isPremium && (
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterOption, !selectedLocation && styles.filterOptionActive]}
            onPress={() => { setSelectedLocation(undefined); setShowFilter(false); }}
          >
            <Text style={styles.filterOptionText}>Todas las ciudades</Text>
          </TouchableOpacity>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.filterOption, selectedLocation === loc && styles.filterOptionActive]}
              onPress={() => { setSelectedLocation(loc); setShowFilter(false); }}
            >
              <Text style={styles.filterOptionText}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnRewind}
          onPress={handleRewind}
          disabled={liking}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={22} color="#C9A84C" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPass}
          onPress={() => doSwipeRef.current('left')}
          disabled={liking}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSuperLike}
          onPress={handleSuperLike}
          disabled={liking}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={24} color="#60A5FA" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnLike}
          onPress={() => doSwipeRef.current('right')}
          disabled={liking}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={32} color="#4ADE80" />
        </TouchableOpacity>
      </View>

      {/* Like Limit Modal */}
      <Modal visible={showLimitModal} transparent animationType="fade" onRequestClose={() => setShowLimitModal(false)}>
        <View style={styles.limitOverlay}>
          <View style={styles.limitCard}>
            <View style={styles.limitIconCircle}>
              <Ionicons name="heart" size={36} color={colors.pink} />
            </View>
            <Text style={styles.limitTitle}>Has llegado al límite</Text>
            <Text style={styles.limitText}>
              Has usado tus 5 swipes diarios. Desbloquea swipes ilimitados con CoFound Premium.
            </Text>
            <TouchableOpacity
              style={styles.limitPremiumBtn}
              onPress={() => { setShowLimitModal(false); navigation.navigate('Pricing'); }}
            >
              <Ionicons name="diamond" size={18} color={colors.background} />
              <Text style={styles.limitPremiumBtnText}>Ver planes Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLimitModal(false)}>
              <Text style={styles.limitCloseText}>Volver mañana</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MatchNotification
        visible={matchModal.visible}
        matchName={matchModal.name}
        matchAvatar={matchModal.avatarUrl}
        isSuper={matchModal.isSuper}
        onChat={() => {
          setMatchModal((m) => ({ ...m, visible: false }));
          navigation.navigate('Chat', { matchId: matchModal.matchId, matchName: matchModal.name, matchAvatar: matchModal.avatarUrl });
        }}
        onClose={() => {
          setMatchModal((m) => ({ ...m, visible: false }));
        }}
      />

      {/* Super-like Premium gate */}
      <Modal visible={showSuperPremiumModal} transparent animationType="fade" onRequestClose={() => setShowSuperPremiumModal(false)}>
        <View style={styles.limitOverlay}>
          <View style={styles.limitCard}>
            <View style={[styles.limitIconCircle, { backgroundColor: 'rgba(96,165,250,0.16)' }]}>
              <Ionicons name="star" size={36} color="#60A5FA" />
            </View>
            <Text style={styles.limitTitle}>Super-likes son Premium</Text>
            <Text style={styles.limitText}>
              Destaca tu interés entre la multitud. Los super-likes te ponen al frente del perfil que elijas.
            </Text>
            <TouchableOpacity
              style={styles.limitPremiumBtn}
              onPress={() => { setShowSuperPremiumModal(false); navigation.navigate('Pricing'); }}
            >
              <Ionicons name="diamond" size={18} color={colors.background} />
              <Text style={styles.limitPremiumBtnText}>Ver planes Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSuperPremiumModal(false)}>
              <Text style={styles.limitCloseText}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Super-like daily limit */}
      <Modal visible={showSuperLimitModal} transparent animationType="fade" onRequestClose={() => setShowSuperLimitModal(false)}>
        <View style={styles.limitOverlay}>
          <View style={styles.limitCard}>
            <View style={[styles.limitIconCircle, { backgroundColor: 'rgba(96,165,250,0.16)' }]}>
              <Ionicons name="star" size={36} color="#60A5FA" />
            </View>
            <Text style={styles.limitTitle}>Sin super-likes por hoy</Text>
            <Text style={styles.limitText}>
              Ya has usado tus 5 super-likes diarios. Vuelve mañana para seguir destacando entre los perfiles que más te interesan.
            </Text>
            <TouchableOpacity onPress={() => setShowSuperLimitModal(false)} style={styles.limitPremiumBtn}>
              <Text style={styles.limitPremiumBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Card Content Component ───────────────────────────────────────────────────

const CardContent = ({ profile }: { profile: DiscoveryUser }) => {
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset photo index and expanded state when profile changes
  useEffect(() => {
    setPhotoIndex(0);
    setExpanded(false);
  }, [profile.id]);

  const images = profile.photos?.length
    ? profile.photos.map((p) => p.url)
    : profile.avatarUrl
      ? [profile.avatarUrl]
      : [];

  const handleTapPhoto = (tapX: number) => {
    if (images.length <= 1) return;
    if (tapX < SCREEN_WIDTH * 0.35) {
      // Tap left side → previous photo
      setPhotoIndex((i) => Math.max(0, i - 1));
    } else if (tapX > SCREEN_WIDTH * 0.65) {
      // Tap right side → next photo
      setPhotoIndex((i) => Math.min(images.length - 1, i + 1));
    }
  };

  return (
    <View style={styles.cardInner}>
      {images.length > 0 ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => handleTapPhoto(e.nativeEvent.locationX)}
          style={StyleSheet.absoluteFillObject}
        >
          <Image
            source={{ uri: images[photoIndex] }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <LinearGradient colors={['#1E1E2E', '#0A0A0A']} style={StyleSheet.absoluteFillObject}>
          <View style={styles.fallbackAvatar}>
            <Avatar firstName={profile.firstName} lastName={profile.lastName} size={120} />
          </View>
        </LinearGradient>
      )}

      {/* Photo indicator dots */}
      {images.length > 1 && (
        <View style={styles.dotsBar} pointerEvents="none">
          {images.map((_, i) => (
            <View key={i} style={[styles.dotSegment, i === photoIndex && styles.dotSegmentActive]} />
          ))}
        </View>
      )}

      {/* Super-like received banner */}
      {profile.superLikedByThem && (
        <View style={styles.superLikeBanner} pointerEvents="none">
          <Ionicons name="star" size={14} color="#60A5FA" />
          <Text style={styles.superLikeBannerText}>Te ha dado super-like</Text>
        </View>
      )}

      {/* Bottom gradient with profile info */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomOverlay}
        pointerEvents="box-none"
      >
        {/* Compatibility badge */}
        {profile.compatibilityScore > 0 && (
          <View style={styles.compatBadge}>
            <Ionicons name="sparkles" size={12} color="#4ADE80" />
            <Text style={styles.compatText}>{profile.compatibilityScore}% compatible</Text>
          </View>
        )}

        <Text style={styles.fullName}>
          {profile.firstName} {profile.lastName}
        </Text>

        {profile.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
          <Text style={styles.bioPreview} numberOfLines={expanded ? 10 : 2}>
            {profile.bio || 'Perfil en construcción.'}
          </Text>
          <Text style={styles.readMore}>
            {expanded ? 'Leer menos' : 'Leer más'}
          </Text>
        </TouchableOpacity>

        {/* Skills */}
        {expanded && (
          <View style={styles.expandedSkills}>
            {profile.offeredSkills.length > 0 && (
              <View style={styles.skillGroup}>
                <Text style={styles.skillLabel}>Ofrece</Text>
                <View style={styles.skillRow}>
                  {profile.offeredSkills.map((s) => (
                    <View key={s.name} style={styles.skillChipOffer}>
                      <Text style={styles.skillChipOfferText}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {profile.learningSkills.length > 0 && (
              <View style={styles.skillGroup}>
                <Text style={styles.skillLabel}>Busca</Text>
                <View style={styles.skillRow}>
                  {profile.learningSkills.map((s) => (
                    <View key={s.name} style={styles.skillChipLearn}>
                      <Text style={styles.skillChipLearnText}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// ─── Loading Dots Animation ───────────────────────────────────────────────────

const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      );
    animate(dot1, 0).start();
    animate(dot2, 150).start();
    animate(dot3, 300).start();
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ flexDirection: 'row' }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeft: { width: 44, alignItems: 'flex-start' },
  headerRight: { width: 44, alignItems: 'flex-end' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  counterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.pink,
  },

  // Card Stack
  cardStack: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nextCard: {
    zIndex: -1,
  },
  cardInner: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fallbackAvatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Photo indicator dots
  dotsBar: {
    position: 'absolute',
    top: 54,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: 4,
    zIndex: 11,
  },
  dotSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotSegmentActive: {
    backgroundColor: colors.white,
  },

  // Super-like received banner
  superLikeBanner: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 12,
  },
  superLikeBannerText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },

  // Stamp overlays
  stamp: {
    position: 'absolute',
    top: 120,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 4,
    borderRadius: 12,
    transform: [{ rotate: '-20deg' }],
  },
  stampLike: {
    left: 30,
    borderColor: '#4ADE80',
  },
  stampLikeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4ADE80',
    letterSpacing: 2,
  },
  stampNope: {
    right: 30,
    borderColor: '#FF6B6B',
    transform: [{ rotate: '20deg' }],
  },
  stampNopeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF6B6B',
    letterSpacing: 2,
  },

  // Bottom overlay with profile info
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 160,
  },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  compatText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  fullName: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  bioPreview: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
    marginTop: 8,
  },
  readMore: {
    color: colors.pink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  expandedSkills: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  skillGroup: { gap: 6 },
  skillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChipOffer: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  skillChipOfferText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  skillChipLearn: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  skillChipLearnText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '600',
  },

  // Filter
  filterDropdown: {
    position: 'absolute',
    top: 100,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    zIndex: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryFaint,
  },
  filterOptionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // Action Buttons
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  btnRewind: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  btnPass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  btnSuperLike: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  btnLike: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },

  // Loading & Empty states
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingDots: {
    marginBottom: spacing.sm,
  },
  loadingText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  premiumBanner: {
    width: '100%',
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  premiumTitle: { color: colors.premiumStart, fontWeight: '800', fontSize: 16 },
  premiumText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  premiumBtn: {
    backgroundColor: colors.premiumStart,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  premiumBtnText: { color: colors.black, fontWeight: '700', fontSize: 14 },

  // Like limit modal
  limitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 340,
  },
  limitIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  limitText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  limitPremiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.premiumStart,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  limitPremiumBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },
  limitCloseText: { fontSize: 14, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
});
