import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { resetPasswordStatus, submitNewPassword } from '@/src/api/auth';
import { colors } from '@/src/theme';
import { Button, Field, Input, Screen } from '@/src/ui/ui';

const PROBLEM = {
  used: {
    title: 'This link has already been used',
    body: 'The password was already reset with this link. Sign in with that password, or request a new link.',
  },
  invalid: {
    title: 'This reset link is invalid',
    body: 'Request a new reset link to choose a password.',
  },
} as const;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const linkToken = Array.isArray(token) ? token[0] : token;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<'used' | 'invalid' | null>(linkToken ? null : 'invalid');

  useEffect(() => {
    if (!linkToken) return;
    void resetPasswordStatus(linkToken).then((state) => {
      if (state !== 'ok') setProblem(state);
    });
  }, [linkToken]);

  const onSubmit = () => {
    if (!linkToken) {
      setProblem('invalid');
      return;
    }
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    void submitNewPassword(linkToken, password)
      .then(() => router.replace('/login'))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Could not reset the password';
        if (message.toLowerCase().includes('used')) setProblem('used');
        else setError(message);
      });
    };

  if (problem) {
    const copy = PROBLEM[problem];
    return (
      <Screen>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <Button label="Sign in" onPress={() => router.replace('/login')} />
        <Button label="Request a new link" tone="outline" onPress={() => router.replace('/forgot-password')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Link href="/login" style={styles.back}>
        Back to sign in
      </Link>
      <Text style={styles.title}>Choose a new password</Text>
      <Text style={styles.body}>Enter a new password for your Tenant app account. The next sign-in for this email must use it.</Text>
      <Field label="New password">
        <Input secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} placeholder="At least 10 characters" />
      </Field>
      <Field label="Confirm password">
        <Input secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} placeholder="Repeat the password" />
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Reset password" onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.green, fontWeight: '700', fontSize: 13 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
