import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { changePasswordRequest } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen = ({ navigation }: Props) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  const handleSubmit = async () => {
    const v: typeof errors = {};
    if (current.length < 6) v.current = 'Introduce tu contraseña actual';
    if (next.length < 6) v.next = 'Mínimo 6 caracteres';
    if (next === current) v.next = 'Debe ser distinta a la actual';
    if (next !== confirm) v.confirm = 'Las contraseñas no coinciden';
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setLoading(true);
      await changePasswordRequest(current, next);
      Alert.alert('Contraseña actualizada', 'Ya puedes usar tu nueva contraseña.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo cambiar la contraseña';
      if (err?.response?.status === 401) setErrors({ current: msg });
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <InputField
          label="Contraseña actual"
          secureTextEntry
          value={current}
          onChangeText={(t) => { setCurrent(t); if (errors.current) setErrors((e) => ({ ...e, current: undefined })); }}
          placeholder="••••••••"
          icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          error={errors.current}
        />
        <InputField
          label="Nueva contraseña"
          secureTextEntry
          value={next}
          onChangeText={(t) => { setNext(t); if (errors.next) setErrors((e) => ({ ...e, next: undefined })); }}
          placeholder="Mínimo 6 caracteres"
          icon={<Ionicons name="key-outline" size={18} color={colors.textMuted} />}
          error={errors.next}
        />
        <InputField
          label="Confirmar nueva contraseña"
          secureTextEntry
          value={confirm}
          onChangeText={(t) => { setConfirm(t); if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined })); }}
          placeholder="••••••••"
          icon={<Ionicons name="key-outline" size={18} color={colors.textMuted} />}
          error={errors.confirm}
        />
        <PrimaryButton label="Cambiar contraseña" onPress={handleSubmit} loading={loading} />
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
  content: { padding: spacing.lg, gap: spacing.md },
});
