import React, { useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../services/profile.service';
import { addPhoto, getMyPhotos } from '../services/api';
import { improveBioWithAi } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { GOAL_OPTIONS, LEVEL_OPTIONS, SKILL_OPTIONS } from '../utils/profileLabels';
import { EntrepreneurLevel, Goal } from '../types/models';

const TOTAL_STEPS = 7;
const MIN_PHOTOS = 1;

const INTEREST_AREAS = [
  'Tecnología', 'E-commerce', 'Servicios', 'SaaS', 'Marketing',
  'Educación', 'Salud', 'Fintech', 'Sostenibilidad', 'Entretenimiento',
];

type Photo = { id: string; url: string; sort_order: number };

export const CreateProfileScreen = () => {
  const { user, markProfileComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [entrepreneurLevel, setEntrepreneurLevel] = useState<EntrepreneurLevel | ''>('');
  const [goal, setGoal] = useState<Goal | ''>('');
  const [interestAreas, setInterestAreas] = useState<string[]>([]);
  const [skillsHave, setSkillsHave] = useState<string[]>([]);
  const [skillsWant, setSkillsWant] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [improvingBio, setImprovingBio] = useState(false);

  const handleImproveBio = async () => {
    if (bio.trim().length < 10) {
      Alert.alert('Bio demasiado corta', 'Escribe al menos 10 caracteres antes de pulirla con IA.');
      return;
    }
    try {
      setImprovingBio(true);
      const improved = await improveBioWithAi(bio);
      setBio(improved);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo mejorar la bio. Inténtalo de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setImprovingBio(false);
    }
  };

  const stepAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, stepAnim]);

  const stepStyle = {
    opacity: stepAnim,
    transform: [
      {
        translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
      },
    ],
  };

  const toggle = (item: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const loadPhotos = useCallback(async () => {
    try {
      const data = await getMyPhotos();
      setPhotos(data);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (step === 7) loadPhotos();
  }, [step, loadPhotos]);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0].base64) return;
    try {
      setUploadingPhoto(true);
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await addPhoto(dataUri);
      await loadPhotos();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      Alert.alert('Error', msg || 'No se pudo subir la foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return bio.length >= 20;
      case 2: return entrepreneurLevel !== '';
      case 3: return goal !== '';
      case 4: return interestAreas.length > 0;
      case 5: return skillsHave.length > 0;
      case 6: return skillsWant.length > 0;
      case 7: return photos.length >= MIN_PHOTOS;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return; // defensive: button should be disabled, but double-check
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    try {
      setSaving(true);
      await updateMyProfile({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        bio,
        interests: interestAreas.join(', '),
        location: '',
        entrepreneurLevel: entrepreneurLevel || null,
        goal: goal || null,
        offeredSkills: skillsHave.map((name) => ({ name })),
        learningSkills: skillsWant.map((name) => ({ name })),
      });
      await markProfileComplete();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe}>
        {/* Header con stepper visual */}
        <View style={styles.headerContainer}>
          <View style={styles.stepIndicators}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  i + 1 < step && styles.stepDotDone,
                  i + 1 === step && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>Paso {step} de {TOTAL_STEPS}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Paso 1: Bio */}
          {step === 1 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="person-circle" size={48} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>
              <Text style={styles.stepSubtitle}>
                Una buena descripción aumenta tus conexiones en un 60 %
              </Text>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={setBio}
                placeholder="Ej: Desarrollador apasionado por crear soluciones innovadoras. Busco co-fundador técnico para idea SaaS B2B..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={6}
              />
              <View style={styles.charRow}>
                <Text style={[styles.charCount, bio.length >= 20 && styles.charCountOk]}>
                  {bio.length} / 20 caracteres mínimos
                </Text>
                {bio.length >= 20 && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
              </View>
              <TouchableOpacity
                style={[styles.aiButton, (improvingBio || bio.trim().length < 10) && styles.aiButtonDisabled]}
                onPress={handleImproveBio}
                disabled={improvingBio || bio.trim().length < 10}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Mejorar bio con IA"
              >
                <Ionicons name="sparkles" size={18} color={improvingBio ? colors.textMuted : '#60A5FA'} />
                <Text style={[styles.aiButtonText, improvingBio && { color: colors.textMuted }]}>
                  {improvingBio ? 'Puliendo con IA...' : 'Mejorar con IA'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Paso 2: Nivel emprendedor */}
          {step === 2 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="trophy" size={48} color="#FBBF24" />
              </View>
              <Text style={styles.stepTitle}>¿Cómo te describirías?</Text>
              <Text style={styles.stepSubtitle}>
                Esto ayuda a otros a saber dónde estás en tu camino emprendedor
              </Text>
              {LEVEL_OPTIONS.map((option) => {
                const selected = entrepreneurLevel === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, selected && styles.optionCardActive]}
                    onPress={() => setEntrepreneurLevel(option.value)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.optionIcon, selected && styles.optionIconActive]}>
                      <Ionicons name={option.icon as any} size={22} color={selected ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleActive]}>
                        {option.title}
                      </Text>
                      <Text style={styles.optionDesc}>{option.description}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}

          {/* Paso 3: ¿Qué buscas? */}
          {step === 3 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="compass" size={48} color="#A855F7" />
              </View>
              <Text style={styles.stepTitle}>¿Qué buscas en CoFound?</Text>
              <Text style={styles.stepSubtitle}>
                Elige lo que mejor describe tu objetivo principal
              </Text>
              {GOAL_OPTIONS.map((option) => {
                const selected = goal === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, selected && styles.optionCardActive]}
                    onPress={() => setGoal(option.value)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.optionIcon, selected && styles.optionIconActive]}>
                      <Ionicons name={option.icon as any} size={22} color={selected ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleActive]}>
                        {option.title}
                      </Text>
                      <Text style={styles.optionDesc}>{option.description}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}

          {/* Paso 4: Áreas de interés */}
          {step === 4 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="layers" size={48} color="#60A5FA" />
              </View>
              <Text style={styles.stepTitle}>Áreas de interés</Text>
              <Text style={styles.stepSubtitle}>
                Selecciona los sectores que te interesan
              </Text>
              <View style={styles.pills}>
                {INTEREST_AREAS.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[styles.pill, interestAreas.includes(area) && styles.pillSelected]}
                    onPress={() => toggle(area, interestAreas, setInterestAreas)}
                  >
                    <Text style={[styles.pillText, interestAreas.includes(area) && styles.pillTextSelected]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Paso 5: Habilidades que tienes */}
          {step === 5 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="hammer" size={48} color="#4ADE80" />
              </View>
              <Text style={styles.stepTitle}>Habilidades que tienes</Text>
              <Text style={styles.stepSubtitle}>
                Lo que aportas — esto define con quién te emparejaremos
              </Text>
              <View style={styles.pills}>
                {SKILL_OPTIONS.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.pill, skillsHave.includes(skill) && styles.pillGreen]}
                    onPress={() => toggle(skill, skillsHave, setSkillsHave)}
                  >
                    <Text style={[styles.pillText, skillsHave.includes(skill) && styles.pillTextSelected]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Paso 6: Habilidades que quieres aprender */}
          {step === 6 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="school" size={48} color="#60A5FA" />
              </View>
              <Text style={styles.stepTitle}>Habilidades que buscas</Text>
              <Text style={styles.stepSubtitle}>
                Lo que esperas que tu cofounder aporte
              </Text>
              <View style={styles.pills}>
                {SKILL_OPTIONS.map((skill) => {
                  const isHave = skillsHave.includes(skill);
                  const isWant = skillsWant.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      disabled={isHave}
                      style={[
                        styles.pill,
                        isHave && styles.pillDisabled,
                        isWant && styles.pillBlue,
                      ]}
                      onPress={() => toggle(skill, skillsWant, setSkillsWant)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          isHave && styles.pillTextDisabled,
                          isWant && styles.pillTextSelected,
                        ]}
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Paso 7: Fotos (mínimo 3) */}
          {step === 7 && (
            <Animated.View style={[styles.step, stepStyle]}>
              <View style={styles.heroIcon}>
                <Ionicons name="images" size={48} color="#F472B6" />
              </View>
              <Text style={styles.stepTitle}>
                {MIN_PHOTOS === 1 ? 'Sube tu foto de perfil' : `Sube al menos ${MIN_PHOTOS} fotos`}
              </Text>
              <Text style={styles.stepSubtitle}>
                Los perfiles con foto reciben hasta 4× más solicitudes de conexión. Puedes añadir hasta 6.
              </Text>

              <View style={styles.photoGrid}>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const photo = photos[idx];
                  if (photo) {
                    return (
                      <View key={photo.id} style={styles.photoSlot}>
                        <Image source={{ uri: photo.url }} style={styles.photoImage} />
                        {idx === 0 && (
                          <View style={styles.photoMainBadge}>
                            <Text style={styles.photoMainText}>Principal</Text>
                          </View>
                        )}
                      </View>
                    );
                  }
                  const isRequired = idx < MIN_PHOTOS;
                  return (
                    <TouchableOpacity
                      key={`empty-${idx}`}
                      style={[styles.photoSlot, styles.photoSlotEmpty, isRequired && styles.photoSlotRequired]}
                      onPress={handlePickPhoto}
                      disabled={uploadingPhoto}
                    >
                      <Ionicons name="add" size={28} color={colors.textMuted} />
                      {isRequired && <Text style={styles.photoSlotLabel}>Obligatoria</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.photoStatusRow}>
                <Ionicons
                  name={photos.length >= MIN_PHOTOS ? 'checkmark-circle' : 'information-circle'}
                  size={18}
                  color={photos.length >= MIN_PHOTOS ? colors.success : colors.textMuted}
                />
                <Text style={[styles.photoStatusText, photos.length >= MIN_PHOTOS && { color: colors.success }]}>
                  {photos.length === 0
                    ? `Mínimo ${MIN_PHOTOS} foto`
                    : `${photos.length} ${photos.length === 1 ? 'foto subida' : 'fotos subidas'}`}
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.btnBack}
                onPress={() => setStep(step - 1)}
                accessibilityRole="button"
                accessibilityLabel="Paso anterior"
              >
                <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnNext, !canProceed() && styles.btnNextDisabled]}
              onPress={handleNext}
              disabled={!canProceed() || saving}
              accessibilityRole="button"
              accessibilityLabel={step === TOTAL_STEPS ? 'Finalizar' : 'Continuar'}
            >
              <Text style={[styles.btnNextText, !canProceed() && { color: colors.textMuted }]}>
                {saving ? 'Guardando...' : step === TOTAL_STEPS ? '¡Empezar!' : 'Continuar'}
              </Text>
              {!saving && <Ionicons name="arrow-forward" size={18} color={canProceed() ? colors.background : colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  stepDotDone: {
    backgroundColor: colors.primaryDark,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  progressPercent: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  step: {
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    color: colors.text,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    lineHeight: 22,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  charCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  charCountOk: { color: colors.success },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.5)',
    backgroundColor: 'rgba(96,165,250,0.1)',
    marginTop: spacing.sm,
  },
  aiButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  aiButtonText: { color: '#60A5FA', fontWeight: '700', fontSize: 14 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: 'rgba(74,222,128,0.18)',
  },
  optionContent: { flex: 1, gap: 2 },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  optionTitleActive: { color: colors.primary },
  optionDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pillGreen: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  pillBlue: {
    borderColor: '#60A5FA',
    backgroundColor: '#60A5FA',
  },
  pillDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  pillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pillTextSelected: { color: colors.background, fontWeight: '700' },
  pillTextDisabled: { color: colors.textMuted },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoSlot: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlotEmpty: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoSlotRequired: {
    borderColor: colors.primary,
  },
  photoSlotLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  photoImage: { width: '100%', height: '100%' },
  photoMainBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoMainText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  photoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  photoStatusText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnBack: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNext: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnNextDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnNextText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 15,
  },
});
