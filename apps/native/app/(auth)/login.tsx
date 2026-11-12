import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/auth-context';
import { colors } from '@/src/theme';
import { Input } from '@/src/ui/ui';

export default function LoginScreen() {
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Text style={styles.brand}>crossub</Text>
          <Text style={styles.kicker}>TENANT</Text>
          <Text style={styles.title}>Your rental home, made simple.</Text>
          <Text style={styles.sub}>Sign in with the account from your tenancy invitation.</Text>

          <Text style={styles.label}>Email</Text>
          <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Password</Text>
          <Input secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} placeholder="Password" onSubmitEditing={onSubmit} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable accessibilityRole="button" onPress={onSubmit} disabled={submitting} style={styles.button}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>

          <Link href="/forgot-password" style={styles.link}>
            Forgot password?
          </Link>
          <Link href="/listings" style={styles.link}>
            Browse listings
          </Link>
          <Link href="/invite" style={styles.link}>
            I have an invitation
          </Link>
          <Text style={styles.hint}>Sign in with the same tenant account you use on the web portal.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  inner: { flex: 1, padding: 24, justifyContent: 'center', gap: 8 },
  brand: { color: colors.green, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 12 },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  label: { color: '#58695e', fontSize: 12, fontWeight: '700', marginTop: 8 },
  error: { color: colors.danger, fontSize: 13 },
  button: { marginTop: 12, minHeight: 48, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { color: colors.green, fontWeight: '700', marginTop: 8 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
