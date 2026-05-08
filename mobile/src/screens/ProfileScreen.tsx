import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProfileBadges } from '../components/ProfileBadges';
import { SkillBadge } from '../components/SkillBadge';
import { SocialLinks, stripSocialHandle } from '../components/SocialLinks';
import { useAuth } from '../context/AuthContext';
import { activateBoostRequest, getBoostStatusRequest, getCompleteness, getMyProfile, updateMyProfile, requestEmailVerificationCode, BoostStatus, Completeness } from '../services/profile.service';
import { getMyPhotos, addPhoto, deletePhoto } from '../services/api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { EntrepreneurLevel, Goal, ProjectStage, Skill } from '../types/models';
import { AppStackParamList } from '../types/navigation';
import {
  LEVEL_OPTIONS,
  GOAL_OPTIONS,
  PROJECT_STAGE_OPTIONS,
  SKILL_OPTIONS,
  INTEREST_AREAS,
  OTHER_OPTION,
  parseCustomList,
} from '../utils/profileLabels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const toggleArray = (item: string, list: string[]): string[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<{ visible: boolean; index: number }>({ visible: false, index: 0 });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [interestPills, setInterestPills] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState('');
  const [location, setLocation] = useState('');
  const [offeredSkills, setOfferedSkills] = useState<string[]>([]);
  const [customOfferedSkills, setCustomOfferedSkills] = useState('');
  const [learningSkills, setLearningSkills] = useState<string[]>([]);
  const [customLearningSkills, setCustomLearningSkills] = useState('');
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [entrepreneurLevel, setEntrepreneurLevel] = useState<EntrepreneurLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [projectStage, setProjectStage] = useState<ProjectStage | null>(null);
  const [isMentor, setIsMentor] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Datos cargados (para el modo vista)
  const [profileData, setProfileData] = useState<{
    bio: string;
    interests: string;
    location: string;
    offeredSkills: Skill[];
    learningSkills: Skill[];
  } | null>(null);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [boost, setBoost] = useState<BoostStatus | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setBio(profile.bio);

      // Split saved interests into predefined pills vs free-form "Otras"
      const interestList = parseCustomList(profile.interests || '');
      const knownInterests = interestList.filter((i) => INTEREST_AREAS.includes(i));
      const unknownInterests = interestList.filter((i) => !INTEREST_AREAS.includes(i));
      setInterestPills(unknownInterests.length > 0 ? [...knownInterests, OTHER_OPTION] : knownInterests);
      setCustomInterests(unknownInterests.join(', '));

      setLocation(profile.location);

      // Split skills the same way: predefined options stay as pills,
      // custom skills typed by the user go into the "Otras" text field.
      const offered = profile.offeredSkills.map((s) => s.name);
      const knownOffered = offered.filter((s) => SKILL_OPTIONS.includes(s));
      const unknownOffered = offered.filter((s) => !SKILL_OPTIONS.includes(s));
      setOfferedSkills(unknownOffered.length > 0 ? [...knownOffered, OTHER_OPTION] : knownOffered);
      setCustomOfferedSkills(unknownOffered.join(', '));

      const learning = profile.learningSkills.map((s) => s.name);
      const knownLearning = learning.filter((s) => SKILL_OPTIONS.includes(s));
      const unknownLearning = learning.filter((s) => !SKILL_OPTIONS.includes(s));
      setLearningSkills(unknownLearning.length > 0 ? [...knownLearning, OTHER_OPTION] : knownLearning);
      setCustomLearningSkills(unknownLearning.join(', '));
      setAvatarUrl(profile.avatarUrl ?? null);
      setLinkedinUsername(profile.linkedinUsername ?? '');
      setInstagramUsername(profile.instagramUsername ?? '');
      setEntrepreneurLevel(profile.entrepreneurLevel ?? null);
      setGoal(profile.goal ?? null);
      setProjectStage((profile as any).projectStage ?? null);
      setIsMentor((profile as any).isMentor ?? false);
      setEmailVerified((profile as any).emailVerified ?? true);
      setProfileData({
        bio: profile.bio,
        interests: profile.interests,
        location: profile.location,
        offeredSkills: profile.offeredSkills,
        learningSkills: profile.learningSkills,
      });
      // Fire-and-forget load completeness + boost status
      getCompleteness().then(setCompleteness).catch(() => {});
      getBoostStatusRequest().then(setBoost).catch(() => {});
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    }
  }, []);

  const handleActivateBoost = async () => {
    if (!boost?.isPremium) {
      navigation.navigate('Pricing');
      return;
    }
    try {
      const result = await activateBoostRequest();
      Alert.alert(
        '🚀 Boost activado',
        `Tu perfil aparecerá al principio durante ${result.durationMin} minutos.`,
      );
      const fresh = await getBoostStatusRequest();
      setBoost(fresh);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo activar el boost.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await requestEmailVerificationCode();
      Alert.alert('Código enviado', 'Revisa tu email para verificar tu cuenta.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo reenviar el código.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      // Combine selected pills (minus the "Otras" marker) with the custom
      // values typed in each "Otras" input.
      const buildList = (selected: string[], custom: string): { name: string }[] => {
        const concrete = selected.filter((s) => s !== OTHER_OPTION);
        const customs = parseCustomList(custom);
        return [...concrete, ...customs].map((name) => ({ name }));
      };
      const interestsString = [
        ...interestPills.filter((s) => s !== OTHER_OPTION),
        ...parseCustomList(customInterests),
      ].join(', ');
      const profile = await updateMyProfile({
        firstName,
        lastName,
        bio,
        interests: interestsString,
        location,
        entrepreneurLevel,
        goal,
        projectStage,
        isMentor,
        linkedinUsername: linkedinUsername.trim() ? stripSocialHandle(linkedinUsername) : null,
        instagramUsername: instagramUsername.trim() ? stripSocialHandle(instagramUsername) : null,
        offeredSkills: buildList(offeredSkills, customOfferedSkills),
        learningSkills: buildList(learningSkills, customLearningSkills),
      });
      if (user) {
        updateUser({ ...user, firstName: profile.firstName, lastName: profile.lastName });
      }
      await loadProfile();
      setEditing(false);
      Alert.alert('Perfil actualizado', 'Tus datos se han guardado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ id: string; url: string; sort_order: number }[]>([]);

  const loadPhotos = useCallback(async () => {
    try {
      const data = await getMyPhotos();
      setPhotos(data);
    } catch {}
  }, []);

  // Load photos on focus
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos]),
  );

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.uri) return;

    // Compress + resize before upload to reduce payload from ~1.5 MB to ~250 KB.
    // The backend stores photos as base64 in Postgres so every byte saved is a
    // direct hit on DB size and discovery feed payloads.
    const compressed = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );

    if (!compressed.base64) return;

    try {
      const dataUri = `data:image/jpeg;base64,${compressed.base64}`;
      await addPhoto(dataUri);
      await loadPhotos();
      // Update avatar if it's the first photo
      const updatedPhotos = await getMyPhotos();
      if (updatedPhotos.length > 0) {
        setAvatarUrl(updatedPhotos[0].url);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      Alert.alert('Error', msg || 'No se pudo subir la foto.');
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Eliminar foto', '¿Seguro que quieres eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(photoId);
            await loadPhotos();
            const updatedPhotos = await getMyPhotos();
            setAvatarUrl(updatedPhotos[0]?.url ?? null);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la foto.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons
            name={editing ? 'close-outline' : 'create-outline'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Email verification banner */}
        {!emailVerified && (
          <TouchableOpacity
            style={styles.verifyBanner}
            onPress={() => navigation.navigate('VerifyEmail')}
            activeOpacity={0.8}
          >
            <View style={styles.verifyIcon}>
              <Ionicons name="mail-unread" size={20} color="#C9A84C" />
            </View>
            <View style={styles.verifyContent}>
              <Text style={styles.verifyTitle}>Verifica tu email</Text>
              <Text style={styles.verifyText}>
                Hemos enviado un código a {user?.email}. Tócame para introducirlo.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>
        )}

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            firstName={user?.firstName ?? '?'}
            lastName={user?.lastName ?? '?'}
            avatarUrl={avatarUrl}
            size={88}
          />
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="ribbon" size={16} color={colors.premiumStart} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.premiumBtn} onPress={() => navigation.navigate('Pricing')}>
              <Ionicons name="ribbon-outline" size={16} color={colors.premiumStart} />
              <Text style={styles.premiumBtnText}>Actualizar a Premium</Text>
            </TouchableOpacity>
          )}

          {(entrepreneurLevel || goal) && (
            <View style={{ marginTop: spacing.sm }}>
              <ProfileBadges level={entrepreneurLevel} goal={goal} />
            </View>
          )}

          {(linkedinUsername || instagramUsername) && !editing && (
            <View style={{ marginTop: spacing.sm }}>
              <SocialLinks linkedinUsername={linkedinUsername} instagramUsername={instagramUsername} />
            </View>
          )}
        </View>

        {/* Completeness */}
        {completeness && completeness.percent < 100 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Perfil completado</Text>
              <Text style={styles.cardSubtitle}>{completeness.percent}%</Text>
            </View>
            <View style={styles.completenessBarBg}>
              <View
                style={[
                  styles.completenessBarFill,
                  {
                    width: `${completeness.percent}%`,
                    backgroundColor:
                      completeness.percent >= 80
                        ? colors.success
                        : completeness.percent >= 50
                        ? '#f59e0b'
                        : colors.danger,
                  },
                ]}
              />
            </View>
            {completeness.missing.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.completenessHint}>
                  Te falta:
                </Text>
                {completeness.missing.map((field) => (
                  <Text key={field} style={styles.completenessItem}>• {field}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* My Photos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mis fotos</Text>
            <Text style={styles.cardSubtitle}>{photos.length}/6</Text>
          </View>
          <View style={styles.photosGrid}>
            {photos.map((photo, idx) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => !editing && setPhotoViewer({ visible: true, index: idx })}
                activeOpacity={editing ? 1 : 0.85}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                {editing && (
                  <TouchableOpacity
                    style={styles.photoDeleteBtn}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </TouchableOpacity>
                )}
                {photo.sort_order === 0 && (
                  <View style={styles.photoMainBadge}>
                    <Text style={styles.photoMainText}>Principal</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.photoAddBtn} onPress={handlePickPhoto}>
                <Ionicons name="add" size={32} color={colors.textMuted} />
                <Text style={styles.photoAddText}>Añadir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Modo edición */}
        {editing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Editar perfil</Text>
            <InputField label="Nombre" value={firstName} onChangeText={setFirstName} />
            <InputField label="Apellidos" value={lastName} onChangeText={setLastName} />
            <InputField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              style={styles.textArea}
            />
            <Text style={styles.editSectionLabel}>Áreas de interés</Text>
            <View style={styles.skillPills}>
              {INTEREST_AREAS.map((area) => {
                const selected = interestPills.includes(area);
                return (
                  <TouchableOpacity
                    key={`int-${area}`}
                    style={[styles.skillPill, selected && styles.skillPillInterest]}
                    onPress={() => setInterestPills((curr) => toggleArray(area, curr))}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.skillPillText, selected && styles.skillPillTextSelected]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {interestPills.includes(OTHER_OPTION) && (
              <TextInput
                style={styles.customInput}
                value={customInterests}
                onChangeText={setCustomInterests}
                placeholder="Escribe tus intereses (separados por coma)"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <InputField
              label="Ubicación"
              value={location}
              onChangeText={setLocation}
              placeholder="Madrid, España"
            />
            <Text style={styles.editSectionLabel}>Habilidades que ofreces</Text>
            <Text style={styles.editHint}>
              Selecciona en qué eres bueno/a — define con quién encajas como cofounder.
            </Text>
            <View style={styles.skillPills}>
              {SKILL_OPTIONS.map((skill) => {
                const selected = offeredSkills.includes(skill);
                return (
                  <TouchableOpacity
                    key={`offer-${skill}`}
                    style={[styles.skillPill, selected && styles.skillPillOffer]}
                    onPress={() => setOfferedSkills((curr) => toggleArray(skill, curr))}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.skillPillText, selected && styles.skillPillTextSelected]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {offeredSkills.includes(OTHER_OPTION) && (
              <TextInput
                style={styles.customInput}
                value={customOfferedSkills}
                onChangeText={setCustomOfferedSkills}
                placeholder="Escribe tus habilidades (separadas por coma)"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <Text style={styles.editSectionLabel}>Habilidades que buscas</Text>
            <Text style={styles.editHint}>
              Lo que esperas de tu cofounder — lo que tú no tienes.
            </Text>
            <View style={styles.skillPills}>
              {SKILL_OPTIONS.map((skill) => {
                const isOwn = offeredSkills.includes(skill) && skill !== OTHER_OPTION;
                const isWant = learningSkills.includes(skill);
                return (
                  <TouchableOpacity
                    key={`learn-${skill}`}
                    disabled={isOwn}
                    style={[
                      styles.skillPill,
                      isOwn && styles.skillPillDisabled,
                      isWant && styles.skillPillLearn,
                    ]}
                    onPress={() => setLearningSkills((curr) => toggleArray(skill, curr))}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.skillPillText,
                        isOwn && styles.skillPillTextDisabled,
                        isWant && styles.skillPillTextSelected,
                      ]}
                    >
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {learningSkills.includes(OTHER_OPTION) && (
              <TextInput
                style={styles.customInput}
                value={customLearningSkills}
                onChangeText={setCustomLearningSkills}
                placeholder="Escribe lo que buscas (separado por comas)"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <Text style={styles.editSectionLabel}>Nivel emprendedor</Text>
            <View style={styles.optionRow}>
              {LEVEL_OPTIONS.map((opt) => {
                const selected = entrepreneurLevel === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                    onPress={() => setEntrepreneurLevel(selected ? null : opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={14} color={selected ? colors.primary : colors.textMuted} />
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>{opt.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.editSectionLabel}>¿Qué buscas?</Text>
            <View style={styles.optionRow}>
              {GOAL_OPTIONS.map((opt) => {
                const selected = goal === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                    onPress={() => setGoal(selected ? null : opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={14} color={selected ? colors.primary : colors.textMuted} />
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>{opt.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.editSectionLabel}>Estado de tu proyecto</Text>
            <View style={styles.optionRow}>
              {PROJECT_STAGE_OPTIONS.map((opt) => {
                const selected = projectStage === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                    onPress={() => setProjectStage(selected ? null : opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={14} color={selected ? colors.primary : colors.textMuted} />
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>{opt.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.mentorRow, isMentor && styles.mentorRowActive]}
              onPress={() => setIsMentor((m) => !m)}
              activeOpacity={0.85}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isMentor }}
            >
              <View style={[styles.mentorCheckbox, isMentor && styles.mentorCheckboxActive]}>
                {isMentor && <Ionicons name="checkmark" size={14} color={colors.background} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mentorTitle}>Disponible como mentor</Text>
                <Text style={styles.mentorDesc}>
                  Si tienes experiencia, marca esta casilla para aparecer como mentor en el feed.
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.editSectionLabel}>Redes sociales</Text>
            <InputField
              label="Usuario de LinkedIn"
              value={linkedinUsername}
              onChangeText={setLinkedinUsername}
              placeholder="ej: juan-perez (sin URL)"
              autoCapitalize="none"
              icon={<Ionicons name="logo-linkedin" size={18} color="#0A66C2" />}
            />
            <InputField
              label="Usuario de Instagram"
              value={instagramUsername}
              onChangeText={setInstagramUsername}
              placeholder="ej: juanperez (sin @)"
              autoCapitalize="none"
              icon={<Ionicons name="logo-instagram" size={18} color="#E4405F" />}
            />

            <PrimaryButton label="Guardar cambios" onPress={handleSave} loading={saving} />
            <PrimaryButton
              label="Cancelar"
              onPress={() => setEditing(false)}
              variant="secondary"
            />
          </View>
        ) : (
          <View style={styles.viewSection}>
            {/* Bio */}
            {profileData?.bio ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sobre mí</Text>
                <Text style={styles.cardText}>{profileData.bio}</Text>
              </View>
            ) : null}

            {/* Intereses */}
            {profileData?.interests ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Intereses</Text>
                <Text style={styles.cardText}>{profileData.interests}</Text>
              </View>
            ) : null}

            {/* Mis habilidades */}
            {profileData?.offeredSkills && profileData.offeredSkills.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mis habilidades</Text>
                <View style={styles.badgeRow}>
                  {profileData.offeredSkills.map((s) => (
                    <SkillBadge key={s.name} label={s.name} variant="offer" />
                  ))}
                </View>
              </View>
            )}

            {/* Quiero aprender */}
            {profileData?.learningSkills && profileData.learningSkills.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quiero aprender</Text>
                <View style={styles.badgeRow}>
                  {profileData.learningSkills.map((s) => (
                    <SkillBadge key={s.name} label={s.name} variant="learn" />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Menú de opciones */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyActivity')}
            accessibilityRole="button"
            accessibilityLabel="Mi actividad"
          >
            <Ionicons name="paper-plane-outline" size={18} color="#60A5FA" />
            <Text style={styles.menuItemText}>Mi actividad</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ProfileVisitors')}
            accessibilityRole="button"
            accessibilityLabel="Te han visitado"
          >
            <Ionicons name="eye-outline" size={18} color="#C9A84C" />
            <Text style={styles.menuItemText}>Te han visitado</Text>
            {!user?.isPremium && (
              <View style={styles.menuPremiumBadge}>
                <Ionicons name="diamond" size={10} color={colors.premiumStart} />
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (!user?.id) return;
              Share.share({
                message: `Echa un vistazo a mi perfil profesional en CoFound: https://cofound.space/u/${user.id}`,
                url: `https://cofound.space/u/${user.id}`,
              }).catch(() => {});
            }}
            accessibilityRole="button"
            accessibilityLabel="Compartir mi perfil"
          >
            <Ionicons name="share-social-outline" size={18} color="#4ADE80" />
            <Text style={styles.menuItemText}>Compartir mi perfil</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          {([
            { label: 'Configuración de cuenta', screen: 'Settings' as const, icon: 'settings-outline' as const },
            { label: 'Privacidad y seguridad', screen: 'Privacy' as const, icon: 'shield-outline' as const },
            { label: 'Notificaciones', screen: 'Notifications' as const, icon: 'notifications-outline' as const },
            { label: 'Ayuda y soporte', screen: 'Support' as const, icon: 'help-circle-outline' as const },
          ]).map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={signOut}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.menuItemText, styles.menuItemDangerText]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Banner premium (solo para no-premium) */}
        {!user?.isPremium && (
          <View style={styles.premiumBanner}>
            <Ionicons name="ribbon" size={32} color={colors.premiumStart} />
            <Text style={styles.premiumBannerTitle}>Descubre Premium</Text>
            <Text style={styles.premiumBannerText}>
              Accede a conexiones ilimitadas, filtros avanzados y mucho más
            </Text>
            <TouchableOpacity style={styles.premiumBannerBtn} onPress={() => navigation.navigate('Pricing')}>
              <Text style={styles.premiumBannerBtnText}>Ver planes desde 3,49 €/mes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fullscreen Photo Viewer */}
      <Modal
        visible={photoViewer.visible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPhotoViewer((s) => ({ ...s, visible: false }))}
      >
        <View style={styles.photoViewerContainer}>
          <TouchableOpacity
            onPress={() => setPhotoViewer((s) => ({ ...s, visible: false }))}
            style={[styles.photoViewerClose, { top: insets.top + 12 }]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={photoViewer.index}
            getItemLayout={(_, idx) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * idx, index: idx })}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <View style={styles.photoFullWrap}>
                <Image source={{ uri: item.url }} style={styles.photoFull} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarSection: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.premiumStart,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  premiumBtnText: {
    color: colors.premiumStart,
    fontWeight: '700',
    fontSize: 13,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.premiumStart,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  premiumBadgeText: {
    color: colors.premiumStart,
    fontWeight: '700',
    fontSize: 13,
  },
  editSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  editSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: -4,
    letterSpacing: 0.2,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  optionChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  editHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -4,
    lineHeight: 17,
  },
  skillPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skillPillOffer: {
    borderColor: '#4ADE80',
    backgroundColor: '#4ADE80',
  },
  skillPillLearn: {
    borderColor: '#60A5FA',
    backgroundColor: '#60A5FA',
  },
  skillPillInterest: {
    borderColor: '#A855F7',
    backgroundColor: '#A855F7',
  },
  customInput: {
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    backgroundColor: 'rgba(74,222,128,0.08)',
    marginTop: 4,
  },
  skillPillDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.4,
  },
  skillPillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  skillPillTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  skillPillTextDisabled: {
    color: colors.textMuted,
  },
  menuPremiumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(201,168,76,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  mentorRowActive: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  mentorCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mentorCheckboxActive: {
    backgroundColor: '#C9A84C',
    borderColor: '#C9A84C',
  },
  mentorTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  mentorDesc: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  viewSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing.sm,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
    backgroundColor: colors.dangerLight,
  },
  menuItemDangerText: {
    color: colors.danger,
  },
  premiumBanner: {
    marginHorizontal: spacing.lg,
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.premiumStart,
    alignItems: 'center',
    gap: spacing.sm,
  },
  premiumBannerTitle: {
    color: colors.premiumStart,
    fontSize: 18,
    fontWeight: '800',
  },
  premiumBannerText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumBannerBtn: {
    backgroundColor: colors.premiumStart,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  premiumBannerBtnText: {
    color: colors.black,
    fontWeight: '700',
  },

  // Email verification banner
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(201, 168, 76, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.4)',
    borderRadius: 14,
  },
  verifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyContent: { flex: 1 },
  verifyTitle: { fontSize: 14, fontWeight: '700', color: '#C9A84C' },
  verifyText: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },

  // Photos
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  photoMainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoMainText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  photoAddBtn: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // Fullscreen viewer
  photoViewerContainer: { flex: 1, backgroundColor: '#000' },
  photoViewerClose: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  photoFullWrap: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFull: { width: SCREEN_WIDTH, height: '100%' },
  completenessBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  completenessBarFill: { height: '100%', borderRadius: 5 },
  completenessHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  completenessItem: { fontSize: 13, color: colors.textMuted, marginLeft: 6, lineHeight: 20 },
});
