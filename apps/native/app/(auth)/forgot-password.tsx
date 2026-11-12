import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { requestPasswordReset } from '@/src/api/auth';
import { colors } from '@/src/theme';
import { Button, Field, Input, Screen } from '@/src/ui/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@') || !trimmed.split('@')[1]?.includes('.')) {
      setError('Enter a valid email');
      return;
    }
    setError(null);
    void requestPasswordReset(trimmed)
      .then(() => setSent(true))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not send the reset email'));
  };

  return (
    <Screen>
      <Link href="/login" style={styles.back}>
        Back to sign in
      </Link>
      <Text style={styles.title}>Set or reset your password</Text>
      <Text style={styles.body}>
        Enter the email address your property manager has on file and we'll send you a link. This works whether you have signed in before or have never set a password.
      </Text>
      {sent ? (
        <>
          <Text style={styles.body}>
            If that address has an account, the link is on its way. Open it soon, then choose a password and come back to sign in.
          </Text>
          <Text style={styles.body}>Nothing after a few minutes? Check your junk folder, and make sure you used the address your lease is under.</Text>
          <Button label="Back to sign in" tone="outline" onPress={() => router.replace('/login')} />
        </>
      ) : (
        <>
          <Field label="Email">
            <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@email.com" />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Email me a link" onPress={onSubmit} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.green, fontWeight: '700', fontSize: 13 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  note: { color: colors.noticeText, fontSize: 12, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
});
