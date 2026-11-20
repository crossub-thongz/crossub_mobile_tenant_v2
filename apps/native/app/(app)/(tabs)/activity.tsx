import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { inspectionPath } from '@/src/api/load-account';
import { STATUS_LABEL } from '@/src/demo/applications';
import type { ActivityFilter } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, Screen, TabHeader, Tag } from '@/src/ui/ui';

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Action Required', label: 'Action Required' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'History', label: 'Completed' },
];
const CLOSED_INSPECTION = new Set(['COMPLETED', 'PUBLISHED', 'CANCELLED']);
const CLOSED_REPAIR = new Set(['COMPLETED', 'CANCELLED']);

type ActivityItem = {
  key: string;
  name: string;
  detail: string;
  kind: ActivityFilter;
  type: string;
  href: string;
  currentOnly: boolean;
};

function statusLabel(status: string): string {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export default function ActivityScreen() {
  const router = useRouter();
  const demo = useDemo();
  const items: ActivityItem[] = [];
  const selfInspectionId = demo.routineAction?.flow === 'self' && demo.routineAction.actionRequired ? demo.routineAction.id : null;

  for (const inspection of demo.inspections) {
    if (inspection.status === 'DRAFT') continue;
    const closed = CLOSED_INSPECTION.has(inspection.status.toUpperCase());
    const needsAction = demo.routineAction?.id === inspection.id;
    items.push({
      key: `inspection-${inspection.id}`,
      name: inspection.title,
      detail: [statusLabel(inspection.status), inspection.when].filter(Boolean).join(' · '),
      kind: needsAction ? 'Action Required' : closed ? 'History' : 'In Progress',
      type: 'Inspection',
      href: inspectionPath(inspection.type, inspection.id, selfInspectionId),
      currentOnly: !closed,
    });
  }

  if (demo.routineAction && !demo.inspections.some((item) => item.id === demo.routineAction?.id)) {
    items.push({
      key: `routine-${demo.routineAction.id}`,
      name: 'Routine inspection',
      detail: [statusLabel(demo.routineAction.status), demo.routineAction.scheduledAt?.slice(0, 10)].filter(Boolean).join(' · '),
      kind: 'Action Required',
      type: 'Inspection',
      href: demo.routineAction.flow === 'self' && demo.routineAction.actionRequired ? '/flow/self-inspection' : `/flow/inspection?id=${demo.routineAction.id}`,
      currentOnly: true,
    });
  }

  for (const application of demo.applications) {
    if (!application.isRenewal) continue;
    const closed = application.status === 'approved' || application.status === 'declined';
    items.push({
      key: `renewal-${application.id}`,
      name: 'Lease renewal',
      detail: `${application.propertyAddress} · ${STATUS_LABEL[application.status]}`,
      kind: application.status === 'missing_information' ? 'Action Required' : closed ? 'History' : 'In Progress',
      type: 'Leasing',
      href: '/flow/renewal',
      currentOnly: !closed,
    });
  }

  const keyDone = demo.onboarding.key_pickup === 'completed';
  const keyDetail = demo.keyCollection?.time
    ? `Collection ${demo.keyCollection.time.slice(0, 16).replace('T', ' ')}`
    : demo.vacating?.keysReturnAddress
      ? `Return keys to ${demo.vacating.keysReturnAddress}`
      : demo.keyReturnSubmitted
        ? 'Key return submitted'
        : keyDone
          ? 'Key collection recorded'
          : demo.vacating?.keysReturned
            ? 'Keys returned'
            : '';
  if (keyDetail) {
    items.push({
      key: 'keys',
      name: 'Keys',
      detail: keyDetail,
      kind: keyDone || demo.keyReturnSubmitted || demo.vacating?.keysReturned ? 'History' : 'Action Required',
      type: 'Key Handover',
      href: '/flow/keys',
      currentOnly: true,
    });
  }

  for (const repair of demo.maintenance) {
    const closed = CLOSED_REPAIR.has(repair.status);
    const needsAction = repair.completionApprovalPending || repair.scheduleApprovalPending || repair.responsibilityAckRequired;
    items.push({
      key: `repair-${repair.id}`,
      name: repair.title,
      detail: statusLabel(repair.status),
      kind: needsAction ? 'Action Required' : closed ? 'History' : 'In Progress',
      type: 'Maintenance',
      href: `/flow/maintenance?job=${repair.id}`,
      currentOnly: !closed,
    });
  }

  if (demo.vacating && demo.terminationStarted) {
    const settled = demo.vacating.settlementStatus === 'accepted';
    items.push({
      key: `vacating-${demo.vacating.id}`,
      name: 'Moving out',
      detail: demo.vacating.vacateDate ? `Vacate ${demo.vacating.vacateDate}` : demo.vacating.reason,
      kind: settled ? 'History' : 'In Progress',
      type: 'Vacating',
      href: '/termination',
      currentOnly: !settled,
    });
  }

  const visible = items.filter((item) => (demo.current || !item.currentOnly) && (demo.activityFilter === 'All' || item.kind === demo.activityFilter));

  return (
    <Screen tab>
      <TabHeader kicker="" title="Activity" />
      <View style={styles.pills}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            onPress={() => demo.setActivityFilter(filter.id)}
            style={[styles.pill, demo.activityFilter === filter.id && styles.pillOn]}
          >
            <Text style={[styles.pillText, demo.activityFilter === filter.id && styles.pillTextOn]}>{filter.label}</Text>
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
          <Card key={item.key} onPress={() => router.push(item.href)}>
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
