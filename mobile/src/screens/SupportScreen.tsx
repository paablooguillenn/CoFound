import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { sendSupportMessage } from '../services/api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Support'>;

const TOPICS = [
  'Problema técnico',
  'Sugerencia',
  'Mi cuenta',
  'Pagos / suscripción',
  'Reportar un problema',
  'Otro',
];

export const SupportScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = subject.trim().length >= 3 && body.trim().length >= 10;

  const handleSend = async () => {
    try {
      setSending(true);
      const finalSubject = topic ? `[${topic}] ${subject.trim()}` : subject.trim();
      await sendSupportMessage(finalSubject, body.trim());
      Alert.alert(
        'Mensaje enviado',
        'Hemos recibido tu mensaje. Te responderemos por email en menos de 48 horas.',
        [{ text: 'Vale', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.issues?.[0]?.message ??
        'No se pudo enviar el mensaje. Inténtalo más tarde.';
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y soporte</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubbles" size={42} color="#4ADE80" />
          </View>
          <Text style={styles.title}>¿En qué podemos ayudarte?</Text>
          <Text style={styles.subtitle}>
            Cuéntanos qué te ocurre y te responderemos a {user?.email ?? 'tu correo'} en menos de 48 horas.
          </Text>

          <Text style={styles.label}>Tema</Text>
          <View style={styles.topicGrid}>
            {TOPICS.map((t) => {
              const selected = topic === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.topicPill, selected && styles.topicPillActive]}
                  onPress={() => setTopic(selected ? '' : t)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.topicPillText, selected && styles.topicPillTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Asunto</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Resumen breve de tu consulta"
            placeholderTextColor={colors.textMuted}
            maxLength={200}
          />

          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Describe el problema con todo el detalle posible. Si es un bug, incluye los pasos que has seguido y qué esperabas que pasase."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
          <Text style={styles.counter}>
            {body.length} / 5000  ·  mínimo 10 caracteres
          </Text>

          <PrimaryButton
            label={sending ? 'Enviando...' : 'Enviar mensaje'}
            onPress={handleSend}
            loading={sending || !canSend}
          />

          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>
              También puedes escribirnos directamente a{' '}
              <Text style={styles.infoEmail}>soporte@cofound.space</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  heroIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  topicPillActive: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.15)',
  },
  topicPillText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  topicPillTextActive: { color: '#4ADE80', fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 160,
    paddingTop: 12,
  },
  counter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  infoEmail: { color: colors.text, fontWeight: '700' },
});
