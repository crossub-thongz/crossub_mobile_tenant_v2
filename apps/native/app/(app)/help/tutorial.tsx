import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen } from '@/src/ui/ui';

const STEPS = ['Home', 'Property', 'Repairs', 'Rent review', 'New tenants'];

export default function TutorialScreen() {
  const router = useRouter();
  const { finishTutorial } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.title}>How to use the app</Text>
      {STEPS.map((title, index) => (
        <Card key={title}>
          <Text style={styles.item}>
            {index + 1}. {title}
          </Text>
        </Card>
      ))}
      <Button
        label="Got it — go to Home"
        onPress={() => {
          finishTutorial();
          router.dismissTo('/');
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
