import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const confirmDelete = () =>
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción no se puede deshacer. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {} },
      ],
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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

          <TouchableOpacity style={styles.row}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowDesc}>{user?.email ?? '-'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
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

        {/* Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Idioma y región</Text>
          </View>

          <TouchableOpacity style={styles.row}>
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

          <TouchableOpacity style={styles.row}>
            <Ionicons name="eye-off-outline" size={20} color={colors.danger} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.danger }]}>Desactivar cuenta</Text>
              <Text style={styles.rowDesc}>Oculta temporalmente tu perfil</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.danger }]}>Eliminar cuenta</Text>
              <Text style={styles.rowDesc}>Elimina permanentemente todos tus datos</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
