import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ONBOARDING_LABEL, ONBOARDING_STEPS } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Notice, Screen, Tag } from '@/src/ui/ui';

export default function OnboardingScreen() {
  const router = useRouter();
  const { onboarding, applications, onboardingActive, onboardingComplete, onboardingStepIds } = useDemo();
  const steps = ONBOARDING_STEPS.filter((step) => onboardingStepIds.includes(step.id));
  const approved = applications.find((item) => item.status === 'approved');
  const done = steps.filter((step) => onboarding[step.id] === 'completed').length;

  return (
    <Screen>
      <BackButton fallback="/profile" />
      <Text style={styles.title}>Onboarding</Text>
      {onboardingComplete ? (
        <Notice>Move-in checklist is complete.</Notice>
      ) : null}
      {!onboardingComplete && !onboardingActive ? <Notice>No move-in checklist is open on this account.</Notice> : null}
      {onboardingActive && approved ? (
      <Text style={styles.body}>{`Approved for ${approved.propertyAddress}.`}</Text>
      ) : null}
      {steps.length > 0 ? (
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${steps.length === 0 ? 0 : (done / steps.length) * 100}%` }]} />
      </View>
      ) : null}
      {steps.length > 0 ? (
      <Text style={styles.body}>
        {done}/{steps.length} complete
      </Text>
      ) : null}
      {steps.length > 0 ? steps.map((step, index) => (
        <Card key={step.id} onPress={() => router.push(`/onboarding/${step.id}`)}>
          <Text style={styles.step}>Step {index + 1}</Text>
          <Text style={styles.address}>{step.title}</Text>
          <Text style={styles.body}>{step.description}</Text>
          <Tag label={ONBOARDING_LABEL[onboarding[step.id]]} tone={onboarding[step.id] === 'completed' ? 'green' : onboarding[step.id] === 'uploaded' ? 'amber' : 'neutral'} />
        </Card>
      )) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  step: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 99, backgroundColor: colors.greenSoft, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.green },
});
