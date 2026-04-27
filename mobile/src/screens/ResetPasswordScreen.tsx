import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { resetPasswordRequest, forgotPasswordRequest } from '../services/auth.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

interface Errors {
  code?: string;
  password?: string;
  confirm?: string;
}

export const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleResend = async () => {
    try {
      await forgotPasswordRequest(email);
      Alert.alert('Código reenviado', `Hemos enviado un nuevo código a ${email}.`);
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el código.');
    }
  };

  const handleSubmit = async () => {
    const validation: Errors = {};
    if (!/^\d{6}$/.test(code)) validation.code = 'El código son 6 dígitos numéricos';
    if (password.length < 6) validation.password = 'Mínimo 6 caracteres';
    if (password !== confirm) validation.confirm = 'Las contraseñas no coinciden';

    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      setLoading(true);
      await resetPasswordRequest({ email, code, newPassword: password });
      Alert.alert(
        'Contraseña actualizada',
        'Ya puedes iniciar sesión con tu nueva contraseña.',
        [{ text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo cambiar la contraseña';
      setErrors({ code: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Revisa tu email</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de 6 dígitos a{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Código de 6 dígitos"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, ''));
              if (errors.code) setErrors((e) => ({ ...e, code: undefined }));
            }}
            placeholder="123456"
            icon={<Ionicons name="key-outline" size={18} color={colors.textMuted} />}
            error={errors.code}
          />
          <InputField
            label="Nueva contraseña"
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            placeholder="••••••••"
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            error={errors.password}
          />
          <InputField
            label="Confirmar contraseña"
            secureTextEntry
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
            }}
            placeholder="••••••••"
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            error={errors.confirm}
          />
          <PrimaryButton label="Cambiar contraseña" onPress={handleSubmit} loading={loading} />
        </View>

        <TouchableOpacity onPress={handleResend} style={styles.resend}>
          <Text style={styles.resendText}>
            ¿No te ha llegado?{' '}
            <Text style={styles.resendLink}>Reenviar código</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
  },
  backText: { color: colors.textSecondary, fontSize: 14 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: { gap: spacing.sm, alignItems: 'center' },
  iconCircle: {
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  email: { color: colors.text, fontWeight: '700' },
  form: { gap: spacing.md },
  resend: { alignItems: 'center', paddingVertical: spacing.sm },
  resendText: { color: colors.textSecondary, fontSize: 14 },
  resendLink: { color: colors.primary, fontWeight: '700' },
});
