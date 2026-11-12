import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { InboxFilter } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, Screen, Section, TabHeader, Tag } from '@/src/ui/ui';

const FILTERS: InboxFilter[] = ['All', 'Unread', 'Maintenance', 'Inspection', 'Leasing', 'General'];

export default function InboxScreen() {
  const router = useRouter();
  const demo = useDemo();
  const threads = demo.threads.filter((thread) => {
    if (demo.inboxFilter === 'All') return true;
    if (demo.inboxFilter === 'Unread') return Boolean(thread.unread);
    return thread.category === demo.inboxFilter;
  });

  return (
    <Screen tab>
      <TabHeader kicker="MESSAGES & SUPPORT" title="Inbox" />
      <Card soft onPress={() => router.push('/flow/cros')}>
        <Text style={styles.title}>Ask Cros</Text>
        <Text style={styles.muted}>AI assistant. Human handover when a decision is needed.</Text>
      </Card>
      <Section
        title="Conversations"
        action={
          <Pressable accessibilityRole="button" accessibilityLabel="New message" onPress={() => router.push('/flow/new-message')}>
            <Text style={styles.link}>New</Text>
          </Pressable>
        }
      />
      <View style={styles.pills}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            accessibilityRole="button"
            onPress={() => demo.setInboxFilter(filter)}
            style={[styles.pill, demo.inboxFilter === filter && styles.pillOn]}
          >
            <Text style={[styles.pillText, demo.inboxFilter === filter && styles.pillTextOn]}>{filter}</Text>
          </Pressable>
        ))}
      </View>
      {threads.map((thread) => (
        <Card key={thread.id} onPress={() => router.push(thread.route)}>
          <View style={styles.between}>
            <Text style={styles.title}>{thread.subject}</Text>
            <Text style={styles.muted}>Today</Text>
          </View>
          <Text style={styles.muted}>{thread.preview}</Text>
          <Tag label={thread.category} tone={thread.status === 'Completed' ? 'green' : 'neutral'} />
        </Card>
      ))}
      <Card onPress={() => router.push('/flow/completed-chat')}>
        <Text style={styles.title}>Completed conversation</Text>
        <Text style={styles.muted}>Closed by your manager. Replies are locked.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  link: { color: colors.green, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: '#78857b', fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
