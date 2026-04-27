import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { deactivateAccountRequest, deleteAccountRequest } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { user, signOut } = useAuth();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmDeactivate = () =>
    Alert.alert(
      'Desactivar cuenta',
      'Tu perfil dejará de aparecer para otros usuarios. Podrás reactivarlo iniciando sesión de nuevo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateAccountRequest();
              Alert.alert('Cuenta desactivada', 'Vuelve a iniciar sesión cuando quieras reactivarla.');
              signOut();
            } catch {
              Alert.alert('Error', 'No se pudo desactivar la cuenta.');
            }
          },
        },
      ],
    );

  const handleDelete = async () => {
    if (deletePassword.length < 6) {
      Alert.alert('Error', 'Introduce tu contraseña.');
      return;
    }
    try {
      setDeleting(true);
      await deleteAccountRequest(deletePassword);
      setDeleteVisible(false);
      Alert.alert('Cuenta eliminada', 'Todos tus datos han sido eliminados.');
      signOut();
    } catch (err: any) {
      const status = err?.response?.status;
      Alert.alert('Error', status === 401 ? 'Contraseña incorrecta' : 'No se pudo eliminar la cuenta.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangeEmail')} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowDesc}>{user?.email ?? '-'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')} activeOpacity={0.7}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Cambiar contraseña</Text>
              <Text style={styles.rowDesc}>Actualiza tu contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Verificación de cuenta</Text>
              <Text style={[styles.rowDesc, { color: colors.success }]}>Verificada</Text>
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seguridad y datos</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Setup2FA')} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Autenticación 2FA</Text>
              <Text style={styles.rowDesc}>Capa extra de seguridad al iniciar sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('DataExport')} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Descargar mis datos</Text>
              <Text style={styles.rowDesc}>Exportación JSON RGPD</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Idioma y región</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Language')} activeOpacity={0.7}>
            <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Idioma</Text>
              <Text style={styles.rowDesc}>Español</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={[styles.sectionHeader, styles.dangerHeader]}>
            <Text style={styles.dangerTitle}>Zona de peligro</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={confirmDeactivate} activeOpacity={0.7}>
            <Ionicons name="eye-off-outline" size={20} color={colors.danger} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.danger }]}>Desactivar cuenta</Text>
              <Text style={styles.rowDesc}>Oculta temporalmente tu perfil</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => setDeleteVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.danger }]}>Eliminar cuenta</Text>
              <Text style={styles.rowDesc}>Elimina permanentemente todos tus datos</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning" size={32} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>¿Eliminar tu cuenta?</Text>
            <Text style={styles.modalText}>
              Se eliminarán permanentemente tu perfil, fotos, matches, mensajes y todos tus datos. Esta acción no se puede deshacer.
            </Text>
            <Text style={styles.inputLabel}>Confirma con tu contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.dangerBtn, deleting && { opacity: 0.5 }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={styles.dangerBtnText}>{deleting ? 'Eliminando...' : 'Eliminar permanentemente'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDeleteVisible(false); setDeletePassword(''); }}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  dangerSection: { borderColor: '#4A1C1E' },
  dangerHeader: { backgroundColor: colors.dangerLight, borderBottomColor: '#4A1C1E' },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: colors.danger },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  modalText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.sm },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  dangerBtn: {
    width: '100%',
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dangerBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  cancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 8 },
});
