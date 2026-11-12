import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

export default function AgreementScreen() {
  const { agreementName, acceptAgreement } = useDemo();
  const [name, setName] = useState(agreementName ?? '');
  const [agreed, setAgreed] = useState(Boolean(agreementName));
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.kicker}>REQUIRED BEFORE YOU RELY ON THE PORTAL</Text>
      <Text style={styles.title}>System access agreement</Text>
      <Text style={styles.body}>
        Before using the CROSSUB tenant portal, read and accept the system access agreement. Your signed acceptance is stored for compliance. This preview keeps the signature on the device.
      </Text>
      <Card>
        <Text style={styles.item}>What you are agreeing to</Text>
        <Text style={styles.body}>Use the app only for your own tenancy. Keep your password to yourself. Do not upload another person's documents. The portal records who accepted this agreement and when.</Text>
      </Card>
      {agreementName ? <Notice>{`${agreementName} has accepted this agreement on this device.`}</Notice> : null}
      <Field label="Full legal name">
        <Input value={name} onChangeText={setName} autoComplete="name" />
      </Field>
      <Pressable accessibilityRole="button" onPress={() => setAgreed((value) => !value)}>
        <Text style={styles.item}>{agreed ? 'I have read and agree' : 'Tap to confirm you have read and agree'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="Accept agreement"
        onPress={() => {
          if (!agreed) {
            setError('Confirm that you have read and agree.');
            return;
          }
          setError(acceptAgreement(name));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
});
