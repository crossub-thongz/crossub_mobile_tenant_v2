import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen } from '@/src/ui/ui';

const LINKS = [
  { title: 'FAQ', subtitle: 'Sign-in, applications, rent, and repairs', href: '/help/faq' },
  { title: 'App tutorial', subtitle: 'A short walk through Home, Property, and repairs', href: '/help/tutorial' },
  { title: 'Move-in guide', subtitle: 'What happens after an application is approved', href: '/help/guide' },
  { title: 'System access agreement', subtitle: 'Read and accept before you rely on the portal', href: '/help/agreement' },
  { title: 'Message your property manager', subtitle: 'Anything the guides do not cover', href: '/flow/new-message' },
] as const;

export default function HelpScreen() {
  const router = useRouter();
  const { tutorialDone, agreementName, guideSeen } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/profile" />
      <Text style={styles.title}>Help</Text>
      <Text style={styles.body}>
        Tutorial {tutorialDone ? 'complete' : 'not finished'} · Guide {guideSeen ? 'read' : 'not read'} · Agreement {agreementName ? 'accepted' : 'not accepted'}
      </Text>
      {LINKS.map((item) => (
        <Card key={item.href} onPress={() => router.push(item.href)}>
          <Text style={styles.item}>{item.title}</Text>
          <Text style={styles.body}>{item.subtitle}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  item: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
