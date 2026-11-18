import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { deviceLockEnabled, unlockWithBiometrics } from '@/src/auth/device-lock';
import { colors } from '@/src/theme';

export function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const path = segments.join('/');
    const inAuth = segments[0] === '(auth)' || /^(login|forgot-password|reset-password|invite)(\/|$)/.test(path);
    const inBrowse = segments[0] === '(browse)' || path.includes('(browse)') || path.startsWith('listings');
    if (status !== 'authed' && !inAuth && !inBrowse) router.replace('/login');
    else if (status === 'authed' && inAuth) router.replace('/');
  }, [router, segments, status]);

  useEffect(() => {
    if (status !== 'authed') {
      setLocked(false);
      return;
    }
    let cancelled = false;
    void deviceLockEnabled().then((on) => {
      if (!cancelled) setLocked(on);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      <StatusBar style="dark" />
      {status === 'loading' ? (
        <View style={styles.boot}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : null}
      {locked ? (
        <View style={styles.boot}>
          <Text style={styles.lockTitle}>Unlock CROS Tenant</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void unlockWithBiometrics()
                .then((ok) => {
                  if (ok) setLocked(false);
                })
                .catch(() => undefined);
            }}
            style={styles.unlock}
          >
            <Text style={styles.unlockText}>Unlock</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  boot: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 16,
  },
  lockTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  unlock: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  unlockText: { color: '#fff', fontWeight: '700' },
});
