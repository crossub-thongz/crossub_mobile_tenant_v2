import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { inspectionPath } from '@/src/api/load-account';
import { captureEvidenceBatch, pickEvidenceMany } from '@/src/api/pick-evidence';
import { tenantApi, type EvidenceFile } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, RowItem, Screen, Tag, TaskHeader, Timeline } from '@/src/ui/ui';

export { SelfInspectionScreen } from '@/src/flows/self-routine';
export { EntryScreen } from '@/src/flows/ingoing-report';

const INSPECTION_TYPE = { ROUTINE: 'ROUTINE', OPEN: 'OPEN' } as const;
const REPAIR_PHOTO_LIMIT = 10;

const ROUTINE_CLOSED = new Set(['completed', 'cancelled', 'COMPLETED', 'CANCELLED', 'PUBLISHED']);

export function InspectionScreen() {
  const router = useRouter();
  const demo = useDemo();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const inspectionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const routines = demo.inspections.filter((item) => item.type === INSPECTION_TYPE.ROUTINE);
  const scheduled = (inspectionId ? routines.find((item) => item.id === inspectionId) ?? demo.inspections.find((item) => item.id === inspectionId) : undefined)
    ?? routines.find((item) => !ROUTINE_CLOSED.has(item.status))
    ?? routines[0];
  const inspectionThread = demo.threads.find((item) => item.category === 'Inspection');
  const closed = scheduled ? ROUTINE_CLOSED.has(scheduled.status) : true;
  const selfVisit = scheduled?.flow === 'self' && scheduled.actionRequired && !closed;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen>
      <BackButton />
      <TaskHeader title={scheduled?.title || 'Routine inspection'} status={scheduled ? statusLabel(scheduled.status) : 'None scheduled'} />
      <Card>
        <Text style={styles.kicker}>{scheduled?.flow === 'self' ? 'SELF INSPECTION' : 'IN-PERSON INSPECTION'}</Text>
        <Text style={styles.title}>{scheduled?.when || 'No inspection is scheduled'}</Text>
        <Text style={styles.muted}>{scheduled ? `${scheduled.address || 'This property'} · ${statusLabel(scheduled.status)}` : 'Your property manager has not booked one on this property yet.'}</Text>
        <Text style={styles.body}>Conducted by {demo.scenario.team}</Text>
      </Card>
      {selfVisit ? <Button label="Complete self-inspection" onPress={() => router.push('/flow/self-inspection')} /> : null}
      {!scheduled || closed || selfVisit ? null : sent ? (
        <Notice>Your attendance message is with your property manager. The appointment time stays until they change it.</Notice>
      ) : (
        <View style={styles.stack}>
          <Button
            label="Tell them I can attend"
            onPress={() => {
              setError(null);
              void tenantApi
                .createMessage({
                  subject: 'Routine inspection',
                  body: `I can attend the routine inspection${scheduled.when ? ` on ${scheduled.when}` : ''}.`,
                  department: 'INSPECTION',
                  ...(demo.propertyUuid ? { propertyId: demo.propertyUuid } : {}),
                })
                .then(() => setSent(true))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not send attendance'));
            }}
          />
          <Button label="Request reschedule" tone="secondary" onPress={() => router.push('/flow/reschedule')} />
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Timeline status={scheduled ? statusLabel(scheduled.status) : 'None scheduled'} />
      <Button
        label={inspectionThread ? 'Open conversation' : 'Message your property manager'}
        tone="outline"
        onPress={() => router.push(inspectionThread?.route ?? '/flow/new-message')}
      />
    </Screen>
  );
}

export function RescheduleScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Request reschedule</Text>
      <Text style={styles.muted}>The current appointment stays in place until your property manager sets a new time. This sends them a message.</Text>
      <Card>
        <Field label="Preferred date">
          <Input value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="Time window">
          <Input value={time} onChangeText={setTime} placeholder="Morning, or a time" />
        </Field>
        <Field label="Reason">
          <Input multiline value={reason} onChangeText={setReason} placeholder="Tell us why the current time does not work" />
        </Field>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={busy ? 'Sending…' : 'Send request'}
          onPress={() => {
            if (busy) return;
            if (!date.trim() || !time.trim() || !reason.trim()) {
              setError('Enter a preferred date, a time, and a reason.');
              return;
            }
            setBusy(true);
            setError(null);
            void tenantApi
              .createMessage({
                subject: 'Reschedule request',
                body: `Preferred date: ${date.trim()}\nTime: ${time.trim()}\n${reason.trim()}`,
                department: 'INSPECTION',
                ...(demo.propertyUuid ? { propertyId: demo.propertyUuid } : {}),
              })
              .then(() => {
                demo.notify('Reschedule request sent to your property manager');
                router.replace('/flow/inspection');
              })
              .catch((err) => {
                setError(err instanceof Error ? err.message : 'Could not send the request');
                setBusy(false);
              });
          }}
        />
      </Card>
    </Screen>
  );
}

export function InspectionsScreen() {
  const router = useRouter();
  const demo = useDemo();
  const selfId = demo.routineAction?.flow === 'self' ? demo.routineAction.id : null;
  const rows = demo.inspections.map((item) => ({
    key: item.id,
    title: item.title,
    subtitle: [item.address, item.when || item.status].filter(Boolean).join(' · '),
    href: inspectionPath(item.type, item.id, selfId),
  }));
  if (selfId && !demo.inspections.some((item) => item.id === selfId)) {
    rows.unshift({
      key: selfId,
      title: 'Routine self-inspection',
      subtitle: 'Photograph the rooms and submit',
      href: '/flow/self-inspection',
    });
  }
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Inspections</Text>
      {rows.length === 0 ? <Notice>No inspection is on this tenancy yet.</Notice> : null}
      {rows.length > 0 ? (
        <Card>
          {rows.map((item) => (
            <RowItem key={item.key} icon="clipboard-outline" title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href)} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

export function OpenInspectionScreen() {
  const router = useRouter();
  const { inspections } = useDemo();
  const opens = inspections.filter((item) => item.type === INSPECTION_TYPE.OPEN);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Open inspection</Text>
      {opens.length === 0 ? <Notice>No open inspection is scheduled on this tenancy.</Notice> : null}
      {opens.map((item) => (
        <Card key={item.id}>
          <Text style={styles.title}>{item.when || 'Date not set'}</Text>
          <Text style={styles.body}>{item.address || item.title}</Text>
          <Text style={styles.muted}>{item.status}</Text>
        </Card>
      ))}
      <Button label="Request change" tone="secondary" onPress={() => router.push('/flow/reschedule')} />
      <Notice>A change request sends a message. It does not move the published time.</Notice>
    </Screen>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [issue, setIssue] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photos, setPhotos] = useState<EvidenceFile[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const properties = demo.tenancies.filter((tenancy, index, all) => {
    if (!tenancy.current || !tenancy.propertyId) return false;
    return all.findIndex((item) => item.propertyId === tenancy.propertyId) === index;
  });
  const selectedPropertyId = properties.length === 1 ? properties[0].propertyId : propertyId;

  function addPhotos(open: () => Promise<EvidenceFile[]>, failure: string) {
    if (picking || busy) return;
    if (photos.length >= REPAIR_PHOTO_LIMIT) {
      demo.notify('10 photos is the maximum.');
      return;
    }
    setPicking(true);
    void open()
      .then((files) => {
        if (files.length === 0) return;
        setPhotos((current) => [...current, ...files].slice(0, REPAIR_PHOTO_LIMIT));
      })
      .catch((err) => demo.notify(err instanceof Error ? err.message : failure))
      .finally(() => setPicking(false));
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Log a repair</Text>
      <Text style={styles.muted}>Describe the problem and attach at least one photo or video, up to 10. A tracking number is issued when the report is accepted.</Text>
      <Card>
        {properties.length === 0 ? <Notice>No current property is on this account.</Notice> : null}
        {properties.length === 1 ? <Text style={styles.body}>Property: {properties[0].address}</Text> : null}
        {properties.length > 1 ? (
          <Field label="Which property?">
            <View style={styles.stack}>
              {properties.map((tenancy) => {
                const selected = selectedPropertyId === tenancy.propertyId;
                return (
                  <Pressable
                    key={tenancy.propertyId}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setPropertyId(tenancy.propertyId)}
                    style={[styles.property, selected && styles.propertyOn]}
                  >
                    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? colors.green : colors.muted} />
                    <View style={styles.grow}>
                      <Text style={styles.propertyTitle}>{tenancy.address}</Text>
                      <Text style={styles.muted}>{tenancy.place || 'Current tenancy'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        ) : null}
        <Field label="What needs repairing?">
          <Input multiline value={issue} onChangeText={setIssue} placeholder="Kitchen tap is leaking under the sink" />
        </Field>
        <View style={styles.stack}>
          <Button
            label={picking ? 'Opening…' : 'Take photos'}
            tone="secondary"
            onPress={() => addPhotos(() => captureEvidenceBatch(REPAIR_PHOTO_LIMIT - photos.length), 'Could not open the camera')}
          />
          <Button
            label="Choose from library"
            tone="secondary"
            onPress={() => addPhotos(() => pickEvidenceMany(REPAIR_PHOTO_LIMIT - photos.length), 'Could not open the photo library')}
          />
        </View>
        <Text style={styles.muted}>
          {photos.length} of {REPAIR_PHOTO_LIMIT}. The camera opens again after each photo until you stop or reach 10.
        </Text>
        {photos.length > 0 ? (
          <View style={styles.thumbs}>
            {photos.map((file, index) => {
              const video = file.mimeType.startsWith('video/');
              const uri = file.previewUri || (file.contentBase64 ? `data:${file.mimeType};base64,${file.contentBase64}` : '');
              return (
                <View key={`${file.previewUri ?? file.fileName}-${index}`} style={styles.thumbWrap}>
                  {video || !uri ? (
                    <View style={styles.thumb}>
                      <Ionicons name="videocam" size={22} color={colors.green} />
                    </View>
                  ) : (
                    <Image source={{ uri }} style={styles.thumb} />
                  )}
                  <Pressable
                    accessibilityLabel={`Remove ${file.fileName}`}
                    onPress={() => setPhotos((current) => current.filter((_, item) => item !== index))}
                    style={styles.thumbRemove}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: urgent }}
          onPress={() => setUrgent((value) => !value)}
          style={[styles.urgent, urgent && styles.urgentOn]}
        >
          <View style={[styles.urgentBox, urgent && styles.urgentBoxOn]}>
            {urgent ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
          </View>
          <View style={styles.grow}>
            <Text style={styles.urgentTitle}>Mark as urgent</Text>
            <Text style={[styles.urgentHint, urgent && styles.urgentHintOn]}>
              {urgent ? 'This repair is flagged as urgent.' : 'Turn on if the problem needs attention now.'}
            </Text>
          </View>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={busy ? 'Submitting' : 'Submit maintenance report'}
          onPress={() => {
            if (busy) return;
            if (!issue.trim()) {
              setError('Describe the issue first.');
              return;
            }
            if (photos.length === 0) {
              setError('Add at least one photo or video.');
              return;
            }
            if (!selectedPropertyId) {
              setError(properties.length > 1 ? 'Choose the property for this repair.' : 'No current property is on this account.');
              return;
            }
            setError(null);
            setBusy(true);
            void demo.addMaintenance(issue, urgent, photos, '', selectedPropertyId).then((tracking) => {
              setBusy(false);
              if (tracking) router.replace(`/flow/maintenance?job=${tracking}`);
            });
          }}
        />
      </Card>
      <Notice>If there is immediate danger, contact emergency services. Submitting here does not wait for AI triage.</Notice>
    </Screen>
  );
}

const RESPONSIBILITY_LABEL = {
  tenant: 'You are responsible for this repair',
  landlord: 'The landlord is responsible for this repair',
  strata: 'Strata is responsible for this repair',
} as const;

function RepairDecisions({ job }: { job: ReturnType<typeof useDemo>['maintenance'][number] }) {
  const { notify, refreshAccount } = useDemo();
  const pending = job.questions.filter((question) => !question.answer);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsAck = job.responsibilityAckRequired && job.responsibilityAckStatus !== 'agreed' && job.responsibilityAckStatus !== 'disagreed';

  async function run(task: () => Promise<unknown>, saved: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await task();
      notify(saved);
      await refreshAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that');
    } finally {
      setBusy(false);
    }
  }

  if (!needsAck && pending.length === 0 && !job.completionApprovalPending) return null;

  return (
    <View style={styles.stack}>
      {job.responsibility ? <Text style={styles.body}>{RESPONSIBILITY_LABEL[job.responsibility]}</Text> : null}
      {needsAck ? (
        <>
          <Field label="Why you disagree">
            <Input value={reason} onChangeText={setReason} placeholder="Required if you disagree" />
          </Field>
          <Button
            label="I agree this repair is mine"
            onPress={() => void run(() => tenantApi.ackRepairResponsibility(job.id, { agreed: true }), 'Responsibility saved')}
          />
          <Button
            label="I disagree"
            tone="secondary"
            onPress={() => {
              if (reason.trim().length < 3) {
                setError('Tell us why you disagree.');
                return;
              }
              void run(() => tenantApi.ackRepairResponsibility(job.id, { agreed: false, reason: reason.trim() }), 'Disagreement saved');
            }}
          />
        </>
      ) : null}
      {pending.map((question) => {
        const key = `${question.issueId}:${question.questionKey}`;
        return (
          <Field key={key} label={question.question}>
            <Input value={answers[key] ?? ''} onChangeText={(value) => setAnswers((current) => ({ ...current, [key]: value }))} />
          </Field>
        );
      })}
      {pending.length > 0 ? (
        <Button
          label="Send answers"
          onPress={() => {
            if (pending.some((question) => !(answers[`${question.issueId}:${question.questionKey}`] ?? '').trim())) {
              setError('Answer each question before sending.');
              return;
            }
            void run(
              () =>
                tenantApi.answerRepairQuestions(job.id, {
                  answers: pending.map((question) => ({
                    issueId: question.issueId,
                    questionKey: question.questionKey,
                    answer: (answers[`${question.issueId}:${question.questionKey}`] ?? '').trim(),
                  })),
                }),
              'Answers saved',
            );
          }}
        />
      ) : null}
      {job.completionApprovalPending ? (
        <Button
          label="The repair is finished"
          onPress={() => void run(() => tenantApi.approveRepairCompletion(job.id), 'Repair marked finished')}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function statusLabel(status: string): string {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function MaintenanceScreen() {
  const router = useRouter();
  const { job: jobParam } = useLocalSearchParams<{ job?: string | string[] }>();
  const jobId = Array.isArray(jobParam) ? jobParam[0] : jobParam;
  const { maintenance } = useDemo();
  const opened = jobId ? maintenance.find((item) => item.id === jobId) : undefined;
  const showList = !jobId && maintenance.length > 1;
  const job = jobId ? opened : showList ? undefined : maintenance[0];
  return (
    <Screen>
      <BackButton />
      {maintenance.length === 0 ? <Notice>Repairs you submit appear here from your tenancy.</Notice> : null}
      {!job ? <Button label="Report a repair" onPress={() => router.push('/flow/report')} /> : null}
      {jobId && !opened ? <Notice>This repair is not on this account.</Notice> : null}
      {showList ? <Text style={styles.h2}>Repairs</Text> : null}
      {showList ? (
        maintenance.map((item) => (
          <Card key={item.id} onPress={() => router.push(`/flow/maintenance?job=${item.id}`)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted}>{[item.tracking, statusLabel(item.status)].filter(Boolean).join(' · ')}</Text>
          </Card>
        ))
      ) : null}
      {job ? (
        <>
          <TaskHeader title={job.title} status={statusLabel(job.status)} />
          <Card>
            <Text style={styles.muted}>{[job.tracking, job.category, job.urgent ? 'Urgent' : ''].filter(Boolean).join(' · ')}</Text>
            {job.photos.length > 0 ? (
              <View style={styles.thumbs}>
                {job.photos.map((photo) =>
                  /^https?:\/\//i.test(photo) ? (
                    <Image key={photo} source={{ uri: photo }} style={styles.thumb} />
                  ) : (
                    <Text key={photo} style={styles.muted}>{photo}</Text>
                  ),
                )}
              </View>
            ) : null}
            <RepairDecisions job={job} />
          </Card>
          <Card>
            <Text style={styles.kicker}>BUILDING</Text>
            <Text style={styles.title}>{job.buildingName || job.managerName || 'No building contact on this repair'}</Text>
            {job.managerPhone ? <Button label={job.managerPhone} tone="outline" onPress={() => Linking.openURL(`tel:${job.managerPhone.replace(/\s/g, '')}`)} /> : null}
            {job.managerEmail ? <Button label={job.managerEmail} tone="outline" onPress={() => Linking.openURL(`mailto:${job.managerEmail}`)} /> : null}
          </Card>
          <Card>
            <Text style={styles.kicker}>STRATA</Text>
            <Text style={styles.title}>{job.strataName || 'No strata contact on this repair'}</Text>
            {job.strataPlan ? <Text style={styles.muted}>{job.strataPlan}</Text> : null}
            {job.strataPhone ? <Button label={job.strataPhone} tone="outline" onPress={() => Linking.openURL(`tel:${job.strataPhone.replace(/\s/g, '')}`)} /> : null}
            {job.strataEmail ? <Button label={job.strataEmail} tone="outline" onPress={() => Linking.openURL(`mailto:${job.strataEmail}`)} /> : null}
          </Card>
          <View style={styles.stack}>
            <Button label="Message your agent" onPress={() => router.push('/flow/new-message')} />
            {job.scheduleApprovalPending ? <Button label="Respond to proposed time" tone="secondary" onPress={() => router.push('/flow/appointment')} /> : null}
          </View>
          <Notice>When the contractor finishes, you confirm whether the issue is resolved. Silence does not close the request.</Notice>
        </>
      ) : null}
    </Screen>
  );
}

export function AppointmentScreen() {
  const router = useRouter();
  const { notify, maintenance, refreshAccount } = useDemo();
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
              tenantApi.respondSchedule(job.id, 'approved').then(async () => {
                await refreshAccount();
                notify('Appointment confirmed');
                router.replace(`/flow/maintenance?job=${job.id}`);
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
  grow: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  urgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    padding: 14,
    backgroundColor: colors.card,
  },
  urgentOn: { borderColor: colors.amber, backgroundColor: colors.amberBg },
  urgentBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#c5d0c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  urgentBoxOn: { borderColor: colors.amber, backgroundColor: colors.amber },
  urgentTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  urgentHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  urgentHintOn: { color: colors.amber },
  property: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    padding: 14,
    backgroundColor: colors.card,
  },
  propertyOn: { borderColor: colors.green, backgroundColor: colors.soft },
  propertyTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 72, height: 72 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(20,35,29,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: colors.danger, fontSize: 13 },
});
