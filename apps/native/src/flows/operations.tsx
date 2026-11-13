import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import type { EvidenceFile } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, RowItem, Screen, Tag, TaskHeader, Timeline } from '@/src/ui/ui';

export { SelfInspectionScreen } from '@/src/flows/self-routine';

export function InspectionScreen() {
  const router = useRouter();
  const demo = useDemo();
  const scheduled = demo.inspections[0];
  const status = demo.inspectionConfirmed ? 'Scheduled' : 'Action Required';
  return (
    <Screen>
      <BackButton />
      <TaskHeader title="Routine inspection" status={status} />
      <Card>
        <Text style={styles.kicker}>IN-PERSON INSPECTION</Text>
        <Text style={styles.title}>{scheduled?.when || 'No inspection is scheduled'}</Text>
        <Text style={styles.muted}>{scheduled ? `${scheduled.title} · ${scheduled.status}` : 'Your property manager has not booked one yet.'}</Text>
        <Text style={styles.body}>Conducted by {demo.scenario.team}</Text>
        <Text style={styles.body}>Access: contact tenant before entry</Text>
      </Card>
      {demo.inspectionConfirmed ? (
        <Notice>You confirmed this arrangement. Confirmation is not a blanket permission to enter.</Notice>
      ) : (
        <View style={styles.stack}>
          <Button label="Confirm attendance" onPress={demo.confirmInspection} />
          <Button label="Request reschedule" tone="secondary" onPress={() => router.push('/flow/reschedule')} />
        </View>
      )}
      <Timeline status={status} />
      <Button label="Open conversation" tone="outline" onPress={() => router.push('/flow/conversation')} />
    </Screen>
  );
}

export function RescheduleScreen() {
  const router = useRouter();
  const { notify } = useDemo();
  const [reason, setReason] = useState('');
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Request reschedule</Text>
      <Text style={styles.muted}>The current appointment stays in place until the responsible party sets a new time.</Text>
      <Card>
        <Field label="Preferred date">
          <Input value="14 Nov 2026" editable={false} />
        </Field>
        <Field label="Time window">
          <Input value="Morning · 9 AM–12 PM" editable={false} />
        </Field>
        <Field label="Reason">
          <Input multiline value={reason} onChangeText={setReason} placeholder="Tell us why the current time does not work" />
        </Field>
        <Button
          label="Submit request"
          onPress={() => {
            notify('Reschedule request submitted');
            router.replace('/flow/inspection');
          }}
        />
      </Card>
    </Screen>
  );
}

export function InspectionsScreen() {
  const router = useRouter();
  const demo = useDemo();
  const rows = [
    ...demo.inspections.map((item) => [item.title, item.when || item.status, '/flow/inspection'] as const),
    ['Routine inspection', 'Confirm or reschedule', '/flow/inspection'],
    ['Routine self-inspection', 'Photograph the rooms and submit', '/flow/self-inspection'],
    ['Entry condition report', 'Your own acknowledgement', '/flow/entry'],
    ['Final inspection', 'Respond to each finding', '/flow/final'],
    ['Open inspection', 'View notice', '/flow/open-inspection'],
  ] as const;
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Inspections</Text>
      <Card>
        {rows.map(([title, subtitle, href]) => (
          <RowItem key={title} icon="clipboard-outline" title={title} subtitle={subtitle} onPress={() => router.push(href)} />
        ))}
      </Card>
    </Screen>
  );
}

export function EntryScreen() {
  const demo = useDemo();
  return (
    <Screen>
      <BackButton />
      <TaskHeader title="Entry condition report" status={demo.entryAcknowledged ? 'Completed' : 'Action Required'} />
      <Card>
        <Text style={styles.title}>Entry condition report</Text>
        <Text style={styles.muted}>PDF · Version 1</Text>
      </Card>
      <Notice>Acknowledgement confirms that you received this version. It is not agreement with the condition, and it does not acknowledge the report for anyone else on the tenancy.</Notice>
      <Button
        label={demo.entryAcknowledged ? 'Acknowledged' : 'Acknowledge receipt'}
        onPress={() => {
          if (!demo.entryAcknowledged) demo.acknowledgeEntry();
        }}
      />
    </Screen>
  );
}

export function OpenInspectionScreen() {
  const router = useRouter();
  const { scenario } = useDemo();
  return (
    <Screen>
      <BackButton />
      <TaskHeader title="Open inspection" status="Scheduled" />
      <Card>
        <Text style={styles.title}>Saturday, 14 November 2026</Text>
        <Text style={styles.body}>10:00 AM – 10:30 AM</Text>
        <Text style={styles.muted}>Conducted by {scenario.team}</Text>
      </Card>
      <Button label="Request change" tone="secondary" onPress={() => router.push('/flow/reschedule')} />
      <Notice>A change request does not move the published time. The manager updates the notice.</Notice>
    </Screen>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [issue, setIssue] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photos, setPhotos] = useState<EvidenceFile[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Log a repair</Text>
      <Text style={styles.muted}>Describe the problem and attach at least one photo or video. A tracking number is issued when the report is accepted.</Text>
      <Card>
        <Field label="What needs repairing?">
          <Input multiline value={issue} onChangeText={setIssue} placeholder="Kitchen tap is leaking under the sink" />
        </Field>
        <Button
          label="Add photo or video"
          tone="secondary"
          onPress={() => {
            void pickEvidence()
              .then((file) => {
                if (file) setPhotos((current) => [...current, file]);
              })
              .catch((err) => demo.notify(err instanceof Error ? err.message : 'Could not open the photo library'));
          }}
        />
        {photos.map((file) => (
          <Text key={`${file.fileName}-${file.sizeBytes ?? 0}`} style={styles.muted}>{file.fileName}</Text>
        ))}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: urgent }} onPress={() => setUrgent((value) => !value)} style={styles.check}>
          <Text style={styles.body}>{urgent ? 'Urgent flag on' : 'Mark as urgent'}</Text>
        </Pressable>
        <Button
          label={busy ? 'Submitting' : 'Submit maintenance report'}
          onPress={() => {
            if (busy) return;
            setBusy(true);
            void demo.addMaintenance(issue, urgent, photos, '').then((tracking) => {
              setBusy(false);
              if (tracking) router.replace('/flow/maintenance');
            });
          }}
        />
      </Card>
      <Notice>If there is immediate danger, contact emergency services. Submitting here does not wait for AI triage.</Notice>
    </Screen>
  );
}

export function MaintenanceScreen() {
  const router = useRouter();
  const latest = useDemo().maintenance[0];
  const title = latest?.title ?? 'No repair on this tenancy';
  const tracking = latest?.tracking ?? '';
  return (
    <Screen>
      <BackButton />
      <TaskHeader title={title} status="In Progress" />
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.muted}>{[tracking, latest?.category, latest?.urgent ? 'Urgent' : ''].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.body}>{latest ? `${latest.status}. Internal quote notes stay off this screen.` : 'Repairs you submit appear here from your tenancy.'}</Text>
        {latest?.photos.map((name) => (
          <Text key={name} style={styles.muted}>Photo · {name}</Text>
        ))}
        {latest?.video ? <Text style={styles.muted}>Video · {latest.video}</Text> : null}
      </Card>
      <Card>
        <Text style={styles.kicker}>BUILDING</Text>
        <Text style={styles.title}>{latest?.buildingName || latest?.managerName || 'No building contact on this repair'}</Text>
        {latest?.managerPhone ? <Button label={latest.managerPhone} tone="outline" onPress={() => Linking.openURL(`tel:${latest.managerPhone.replace(/\s/g, '')}`)} /> : null}
        {latest?.managerEmail ? <Button label={latest.managerEmail} tone="outline" onPress={() => Linking.openURL(`mailto:${latest.managerEmail}`)} /> : null}
        <Button label="Message the contractor" tone="secondary" onPress={() => router.push('/flow/new-message')} />
      </Card>
      <Card>
        <Text style={styles.kicker}>STRATA</Text>
        <Text style={styles.title}>{latest?.strataName || 'No strata contact on this repair'}</Text>
        {latest?.strataPlan ? <Text style={styles.muted}>{latest.strataPlan}</Text> : null}
        {latest?.strataPhone ? <Button label={latest.strataPhone} tone="outline" onPress={() => Linking.openURL(`tel:${latest.strataPhone.replace(/\s/g, '')}`)} /> : null}
        {latest?.strataEmail ? <Button label={latest.strataEmail} tone="outline" onPress={() => Linking.openURL(`mailto:${latest.strataEmail}`)} /> : null}
      </Card>
      <View style={styles.stack}>
        <Button label="Message your agent" onPress={() => router.push('/flow/conversation?thread=tap')} />
        <Button label="Respond to proposed time" tone="secondary" onPress={() => router.push('/flow/appointment')} />
      </View>
      <Timeline status="Arranging repair" />
      <Notice>When the contractor finishes, you confirm whether the issue is resolved. Silence does not close the request.</Notice>
    </Screen>
  );
}

export function AppointmentScreen() {
  const router = useRouter();
  const { notify, maintenance } = useDemo();
  const job = maintenance.find((item) => item.scheduleApprovalPending) ?? maintenance[0];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Repair appointment</Text>
      <Card>
        <Tag label="Action Required" tone="amber" />
        <Text style={styles.title}>Contractor proposes</Text>
        <Text style={styles.body}>{job?.scheduleProposedTimes || 'No time has been proposed yet.'}</Text>
        <Button
          label="Confirm appointment"
          onPress={() => {
            if (!job) return;
            void import('@/src/api/tenant').then(({ tenantApi }) =>
              tenantApi.respondSchedule(job.id, 'approved').then(() => {
                notify('Appointment confirmed');
                router.replace('/flow/maintenance');
              }).catch((err) => notify(err instanceof Error ? err.message : 'Could not confirm the time')),
            );
          }}
        />
        <Button label="Request another time" tone="secondary" onPress={() => router.push('/flow/reschedule')} />
      </Card>
      <Notice>Confirming a time does not give unrestricted access. Your access preference stays on the request.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  stack: { gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  check: { minHeight: 44, justifyContent: 'center' },
});
