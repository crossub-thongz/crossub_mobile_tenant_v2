import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActivityFilter } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, Screen, TabHeader, Tag } from '@/src/ui/ui';

const FILTERS: ActivityFilter[] = ['Action Required', 'In Progress', 'History'];

export default function ActivityScreen() {
  const router = useRouter();
  const demo = useDemo();
  const items = [
    {
      name: 'Routine inspection',
      detail: demo.inspectionConfirmed ? 'Scheduled · 12 Nov' : 'Confirm attendance',
      kind: demo.inspectionConfirmed ? 'In Progress' : 'Action Required',
      type: 'Inspection',
      href: '/flow/inspection',
      currentOnly: true,
    },
    {
      name: 'Lease renewal',
      detail: demo.renewalResponded ? 'Response submitted' : 'Review renewal offer',
      kind: demo.renewalResponded ? 'In Progress' : 'Action Required',
      type: 'Leasing',
      href: '/flow/renewal',
      currentOnly: true,
    },
    {
      name: 'Key collection',
      detail: demo.vacating?.keysReturnAddress
        ? `Return keys to ${demo.vacating.keysReturnAddress}`
        : demo.keyCollection?.time
          ? `Collection ${demo.keyCollection.time.slice(0, 16).replace('T', ' ')}`
          : demo.onboarding.key_pickup === 'completed'
            ? 'Key collection recorded'
            : demo.keyReturnSubmitted
              ? 'Key return submitted'
              : 'Confirm key collection or return',
      kind: demo.onboarding.key_pickup === 'completed' || demo.keyReturnSubmitted ? 'In Progress' : 'Action Required',
      type: 'Key Handover',
      href: '/flow/keys',
      currentOnly: true,
    },
    {
      name: 'Kitchen tap repair',
      detail: 'Contractor scheduling',
      kind: 'In Progress',
      type: 'Maintenance',
      href: '/flow/maintenance',
      currentOnly: true,
    },
    {
      name: 'Moving out checklist',
      detail: 'Cleaning and final inspection',
      kind: 'In Progress',
      type: 'Vacating',
      href: '/flow/vacating',
      currentOnly: true,
    },
    ...demo.maintenance.map((item) => ({
      name: item.title,
      detail: 'Submitted · Under review',
      kind: 'In Progress' as const,
      type: 'Maintenance',
      href: '/flow/maintenance',
      currentOnly: true,
    })),
    {
      name: 'Entry condition report',
      detail: demo.entryAcknowledged ? 'Acknowledged by you' : 'Published PDF',
      kind: 'History',
      type: 'Inspection',
      href: '/flow/entry',
      currentOnly: false,
    },
  ].filter((item) => (demo.current ? true : !item.currentOnly));

  const visible = items.filter((item) => item.kind === demo.activityFilter);

  return (
    <Screen tab>
      <TabHeader kicker="YOUR RENTAL JOURNEY" title="Activity" />
      <View style={styles.pills}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            accessibilityRole="button"
            onPress={() => demo.setActivityFilter(filter)}
            style={[styles.pill, demo.activityFilter === filter && styles.pillOn]}
          >
            <Text style={[styles.pillText, demo.activityFilter === filter && styles.pillTextOn]}>{filter}</Text>
          </Pressable>
        ))}
      </View>
      <Card onPress={() => router.push('/flow/properties')}>
        <Text style={styles.muted}>{demo.property.title}</Text>
        <Text style={styles.link}>Change property</Text>
      </Card>
      {visible.length === 0 ? (
        <Text style={styles.empty}>Nothing in {demo.activityFilter.toLowerCase()} for this tenancy.</Text>
      ) : (
        visible.map((item) => (
          <Card key={`${item.type}-${item.name}`} onPress={() => router.push(item.href)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.muted}>{item.detail}</Text>
            <Tag label={item.type} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: '#78857b', fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
  muted: { color: colors.muted, fontSize: 12 },
  link: { color: colors.green, fontWeight: '700', fontSize: 12, marginTop: 6 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  empty: { color: '#8b9b90', textAlign: 'center', padding: 24 },
});
