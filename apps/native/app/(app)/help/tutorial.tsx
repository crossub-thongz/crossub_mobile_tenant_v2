import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen } from '@/src/ui/ui';

const STEPS = [
  ['Home', 'Summary cards for the property, inspections, repairs, rent, and messages.'],
  ['Property', 'Your lease address, rent, and key dates.'],
  ['Repairs', 'Report an issue and follow it until the work is done.'],
  ['Rent review', 'When a notice arrives, read the proposed rent and respond from the app.'],
  ['New tenants', 'Apply from a listing, finish onboarding, collect keys, then confirm the ingoing report.'],
];

export default function TutorialScreen() {
  const router = useRouter();
  const { finishTutorial } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.title}>How to use the app</Text>
      <Text style={styles.body}>A short tour for a new registration.</Text>
      {STEPS.map(([title, body], index) => (
        <Card key={title}>
          <Text style={styles.item}>
            {index + 1}. {title}
          </Text>
          <Text style={styles.body}>{body}</Text>
        </Card>
      ))}
      <Button
        label="Got it — go to Home"
        onPress={() => {
          finishTutorial();
          router.replace('/');
        }}
      />
      <Button label="I'm looking for a property" tone="outline" onPress={() => router.push('/listings')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
