import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type Variant = 'success' | 'error' | 'info';
type ShowToast = (message: string, variant?: Variant, durationMs?: number) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

type ToastState = {
  id: number;
  message: string;
  variant: Variant;
};

/**
 * Lightweight toast/snackbar. Sits at the top safe-area, fades in/out, used
 * for one-shot non-blocking feedback (network errors, validation, "perfil
 * actualizado", etc.) instead of Alert.alert which steals focus.
 */
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>(
    (message, variant = 'info', durationMs = 3000) => {
      if (timer.current) clearTimeout(timer.current);
      const id = Date.now();
      setToast({ id, message, variant });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 3000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, opacity, translate]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              top: insets.top + 8,
              opacity,
              transform: [{ translateY: translate }],
            },
          ]}
        >
          <View style={[styles.toast, styles[toast.variant]]}>
            <Ionicons
              name={
                toast.variant === 'success'
                  ? 'checkmark-circle'
                  : toast.variant === 'error'
                    ? 'alert-circle'
                    : 'information-circle'
              }
              size={18}
              color="#fff"
            />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10000,
    elevation: 10000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  success: { backgroundColor: '#16A34A' },
  error: { backgroundColor: '#DC2626' },
  info: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  message: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
});
