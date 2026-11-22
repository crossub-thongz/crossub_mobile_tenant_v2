import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Keyboard, Linking, Platform, Pressable, StyleSheet, Text, View, type KeyboardEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAuth } from '@/src/auth/auth-context';
import { colors } from '@/src/theme';
import { Input } from '@/src/ui/ui';

const PRIVACY_URL = 'https://www.crossub.com/AU/privacy';
const TERMS_URL = 'https://www.crossub.com/AU/terms';

export default function LoginScreen() {
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bottomInset = useSafeAreaInsets().bottom;
  const lift = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const move = (event: KeyboardEvent) => {
      const visible = Math.max(Dimensions.get('window').height - event.endCoordinates.screenY, 0);
      const overlap = Math.max(visible - bottomInset, 0);
      const next = -overlap / 2;
      lift.value = event.duration
        ? withTiming(next, { duration: event.duration, easing: Easing.bezier(0.38, 0.7, 0.125, 1) })
        : next;
    };
    const subscription = Keyboard.addListener('keyboardWillChangeFrame', move);
    return () => subscription.remove();
  }, [bottomInset, lift]);

  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'authed') {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.inner, liftStyle]}>
          <Image source={require('@/assets/brand/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Your rental home, made simple.</Text>
          <Text style={styles.sub}>Sign in with the account from your tenancy invitation.</Text>
          <View style={styles.card}>
            <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email Address" />
            <Input secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} placeholder="Password" onSubmitEditing={onSubmit} />
            <Link href="/forgot-password" asChild>
              <Pressable style={styles.forgotHit}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            </Link>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" onPress={onSubmit} disabled={submitting} style={styles.button}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in →</Text>}
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Text style={styles.existing}>Existing Tenant?</Text>
            <Link href="/listings" asChild>
              <Pressable style={styles.linkHit}>
                <Text style={styles.link}>Browse listings</Text>
              </Pressable>
            </Link>
            <Link href="/invite" asChild>
              <Pressable style={styles.linkHit}>
                <Text style={styles.link}>I have an invitation</Text>
              </Pressable>
            </Link>
          </View>
      </Animated.View>
      <View style={styles.legal}>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
          <Text style={styles.legalText}>Terms of Use</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  inner: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 8 },
  logo: { width: 88, height: 88, borderRadius: 22, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 8 },
  card: { alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 24, padding: 16, gap: 10 },
  forgotHit: { alignSelf: 'flex-end' },
  forgot: { color: colors.green, fontWeight: '700', fontSize: 13 },
  error: { color: colors.danger, fontSize: 13 },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { alignItems: 'center', gap: 8, marginTop: 16 },
  existing: { color: colors.muted, fontSize: 13 },
  linkHit: { alignSelf: 'center' },
  link: { color: colors.green, fontWeight: '700' },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingBottom: 8 },
  legalText: { color: colors.muted, fontSize: 12 },
});
