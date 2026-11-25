import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen } from '@/src/ui/ui';

const STEPS = ['Your property', 'Onboarding checklist', 'Upload proofs', 'Move-in inspection', 'Day-to-day tenancy'];

export default function GuideScreen() {
  const router = useRouter();
  const { applications, finishGuide } = useDemo();
  const approved = applications.find((item) => item.status === 'approved');

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.title}>Welcome to your tenancy</Text>
      {approved ? <Text style={styles.body}>{`Approved for ${approved.propertyAddress}.`}</Text> : null}
      {STEPS.map((title) => (
        <Card key={title}>
          <Text style={styles.item}>{title}</Text>
        </Card>
      ))}
      <Button
        label="Continue to the checklist"
        onPress={() => {
          finishGuide();
          router.push('/onboarding');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
