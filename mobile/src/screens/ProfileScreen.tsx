import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SkillBadge } from '../components/SkillBadge';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/profile.service';
import { getMyPhotos, addPhoto, deletePhoto } from '../services/api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Skill } from '../types/models';
import { AppStackParamList } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const stringToSkills = (value: string): Skill[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

export const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<{ visible: boolean; index: number }>({ visible: false, index: 0 });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');
  const [offeredSkills, setOfferedSkills] = useState('');
  const [learningSkills, setLearningSkills] = useState('');
  const [saving, setSaving] = useState(false);

  // Datos cargados (para el modo vista)
  const [profileData, setProfileData] = useState<{
    bio: string;
    interests: string;
    location: string;
    offeredSkills: Skill[];
    learningSkills: Skill[];
  } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setBio(profile.bio);
      setInterests(profile.interests);
      setLocation(profile.location);
      setOfferedSkills(profile.offeredSkills.map((s) => s.name).join(', '));
      setLearningSkills(profile.learningSkills.map((s) => s.name).join(', '));
      setAvatarUrl(profile.avatarUrl ?? null);
      setProfileData({
        bio: profile.bio,
        interests: profile.interests,
        location: profile.location,
        offeredSkills: profile.offeredSkills,
        learningSkills: profile.learningSkills,
      });
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const profile = await updateMyProfile({
        firstName,
        lastName,
        bio,
        interests,
        location,
        offeredSkills: stringToSkills(offeredSkills),
        learningSkills: stringToSkills(learningSkills),
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
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0].base64) return;

    try {
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
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
        </View>

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
            <InputField
              label="Intereses"
              value={interests}
              onChangeText={setInterests}
              placeholder="Tecnología, SaaS, Marketing..."
            />
            <InputField
              label="Ubicación"
              value={location}
              onChangeText={setLocation}
              placeholder="Madrid, España"
            />
            <InputField
              label="Habilidades que posees"
              value={offeredSkills}
              onChangeText={setOfferedSkills}
              placeholder="marketing, react native, diseño..."
            />
            <InputField
              label="Habilidades que deseas aprender"
              value={learningSkills}
              onChangeText={setLearningSkills}
              placeholder="finanzas, growth, ui/ux..."
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
          {([
            { label: 'Configuración de cuenta', screen: 'Settings' as const, icon: 'settings-outline' as const },
            { label: 'Privacidad y seguridad', screen: 'Privacy' as const, icon: 'shield-outline' as const },
            { label: 'Notificaciones', screen: 'Notifications' as const, icon: 'notifications-outline' as const },
            { label: 'Ayuda y soporte', screen: undefined, icon: 'help-circle-outline' as const },
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
              Accede a matches ilimitados, filtros avanzados y mucho más
            </Text>
            <TouchableOpacity style={styles.premiumBannerBtn} onPress={() => navigation.navigate('Pricing')}>
              <Text style={styles.premiumBannerBtnText}>Ver planes desde 6€/mes</Text>
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
});
