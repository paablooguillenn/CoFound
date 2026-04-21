import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const SKILL_OPTIONS = [
  'Marketing Digital', 'Programación', 'Diseño UX/UI', 'Ventas',
  'Finanzas', 'Desarrollo Web', 'Gestión de Proyectos', 'SEO/SEM',
  'Redes Sociales', 'Copywriting', 'Análisis de Datos', 'E-commerce',
  'Networking', 'Estrategia de Negocio', 'Desarrollo Móvil',
  'Blockchain', 'Inteligencia Artificial', 'Producción de Video',
];

const ENTREPRENEUR_LEVELS = [
  { value: 'beginner', label: 'Principiante — Tengo una idea' },
  { value: 'intermediate', label: 'Intermedio — Proyecto en desarrollo' },
  { value: 'advanced', label: 'Avanzado — Negocio establecido' },
  { value: 'expert', label: 'Experto — Múltiples proyectos exitosos' },
];

const INTEREST_AREAS = [
  'Tecnología', 'E-commerce', 'Servicios', 'SaaS', 'Marketing',
  'Educación', 'Salud', 'Fintech', 'Sostenibilidad', 'Entretenimiento',
];

export const CreateProfileScreen = () => {
  const { user, markProfileComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [entrepreneurLevel, setEntrepreneurLevel] = useState('');
  const [interestAreas, setInterestAreas] = useState<string[]>([]);
  const [skillsHave, setSkillsHave] = useState<string[]>([]);
  const [skillsWant, setSkillsWant] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (item: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return bio.length >= 20 && entrepreneurLevel !== '';
      case 2: return interestAreas.length > 0;
      case 3: return skillsHave.length > 0;
      case 4: return skillsWant.length > 0;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < 4) {
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

  const progress = (step / 4) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de progreso */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Paso {step} de 4</Text>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Paso 1: Bio + nivel */}
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>
            <Text style={styles.stepSubtitle}>
              Esta información ayudará a otros emprendedores a conocerte mejor
            </Text>

            <Text style={styles.fieldLabel}>Descripción personal</Text>
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={setBio}
              placeholder="Ej: Desarrollador apasionado por crear soluciones innovadoras..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
            />
            <Text style={styles.charCount}>{bio.length} caracteres (mínimo 20)</Text>

            <Text style={styles.fieldLabel}>Nivel emprendedor</Text>
            {ENTREPRENEUR_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.levelOption,
                  entrepreneurLevel === level.value && styles.levelOptionActive,
                ]}
                onPress={() => setEntrepreneurLevel(level.value)}
              >
                <Text
                  style={[
                    styles.levelText,
                    entrepreneurLevel === level.value && styles.levelTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Paso 2: Áreas de interés */}
        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Áreas de interés</Text>
            <Text style={styles.stepSubtitle}>
              Selecciona los sectores que te interesan (puedes elegir varios)
            </Text>
            <View style={styles.pills}>
              {INTEREST_AREAS.map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[styles.pill, interestAreas.includes(area) && styles.pillSelected]}
                  onPress={() => toggle(area, interestAreas, setInterestAreas)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      interestAreas.includes(area) && styles.pillTextSelected,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Paso 3: Habilidades que tienes */}
        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Habilidades que tienes</Text>
            <Text style={styles.stepSubtitle}>
              Selecciona las habilidades en las que eres competente
            </Text>
            <View style={styles.pills}>
              {SKILL_OPTIONS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[styles.pill, skillsHave.includes(skill) && styles.pillGreen]}
                  onPress={() => toggle(skill, skillsHave, setSkillsHave)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      skillsHave.includes(skill) && styles.pillTextSelected,
                    ]}
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Paso 4: Habilidades que quieres aprender */}
        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Habilidades que quieres aprender</Text>
            <Text style={styles.stepSubtitle}>
              Esto ayudará a encontrar personas que puedan enseñarte
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
          </View>
        )}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(step - 1)}>
              <Text style={styles.btnBackText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btnNext, !canProceed() && styles.btnNextDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || saving}
          >
            <Text style={[styles.btnNextText, !canProceed() && { color: colors.textMuted }]}>
              {saving ? 'Guardando...' : step === 4 ? 'Finalizar' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercent: {
    fontSize: 13,
    color: colors.textMuted,
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  step: {
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  levelOption: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  levelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  levelText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  levelTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
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
    backgroundColor: colors.successLight,
  },
  pillBlue: {
    borderColor: colors.info,
    backgroundColor: colors.infoLight,
  },
  pillDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: colors.background,
  },
  pillTextDisabled: {
    color: colors.textMuted,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    justifyContent: 'center',
  },
  btnBackText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  btnNext: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnNextDisabled: {
    backgroundColor: colors.border,
  },
  btnNextText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
