import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { downloadAuthedPdf } from '@/src/api/files';
import { pickEvidence } from '@/src/api/pick-evidence';
import { ONBOARDING_LABEL, ONBOARDING_STEPS } from '@/src/demo/applications';
import { KeyCollectionForm } from '@/src/flows/key-collection';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen, Tag } from '@/src/ui/ui';

export default function OnboardingStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepId = Array.isArray(step) ? step[0] : step;
  const item = ONBOARDING_STEPS.find((entry) => entry.id === stepId);
  const { onboarding, onboardingProofs, onboardingAmounts, uploadOnboardingProof, confirmOnboarding } = useDemo();
  const proofName = item ? onboardingProofs[item.id] ?? '' : '';
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const amount = item ? onboardingAmounts[item.id] ?? item.amount : undefined;

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
      {amount ? (
        <Card>
          <Text style={styles.kicker}>Amount</Text>
          <Text style={styles.amount}>{money(amount)}</Text>
          <Text style={styles.body}>Pay this to the account your agent gives you, then upload the receipt. CROSSUB confirms it on the tenancy.</Text>
        </Card>
      ) : null}
      {item.id === 'bond' ? (
        <Notice>The deposit holds the property. The bond is the security amount, usually lodged with the rental bond authority.</Notice>
      ) : null}
      {item.id === 'lease_signing' ? (
        <Card>
          {downloadError ? <Text style={styles.error}>{downloadError}</Text> : null}
          <Button
            label="Download tenancy agreement"
            tone="outline"
            onPress={() => {
              setDownloadError(null);
              void downloadAuthedPdf('/api/v1/tenant/leasing/onboarding/agreement.pdf', 'tenancy-agreement.pdf').catch((err) =>
                setDownloadError(err instanceof Error ? err.message : 'Could not download the agreement'),
              );
            }}
          />
          <Button
            label={status === 'completed' ? 'Signing recorded' : 'I have signed the agreement'}
            onPress={() => confirmOnboarding('lease_signing')}
          />
        </Card>
      ) : null}
      {item.id === 'key_pickup' ? <KeyCollectionForm /> : null}
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
          {status === 'uploaded' ? <Notice>Proof is with your property manager. This step completes when they confirm it.</Notice> : null}
        </Card>
      ) : null}
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
