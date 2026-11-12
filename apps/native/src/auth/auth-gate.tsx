import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { colors } from '@/src/theme';

export function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const path = segments.join('/');
    const inAuth = segments[0] === '(auth)' || /^(login|forgot-password|reset-password|invite)(\/|$)/.test(path);
    const inBrowse = segments[0] === '(browse)' || path.includes('(browse)') || path.startsWith('listings');
    if (status !== 'authed' && !inAuth && !inBrowse) router.replace('/login');
    else if (status === 'authed' && inAuth) router.replace('/');
  }, [router, segments, status]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      <StatusBar style="dark" />
      {status === 'loading' ? (
        <View style={styles.boot}>
          <ActivityIndicator color={colors.green} />
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
  },
});
