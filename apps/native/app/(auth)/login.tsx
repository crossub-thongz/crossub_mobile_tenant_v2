import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Keyboard, Linking, Platform, Pressable, StyleSheet, Text, View, type KeyboardEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ApiError } from '@/src/api/client';
import { useAuth } from '@/src/auth/auth-context';
import { colors } from '@/src/theme';
import { Input } from '@/src/ui/ui';

function isPasswordError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 401) return true;
  const message = err instanceof Error ? err.message.toLowerCase() : '';
  return message.includes('password') || message.includes('credential');
}

const PRIVACY_URL = 'https://www.crossub.com/AU/privacy';
const TERMS_URL = 'https://www.crossub.com/AU/terms';

export default function LoginScreen() {
  const { login, status } = useAuth();
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
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
    const show = Keyboard.addListener('keyboardWillShow', move);
    const hide = Keyboard.addListener('keyboardWillHide', (event) => {
      lift.value = event.duration ? withTiming(0, { duration: event.duration }) : 0;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [bottomInset, lift]);

  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  const onSubmit = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    setPasswordError(null);
    try {
      await login(emailRef.current, passwordRef.current);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      if (isPasswordError(err)) setPasswordError(message === 'Enter your password.' ? message : 'Invalid password');
      else setError(message);
    } finally {
      submitLock.current = false;
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
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              textContentType="none"
              keyboardType="email-address"
              defaultValue=""
              onChangeText={(value) => {
                emailRef.current = value;
              }}
              placeholder="Email Address"
            />
            <View style={styles.passwordGroup}>
              <View>
                <Input
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                  passwordRules=""
                  secureTextEntry={!passwordVisible}
                  defaultValue=""
                  onChangeText={(value) => {
                    passwordRef.current = value;
                    setPasswordError((current) => (current ? null : current));
                  }}
                  placeholder="Password"
                  onSubmitEditing={onSubmit}
                  style={[styles.passwordInput, passwordError ? styles.passwordInputError : null]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  onPress={() => setPasswordVisible((current) => !current)}
                  hitSlop={8}
                  style={styles.eye}
                >
                  <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>
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
  passwordGroup: { gap: 6 },
  passwordInput: { paddingRight: 44 },
  passwordInputError: { borderColor: colors.danger },
  eye: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center' },
  fieldError: { color: colors.danger, fontSize: 13 },
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
