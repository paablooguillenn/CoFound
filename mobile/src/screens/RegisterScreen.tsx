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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface Errors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const validate = (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
): Errors => {
  const errors: Errors = {};

  if (!firstName.trim()) {
    errors.firstName = 'El nombre es obligatorio';
  }

  if (!lastName.trim()) {
    errors.lastName = 'Los apellidos son obligatorios';
  }

  if (!email.trim()) {
    errors.email = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Introduce un correo válido (ej: tu@email.com)';
  }

  if (!password) {
    errors.password = 'La contraseña es obligatoria';
  } else if (password.length < 6) {
    errors.password = 'Mínimo 6 caracteres';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
};

export const RegisterScreen = ({ navigation }: Props) => {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleRegister = async () => {
    const validation = validate(firstName, lastName, email, password, confirmPassword);
    setErrors(validation);

    if (Object.keys(validation).length > 0) return;

    try {
      setLoading(true);
      await signUp({ firstName, lastName, email, password });
    } catch (err: any) {
      const data = err?.response?.data;
      // Map Zod validation issues to field errors
      if (data?.issues && Array.isArray(data.issues)) {
        const fieldErrors: Errors = {};
        for (const issue of data.issues) {
          const field = issue.path?.[0] as keyof Errors;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      } else if (data?.message === 'Email already registered') {
        setErrors({ email: 'Este correo ya está registrado' });
      } else {
        const msg = data?.message || err?.message || 'Error desconocido';
        Alert.alert('Error', msg);
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
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Comienza a conectar con emprendedores</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Nombre"
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
            }}
            placeholder="Juan"
            icon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            error={errors.firstName}
          />
          <InputField
            label="Apellidos"
            value={lastName}
            onChangeText={(t) => {
              setLastName(t);
              if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
            }}
            placeholder="Pérez"
            icon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            error={errors.lastName}
          />
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
          <InputField
            label="Confirmar contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
            }}
            placeholder="••••••••"
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            error={errors.confirmPassword}
          />
          <PrimaryButton label="Registrarme" onPress={handleRegister} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.switchText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.switchLink}>Inicia sesión aquí</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Al registrarte aceptas nuestros Términos de Servicio y Política de Privacidad
        </Text>
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
    gap: spacing.lg,
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
  switchText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  terms: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },
});
