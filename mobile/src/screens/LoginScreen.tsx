import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const logo = require('../../assets/logocofound.png');
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface Errors {
  email?: string;
  password?: string;
}

export const LoginScreen = ({ navigation }: Props) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleLogin = async () => {
    const validation: Errors = {};
    if (!email.trim()) {
      validation.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validation.email = 'Introduce un correo válido';
    }
    if (!password) {
      validation.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      validation.password = 'Mínimo 6 caracteres';
    }

    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === 'Invalid credentials') {
        setErrors({ password: 'Correo o contraseña incorrectos' });
      } else {
        Alert.alert('Error', msg || 'No se pudo iniciar sesión');
      }
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
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="tu@email.com"
            icon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            error={errors.email}
          />
          <InputField
            label="Contraseña"
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
          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
          <PrimaryButton label="Iniciar sesión" onPress={handleLogin} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.switchLink}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: 6,
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 200,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
