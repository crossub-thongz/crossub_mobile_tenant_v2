import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme';
import { Card, Notice, Screen } from '@/src/ui/ui';

const STEPS = [
  'An invitation is sent only after the tenancy is confirmed. Draft tenancies do not invite anyone.',
  'Each named tenant gets their own email. Accounts are not shared, and a matching email does not merge two people.',
  'A new tenant sets a password and accepts Terms. An existing account accepts the new tenancy instead of creating a second person.',
  'The link is reminded on day 3 and expires on day 7. A resend replaces the previous link.',
];

export default function InviteScreen() {
  return (
    <Screen>
      <Text style={styles.brand}>Invitation</Text>
      <Text style={styles.sub}>Email is the only activation channel in V1.</Text>
      {STEPS.map((step) => (
        <Card key={step}>
          <Text style={styles.body}>{step}</Text>
        </Card>
      ))}
      <Notice>Opening a tenancy from a link still checks person, membership, and the resource on the server. The app does not trust the address in the link.</Notice>
      <Link href="/login" style={styles.link}>
        Back to sign in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  sub: { color: colors.muted, marginBottom: 4 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  link: { color: colors.green, fontWeight: '700', marginTop: 8 },
});
