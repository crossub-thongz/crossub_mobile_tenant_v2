import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { formatDisplayDate } from '@/src/api/dates';
import { CLEANING } from '@/src/flows/lifecycle';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Choice, Notice, Screen } from '@/src/ui/ui';

export default function MoveOutServicesScreen() {
  const router = useRouter();
  const demo = useDemo();
  const open = demo.terminationStarted || demo.rentReviewStatus === 'vacating';

  return (
    <Screen>
      <BackButton fallback="/flow/vacating" />
      <Text style={styles.title}>Move-out services</Text>
      {open ? (
        CLEANING.map((option) => (
          <Choice key={option.id} title={option.id} body={option.body} selected={demo.cleaning === option.id} onPress={() => demo.setCleaning(option.id)} />
        ))
      ) : (
        <Notice>No vacating date.</Notice>
      )}
      {demo.vacating?.id ? (
        demo.vacating.movingReferralRequestedAt ? (
          <Notice>{`A moving referral was requested${referralWhen(demo.vacating.movingReferralRequestedAt)}.`}</Notice>
        ) : (
          <Button label="Ask for a moving referral" onPress={() => demo.requestMoving()} />
        )
      ) : (
        <Notice>No vacating case.</Notice>
      )}
      <Button label="Back to vacating steps" tone="outline" onPress={() => router.dismissTo('/flow/vacating')} />
    </Screen>
  );
}

function referralWhen(iso: string): string {
  const date = formatDisplayDate(iso);
  return date ? ` on ${date}` : '';
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  row: { gap: 4, paddingVertical: 8 },
});
