import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useRouter } from 'expo-router';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen } from '@/src/ui/ui';

const SECTIONS = [
  {
    title: 'Account and sign-in',
    items: [
      ['How do I sign in for the first time?', 'Your property manager emails tenant login details after the lease is set up. Use that email and password on the sign-in screen.'],
      ['What if I forget my password?', 'Use Forgot password? on the sign-in screen. The link on this device sets a new password. Email delivery starts when the identity service is connected.'],
      ['Can I browse without an account?', 'Yes. Browse listings and start an application without signing in. Sign in to track an application or manage a tenancy.'],
    ],
  },
  {
    title: 'Applying and move-in',
    items: [
      ['How do I apply?', 'Open a listing and complete the NSW application sections, including the 100-point documents. Submitted applications appear under Applications.'],
      ['What is the onboarding checklist?', 'After approval you pay the deposit and bond, sign the lease, collect keys, and confirm the ingoing report. Each step shows its own instructions.'],
    ],
  },
  {
    title: 'Lease, rent, and repairs',
    items: [
      ['Where is my lease?', 'Property and Tenancy details show the address, rent, and dates. Documents lists the agreement once it is on the tenancy.'],
      ['How do I report a repair?', 'Home has Report issue. The live app will attach photos and a tracking number. This preview keeps a status card.'],
    ],
  },
] as const;

export default function FaqScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(SECTIONS[0].items[0][0]);

  return (
    <Screen>
      <BackButton fallback="/help" />
      <Text style={styles.title}>FAQ</Text>
      <Text style={styles.body}>Answers about sign-in, your lease, repairs, and moving in.</Text>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <Text style={styles.section}>{section.title}</Text>
          {section.items.map(([question, answer]) => (
            <Pressable key={question} accessibilityRole="button" onPress={() => setOpen((current) => (current === question ? null : question))} style={styles.item}>
              <Text style={styles.question}>{question}</Text>
              {open === question ? <Text style={styles.body}>{answer}</Text> : null}
            </Pressable>
          ))}
        </Card>
      ))}
      <Pressable accessibilityRole="button" onPress={() => router.push('/help/tutorial')}>
        <Text style={styles.link}>Open the app tutorial</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/flow/new-message')}>
        <Text style={styles.link}>Send a message</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  section: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  question: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  item: { gap: 4, paddingVertical: 6 },
  link: { color: colors.green, fontWeight: '700' },
});
