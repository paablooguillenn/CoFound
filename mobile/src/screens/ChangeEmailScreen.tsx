import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { changeEmailRequest } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangeEmail'>;

export const ChangeEmailScreen = ({ navigation }: Props) => {
  const { user, updateUser } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newEmail?: string; password?: string }>({});

  const handleSubmit = async () => {
    const v: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) v.newEmail = 'Email no válido';
    if (newEmail.trim().toLowerCase() === user?.email) v.newEmail = 'Es tu email actual';
    if (password.length < 6) v.password = 'Mínimo 6 caracteres';
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setLoading(true);
      const result = await changeEmailRequest(newEmail.trim().toLowerCase(), password);
      if (user) updateUser({ ...user, email: result.email });
      Alert.alert('Email actualizado', `Tu email ahora es ${result.email}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo actualizar el email';
      const status = err?.response?.status;
      if (status === 401) setErrors({ password: msg });
      else if (status === 409) setErrors({ newEmail: msg });
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
        <Text style={styles.headerTitle}>Cambiar email</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>
          Email actual: <Text style={styles.email}>{user?.email}</Text>
        </Text>

        <InputField
          label="Nuevo email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={newEmail}
          onChangeText={(t) => { setNewEmail(t); if (errors.newEmail) setErrors((e) => ({ ...e, newEmail: undefined })); }}
          placeholder="nuevo@email.com"
          icon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
          error={errors.newEmail}
        />
        <InputField
          label="Tu contraseña actual"
          secureTextEntry
          value={password}
          onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
          placeholder="••••••••"
          icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          error={errors.password}
        />
        <PrimaryButton label="Actualizar email" onPress={handleSubmit} loading={loading} />
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
  sub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  email: { color: colors.text, fontWeight: '700' },
});
