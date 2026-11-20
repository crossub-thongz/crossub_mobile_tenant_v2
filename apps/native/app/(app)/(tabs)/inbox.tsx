import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { messageWhen, type InboxFilter } from '@/src/demo/model';
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
      <TabHeader kicker="" title="Inbox" />
      <Pressable accessibilityRole="button" onPress={() => router.push('/flow/cros')} style={styles.cros}>
        <Image source={require('@/assets/brand/cros.png')} style={styles.crosIcon} />
        <Text style={styles.crosText}>ASK CROS ANYTHING!</Text>
      </Pressable>
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
            <Text style={styles.subject}>{thread.subject}</Text>
            <View style={styles.whenCol}>
              <Text style={styles.when}>{messageWhen(thread.lastAt)}</Text>
              {thread.unread ? <View style={styles.unread} /> : null}
            </View>
          </View>
          <Text style={styles.muted}>{thread.preview}</Text>
          <Tag label={thread.category} tone={thread.status === 'Completed' ? 'green' : 'neutral'} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cros: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111', borderRadius: 28, paddingVertical: 8, paddingHorizontal: 10 },
  crosIcon: { width: 42, height: 42, borderRadius: 21 },
  crosText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  subject: { flexGrow: 1, flexShrink: 1, flexBasis: 0, color: colors.ink, fontSize: 15, fontWeight: '700' },
  whenCol: { alignItems: 'flex-end', gap: 6 },
  when: { flexShrink: 0, color: colors.muted, fontSize: 12, lineHeight: 18 },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  link: { color: colors.green, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: '#78857b', fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
  between: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
});
