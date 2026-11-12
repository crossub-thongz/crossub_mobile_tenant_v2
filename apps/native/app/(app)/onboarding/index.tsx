import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ONBOARDING_LABEL, ONBOARDING_STEPS } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen, Tag } from '@/src/ui/ui';

export default function OnboardingScreen() {
  const router = useRouter();
  const { onboarding, applications } = useDemo();
  const approved = applications.find((item) => item.status === 'approved');
  const done = ONBOARDING_STEPS.filter((step) => onboarding[step.id] === 'completed').length;

  return (
    <Screen>
      <BackButton fallback="/profile" />
      <Text style={styles.title}>Onboarding</Text>
      <Text style={styles.body}>
        {approved
          ? `You have been approved for ${approved.propertyAddress}. Complete the move-in checklist below.`
          : 'After an application is approved, the deposit, bond, lease, and key steps appear here.'}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(done / ONBOARDING_STEPS.length) * 100}%` }]} />
      </View>
      <Text style={styles.body}>
        {done}/{ONBOARDING_STEPS.length} complete
      </Text>
      {ONBOARDING_STEPS.map((step, index) => (
        <Card key={step.id} onPress={() => router.push(`/onboarding/${step.id}`)}>
          <Text style={styles.step}>Step {index + 1}</Text>
          <Text style={styles.address}>{step.title}</Text>
          <Text style={styles.body}>{step.description}</Text>
          <Tag label={ONBOARDING_LABEL[onboarding[step.id]]} tone={onboarding[step.id] === 'completed' ? 'green' : onboarding[step.id] === 'uploaded' ? 'amber' : 'neutral'} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  step: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 99, backgroundColor: '#e7eee9', overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.green },
});
