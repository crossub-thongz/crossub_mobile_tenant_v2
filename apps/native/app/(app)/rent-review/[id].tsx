import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

export default function RentReviewDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reviewId = Array.isArray(id) ? id[0] : id;
  const demo = useDemo();
  const [counter, setCounter] = useState('');
  const [moveOut, setMoveOut] = useState(demo.rentReviewMoveOut);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState(false);

  const review = demo.rentReview;
  if (!review || (reviewId && reviewId !== review.id)) {
    return (
      <Screen>
        <BackButton fallback="/rent-review" />
        <Text style={styles.body}>Notice not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton fallback="/rent-review" />
      <Text style={styles.kicker}>NOTICE OF RENT REVIEW</Text>
      <Text style={styles.title}>{review.address}</Text>
      <Card>
        <Text style={styles.body}>Current rent {money(review.currentRent)} / week</Text>
        <Text style={styles.amount}>{money(review.proposedRent)} / week</Text>
        <Text style={styles.body}>Effective {review.effective || 'the date on the notice'}</Text>
      </Card>
      <Notice>Accepting records your answer. It does not sign a lease extension. The agreement arrives separately.</Notice>
      {demo.rentReviewStatus === 'pending' ? (
        <>
          <Button label="Accept the increase" onPress={demo.acceptRentReview} />
          {review.negotiable ? (
            <Card>
              <Field label="Ask for a different weekly rent">
                <Input value={counter} onChangeText={setCounter} keyboardType="decimal-pad" placeholder="1240" />
              </Field>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label="Send counter-offer"
                tone="outline"
                onPress={() => setError(demo.counterRentReview(Number(counter.replace(/[^0-9.]/g, ''))))}
              />
            </Card>
          ) : null}
          <Button label={dispute ? 'Hide tribunal note' : 'The increase may be excessive'} tone="secondary" onPress={() => setDispute((value) => !value)} />
          {dispute ? (
            <Notice>Applying to NCAT is your own step. This app records nothing when you read this note.</Notice>
          ) : null}
          <Card>
            <Field label="If you are leaving, vacate date">
              <Input value={moveOut} onChangeText={setMoveOut} placeholder="19 Dec 2026" />
            </Field>
            <Button
              label="Give notice to vacate"
              tone="outline"
              onPress={() => {
                const message = demo.vacateFromRentReview(moveOut);
                setError(message);
                if (!message) router.push('/move-out-services');
              }}
            />
          </Card>
        </>
      ) : null}
      {demo.rentReviewStatus === 'accepted' ? <Notice>Rent increase accepted. Your property manager will send the lease extension when it is ready.</Notice> : null}
      {demo.rentReviewStatus === 'countered' && demo.rentReviewCounter ? (
        <Notice>{`Counter-offer of ${money(demo.rentReviewCounter)} / week is with your property manager.`}</Notice>
      ) : null}
      {demo.rentReviewStatus === 'vacating' ? (
        <Notice>{`Notice to vacate recorded for ${demo.rentReviewMoveOut}. Continue with move-out services.`}</Notice>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  amount: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
