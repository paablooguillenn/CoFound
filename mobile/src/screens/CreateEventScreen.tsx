import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';
import {
  CATEGORY_META,
  EVENT_CATEGORIES,
  EventCategory,
  createEvent,
} from '../services/events.service';

const HOURS = ['09:00', '11:00', '13:00', '16:00', '18:00', '19:00', '20:00', '21:00'];

const buildDayOptions = () => {
  const out: { iso: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let label: string;
    if (i === 0) label = 'Hoy';
    else if (i === 1) label = 'Mañana';
    else label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ iso, label });
  }
  return out;
};

export const CreateEventScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('coffee');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState<string | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  const dayOptions = buildDayOptions();

  const canSubmit = title.trim().length >= 3 && day && hour;

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    const startsAt = `${day}T${hour}:00`;
    const startsDate = new Date(startsAt);
    if (Number.isNaN(startsDate.getTime()) || startsDate.getTime() <= Date.now()) {
      Alert.alert('Fecha inválida', 'La fecha y hora deben ser futuras.');
      return;
    }
    const cap = capacity.trim() ? Number(capacity.trim()) : null;
    if (cap != null && (Number.isNaN(cap) || cap < 2 || cap > 500)) {
      Alert.alert('Aforo', 'El aforo debe ser un número entre 2 y 500, o vacío.');
      return;
    }

    setSaving(true);
    try {
      const created = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        city: city.trim() || undefined,
        location: location.trim() || undefined,
        startsAt: startsDate.toISOString(),
        capacity: cap,
      });
      navigation.replace('EventDetail', { eventId: created.id });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo crear el evento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear evento</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Café para founders en Madrid"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={120}
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.pillRow}>
          {EVENT_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, active && { backgroundColor: meta.color, borderColor: meta.color }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pillText, active && { color: colors.background }]}>
                  {meta.emoji} {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Día *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRowH}>
          {dayOptions.map((d) => {
            const active = day === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setDay(d.iso)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Hora *</Text>
        <View style={styles.pillRow}>
          {HOURS.map((h) => {
            const active = hour === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setHour(h)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Madrid"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={80}
        />

        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Toma Café, Calle Olavide 3"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={200}
        />

        <Text style={styles.label}>Aforo (opcional)</Text>
        <TextInput
          value={capacity}
          onChangeText={(t) => setCapacity(t.replace(/[^0-9]/g, ''))}
          placeholder="8"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="numeric"
          maxLength={3}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Cuenta de qué va, qué se trata, qué nivel..."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={5}
          maxLength={2000}
          textAlignVertical="top"
        />

        <PrimaryButton
          label="Crear evento"
          onPress={handleSubmit}
          loading={saving}
        />
        <Text style={styles.helperText}>
          Solo puedes tener 1 evento futuro activo. Si creas otro, primero cancela el anterior.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  textArea: { minHeight: 100 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillRowH: { gap: 8, paddingRight: spacing.md },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: colors.background },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 17,
  },
});
