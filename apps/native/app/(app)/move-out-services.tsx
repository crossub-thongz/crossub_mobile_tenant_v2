import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

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
      <Text style={styles.body}>After a move-out date is confirmed, Crossub can arrange optional services. A request is not a booked quote.</Text>
      {open ? (
        CLEANING.map((option) => (
          <Choice key={option.id} title={option.id} body={option.body} selected={demo.cleaning === option.id} onPress={() => demo.setCleaning(option.id)} />
        ))
      ) : (
        <Notice>End-of-lease cleaning can be arranged once a vacating date is confirmed.</Notice>
      )}
      <Pressable accessibilityRole="button" onPress={demo.requestMoving} style={styles.row}>
        <Text style={styles.item}>{demo.movingRequested ? 'Moving service requested' : 'Request a moving service'}</Text>
        <Text style={styles.body}>Partner referral. A quote comes back separately.</Text>
      </Pressable>
      <Button label={demo.movingRequested ? 'Request sent' : 'Send moving request'} onPress={demo.requestMoving} />
      <Button label="Back to vacating steps" tone="outline" onPress={() => router.push('/flow/vacating')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  row: { gap: 4, paddingVertical: 8 },
});
