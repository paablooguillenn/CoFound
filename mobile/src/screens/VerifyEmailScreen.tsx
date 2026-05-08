import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { CommonActions } from '@react-navigation/native';
import { confirmEmailVerificationCode, requestEmailVerificationCode } from '../services/profile.service';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen = ({ navigation }: Props) => {
  const { user, updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const goToTabs = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
    );
  };

  const handleSkip = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else goToTabs();
  };

  const handleResend = async () => {
    try {
      await requestEmailVerificationCode();
      Alert.alert('Código reenviado', `Hemos enviado un nuevo código a ${user?.email}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo reenviar el código.');
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('El código son 6 dígitos numéricos');
      return;
    }
    try {
      setLoading(true);
      await confirmEmailVerificationCode(code);
      if (user) updateUser({ ...user, emailVerified: true });
      Alert.alert('Email verificado', 'Tu cuenta ya está verificada.', [
        { text: 'Continuar', onPress: goToTabs },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Código incorrecto o caducado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} hitSlop={12} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verifica tu email</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={36} color={colors.success} />
        </View>
        <Text style={styles.title}>Revisa tu bandeja</Text>
        <Text style={styles.sub}>
          Hemos enviado un código de 6 dígitos a{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        <View style={styles.form}>
          <InputField
            label="Código de verificación"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, ''));
              if (error) setError(undefined);
            }}
            placeholder="123456"
            icon={<Ionicons name="key-outline" size={18} color={colors.textMuted} />}
            error={error}
          />
          <PrimaryButton label="Verificar email" onPress={handleVerify} loading={loading} />
        </View>

        <TouchableOpacity onPress={handleResend} style={styles.resend}>
          <Text style={styles.resendText}>
            ¿No te ha llegado?{' '}
            <Text style={styles.resendLink}>Reenviar código</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.resend} accessibilityLabel="Verificar más tarde">
          <Text style={styles.resendText}>Verificar más tarde</Text>
        </TouchableOpacity>
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
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  email: { color: colors.text, fontWeight: '700' },
  form: { width: '100%', gap: spacing.md, marginTop: spacing.md },
  resend: { alignItems: 'center', paddingVertical: spacing.sm },
  resendText: { color: colors.textSecondary, fontSize: 14 },
  resendLink: { color: colors.success, fontWeight: '700' },
});
