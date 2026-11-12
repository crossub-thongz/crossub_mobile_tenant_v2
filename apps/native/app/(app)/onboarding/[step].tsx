import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import { ONBOARDING_LABEL, ONBOARDING_STEPS } from '@/src/demo/applications';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen, Tag } from '@/src/ui/ui';

export default function OnboardingStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepId = Array.isArray(step) ? step[0] : step;
  const item = ONBOARDING_STEPS.find((entry) => entry.id === stepId);
  const { onboarding, onboardingProofs, uploadOnboardingProof, confirmOnboarding } = useDemo();
  const proofName = item ? onboardingProofs[item.id] ?? '' : '';
  const [error, setError] = useState<string | null>(null);

  if (!item) {
    return (
      <Screen>
        <BackButton fallback="/onboarding" />
        <Text style={styles.body}>This step is not on the checklist.</Text>
      </Screen>
    );
  }

  const status = onboarding[item.id];

  return (
    <Screen>
      <BackButton fallback="/onboarding" />
      <Text style={styles.title}>{item.title}</Text>
      <Tag label={ONBOARDING_LABEL[status]} tone={status === 'completed' ? 'green' : status === 'uploaded' ? 'amber' : 'neutral'} />
      <Text style={styles.body}>{item.description}</Text>
      {item.amount ? (
        <Card>
          <Text style={styles.kicker}>Amount</Text>
          <Text style={styles.amount}>{money(item.amount)}</Text>
          <Text style={styles.body}>Pay this to the account your agent gives you, then upload the receipt. CROSSUB confirms it on the tenancy.</Text>
        </Card>
      ) : null}
      {item.id === 'bond' ? (
        <Notice>The deposit holds the property. The bond is the security amount, usually lodged with the rental bond authority.</Notice>
      ) : null}
      {item.kind === 'upload' ? (
        <Card>
          {proofName ? <Text style={styles.body}>Uploaded {proofName}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={status === 'pending' ? 'Upload proof' : 'Replace proof'}
            onPress={() => {
              void pickEvidence()
                .then((file) => {
                  if (!file) return;
                  setError(uploadOnboardingProof(item.id, file));
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
            }}
          />
          {status === 'uploaded' ? (
            <Button label="Record agent confirmation" tone="outline" onPress={() => confirmOnboarding(item.id)} />
          ) : null}
        </Card>
      ) : (
        <Button
          label={status === 'completed' ? 'Completed' : 'Mark this step done'}
          onPress={() => confirmOnboarding(item.id)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  amount: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
});
