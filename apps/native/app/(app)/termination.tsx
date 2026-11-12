import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Screen } from '@/src/ui/ui';

export default function TerminationScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [moveOut, setMoveOut] = useState(demo.terminationMoveOut);
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen>
      <BackButton fallback="/" />
      <Text style={styles.kicker}>NOTICE FROM CROSSUB</Text>
      <Text style={styles.title}>Termination notice</Text>
      <Card>
        <Text style={styles.address}>{demo.vacating?.address || demo.property.title}</Text>
        <Text style={styles.body}>{demo.vacating?.reason || 'No termination notice is open. You can still tell CROSSUB the date you plan to leave.'}</Text>
        {demo.vacating?.vacateDate ? <Text style={styles.body}>Vacate date {demo.vacating.vacateDate}</Text> : null}
      </Card>
      <Button label="Message Crossub" tone="outline" onPress={() => router.push('/flow/new-message')} />
      {demo.terminationStarted ? (
        <Card>
          <Text style={styles.address}>Move-out date {demo.terminationMoveOut}</Text>
          <Text style={styles.body}>The vacating case is open on this device.</Text>
          <Button label="Move-out services" onPress={() => router.push('/move-out-services')} />
        </Card>
      ) : (
        <Card>
          <Field label="Select move-out date">
            <Input value={moveOut} onChangeText={setMoveOut} placeholder="14 Dec 2026" />
          </Field>
          <Text style={styles.body}>Confirm when you plan to leave. Moving and cleaning can be arranged after that.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="Confirm vacating date"
            onPress={() => {
              const message = demo.confirmTermination(moveOut);
              setError(message);
              if (!message) router.push('/move-out-services');
            }}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
