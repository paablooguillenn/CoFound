import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportDataRequest } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'DataExport'>;

export const DataExportScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      const exported = await exportDataRequest();
      setData(exported);
    } catch {
      Alert.alert('Error', 'No se pudo generar la exportación.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'cofound-export.json',
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Descargar mis datos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={22} color={colors.info} />
          <Text style={styles.infoText}>
            Genera una copia en formato JSON de toda la información que CoFound tiene sobre ti
            (perfil, fotos, skills, likes, matches y mensajes enviados). Cumple con el RGPD.
          </Text>
        </View>

        {!data ? (
          <TouchableOpacity style={styles.btn} onPress={handleExport} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="download" size={20} color={colors.background} />
                <Text style={styles.btnText}>Generar exportación</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.successText}>Exportación lista. Puedes compartirla o copiarla.</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share" size={20} color={colors.background} />
              <Text style={styles.btnText}>Compartir / Guardar</Text>
            </TouchableOpacity>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Vista previa</Text>
              <Text style={styles.previewJson} numberOfLines={20}>
                {JSON.stringify(data, null, 2)}
              </Text>
            </View>
          </>
        )}
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
  content: { padding: spacing.md, gap: spacing.md },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: '#1A3A5C',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19 },
  successBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#1A3D25',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
  successText: { flex: 1, fontSize: 13, color: colors.success, fontWeight: '600' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  previewTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  previewJson: { color: colors.text, fontSize: 11, fontFamily: 'Courier' },
});
