import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen } from '@/src/ui/ui';

const STEPS = [
  ['Your property', 'After approval, the leased address appears with rent and key dates.'],
  ['Onboarding checklist', 'Deposit, bond, lease signing, and key collection stay in order.'],
  ['Upload proofs', 'Send the deposit and bond receipts when they are requested.'],
  ['Move-in inspection', 'Confirm the ingoing report when your agent schedules it.'],
  ['Day-to-day tenancy', 'Repairs, accounting, and messages are for after you have moved in.'],
];

export default function GuideScreen() {
  const router = useRouter();
  const { applications, finishGuide } = useDemo();
  const approved = applications.find((item) => item.status === 'approved');

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.title}>Welcome to your tenancy</Text>
      <Text style={styles.body}>
        {approved
          ? `You have been approved for ${approved.propertyAddress}. These are the move-in steps.`
          : 'This is how move-in works once an application is approved.'}
      </Text>
      {STEPS.map(([title, body]) => (
        <Card key={title}>
          <Text style={styles.item}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
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
