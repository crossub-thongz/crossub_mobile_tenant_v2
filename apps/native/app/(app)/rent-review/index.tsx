import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen, Tag } from '@/src/ui/ui';

const LABEL = {
  pending: 'Response needed',
  accepted: 'Accepted',
  countered: 'Counter-offer sent',
  vacating: 'Notice to vacate',
} as const;

export default function RentReviewListScreen() {
  const router = useRouter();
  const { rentReviewStatus, rentReview } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/" />
      <Text style={styles.title}>Rent review</Text>
      <Text style={styles.body}>Notices your property manager has sent. Nothing is here until a notice is issued.</Text>
      {rentReview ? (
        <Card onPress={() => router.push(`/rent-review/${rentReview.id}`)}>
          <Text style={styles.address}>{rentReview.address}</Text>
          <Text style={styles.body}>
            {money(rentReview.currentRent)} → {money(rentReview.proposedRent)} / week
          </Text>
          <Text style={styles.body}>Effective {rentReview.effective || 'the date on the notice'}</Text>
          <Tag label={LABEL[rentReviewStatus]} tone={rentReviewStatus === 'pending' ? 'amber' : 'green'} />
        </Card>
      ) : (
        <Card>
          <Text style={styles.body}>No rent review is open on this account.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
