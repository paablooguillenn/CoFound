import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

/**
 * Top-of-screen banner that aparece cuando el dispositivo pierde conexión.
 *
 * DESACTIVADO temporalmente: NetInfo en Expo Go iOS daba falsos positivos
 * (banner aparece aunque la conexión real funcione). Devolvemos null hasta
 * que tengamos detección fiable basada en fallos reales de API.
 */
export const OfflineBanner = () => {
  return null;

  // eslint-disable-next-line no-unreachable
  // ── implementación previa, deshabilitada ────────────────────────────
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const translate = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    // Solo confiamos en `isConnected`. `isInternetReachable` da falsos
    // negativos en Expo Go iOS porque su ping de comprobación
    // (captive.apple.com) es flaky y dispara el banner aunque la conexión
    // real funcione perfectamente.
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    Animated.timing(translate, {
      toValue: offline ? 0 : -60,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [offline, translate]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { paddingTop: insets.top, transform: [{ translateY: translate }] },
      ]}
    >
      <View style={styles.banner}>
        <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
        <Text style={styles.text}>Sin conexión a internet</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9990,
    elevation: 9990,
    backgroundColor: '#DC2626',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
