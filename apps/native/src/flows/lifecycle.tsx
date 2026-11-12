import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import { FINDINGS, money, type CleaningChoice, type KeyMode } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Choice, Field, Input, Notice, RowItem, Screen, TaskHeader, Timeline } from '@/src/ui/ui';

export const CLEANING: { id: CleaningChoice; body: string }[] = [
  { id: 'Crossub Cleaning', body: 'Brightness coordinates cleaning. This is a request, not a booked quote.' },
  { id: "Agent's Cleaner", body: 'Your agent’s preferred supplier. The agent confirms completion.' },
  { id: 'Tenant Arranged', body: 'Your cleaner, or you. Upload completion photos and the date.' },
];

const KEY_MODES: KeyMode[] = ['Crossub Booking', 'Agent Record Only', 'Agent Booking'];
const SETTLEMENTS = ['Separate payment', 'Bond deduction', 'Split settlement'];

export function RenewalScreen() {
  const router = useRouter();
  const demo = useDemo();
  const status = demo.renewalResponded ? 'Under Review' : 'Action Required';
  return (
    <Screen>
      <BackButton />
      <TaskHeader title="Lease renewal" status={status} />
      <Card>
        <Text style={styles.title}>Renewal offer</Text>
        <Text style={styles.body}>Term: 12 months</Text>
        <Text style={styles.body}>15 Dec 2026 – 14 Dec 2027</Text>
        <Text style={styles.body}>Proposed rent: $1,200 weekly</Text>
      </Card>
      {demo.renewalResponded ? (
        <Notice>Your response is with the property manager. Accepting here does not sign the lease.</Notice>
      ) : (
        <View style={styles.stack}>
          <Button label="Accept offer" onPress={demo.respondRenewal} />
          <Button label="Negotiate or decline" tone="secondary" onPress={() => router.push('/flow/new-message')} />
        </View>
      )}
      <Timeline status={status} />
    </Screen>
  );
}

export function KeysScreen() {
  const demo = useDemo();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const booking = demo.keyMode !== 'Agent Record Only';
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Key handover</Text>
      <Text style={styles.muted}>Move-in collection. The responsible party is chosen by the agency, not by you.</Text>
      <Card>
        <Text style={styles.title}>Handover mode</Text>
        {KEY_MODES.map((mode) => (
          <Choice key={mode} title={mode} body={mode === 'Agent Record Only' ? 'Arranged outside the app' : 'Book a slot or request a time'} selected={demo.keyMode === mode} onPress={() => demo.setKeyMode(mode)} />
        ))}
        {booking ? <Button label={demo.keyBooked ? 'Booking requested' : 'Request appointment'} onPress={demo.bookKey} /> : <Notice>Record the exchange below. No in-app booking is required.</Notice>}
      </Card>
      <Card>
        <Text style={styles.title}>Handover evidence</Text>
        <Button label={demo.keyPhoto ? 'Photo attached' : 'Attach photo'} tone="secondary" onPress={demo.attachKeyPhoto} />
        <Field label="Key quantity">
          <Input value="2" editable={false} />
        </Field>
        <Field label="Actual handover time">
          <Input value="2 Dec 2026, 10:00 AM" editable={false} />
        </Field>
        <Button label="Submit handover record" onPress={demo.submitKeyEvidence} />
      </Card>
      {demo.keyRecorded ? <Notice>Waiting for the responsible party to confirm. Key return does not end the tenancy or change rent paid-to.</Notice> : null}
      <Card>
        <Text style={styles.title}>Returned keys and access devices</Text>
        <Text style={styles.muted}>Add a clear photo of the keys, remotes, or cards you returned. Up to 4.</Text>
        {demo.keyReturnPhotos.map((name) => (
          <Button key={name} label={`Remove ${name}`} tone="outline" onPress={() => demo.removeKeyReturnPhoto(name)} />
        ))}
        {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
        <Button
          label="Add photo"
          tone="secondary"
          onPress={() => {
            void pickEvidence()
              .then((file) => {
                if (!file) return;
                setPhotoError(demo.addKeyReturnPhoto(file));
              })
              .catch((err) => setPhotoError(err instanceof Error ? err.message : 'Could not open the photo library'));
          }}
        />
        <Button label={demo.keyReturnSubmitted ? 'Return submitted' : 'Submit key return'} onPress={demo.submitKeyReturn} />
      </Card>
    </Screen>
  );
}

export function VacatingScreen() {
  const router = useRouter();
  const { cleaning } = useDemo();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Moving out</Text>
      <Text style={styles.muted}>Vacating date 14 Dec 2026. Only the steps you can act on are listed.</Text>
      <Card>
        <RowItem icon="checkmark-circle-outline" title="Vacating details" subtitle="Confirmed" onPress={() => router.push('/flow/tenancy')} />
        <RowItem icon="sparkles-outline" title="Cleaning" subtitle={cleaning ?? 'Choose an arrangement'} onPress={() => router.push('/flow/cleaning')} />
        <RowItem icon="cube-outline" title="Move-out services" subtitle="Cleaning and a moving referral" onPress={() => router.push('/move-out-services')} />
        <RowItem icon="clipboard-outline" title="Final inspection" subtitle="Review findings" onPress={() => router.push('/flow/final')} />
        <RowItem icon="key-outline" title="Key return" subtitle="Arrange or record" onPress={() => router.push('/flow/keys')} />
        <RowItem icon="cash-outline" title="Final settlement" subtitle="Review charges" onPress={() => router.push('/flow/settlement')} />
      </Card>
      <Notice>Finishing this list does not close the vacating task or the tenancy. Your manager closes those.</Notice>
    </Screen>
  );
}

export function CleaningScreen() {
  const router = useRouter();
  const demo = useDemo();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Move-out cleaning</Text>
      <Text style={styles.muted}>All three options are available in every service mode.</Text>
      {CLEANING.map((option) => (
        <Choice key={option.id} title={option.id} body={option.body} selected={demo.cleaning === option.id} onPress={() => demo.setCleaning(option.id)} />
      ))}
      {demo.cleaning === 'Tenant Arranged' ? (
        <Card>
          <Field label="Completion photos">
            <Input value="Add when the clean is finished" editable={false} />
          </Field>
          <Field label="Completion date">
            <Input value="14 Dec 2026" editable={false} />
          </Field>
        </Card>
      ) : null}
      <Button
        label="Save choice"
        onPress={() => {
          if (!demo.cleaning) {
            demo.notify('Select an option');
            return;
          }
          demo.notify('Choice recorded. The vacating task stays open.');
          router.replace('/flow/vacating');
        }}
      />
    </Screen>
  );
}

export function FinalScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [reasons, setReasons] = useState<Record<number, string>>({});
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Final inspection</Text>
      <Text style={styles.muted}>Respond to every finding. Accepting one does not change the others.</Text>
      <Card>
        <Text style={styles.title}>Published report</Text>
        <Text style={styles.muted}>Findings, evidence and proposed charges. Owner pricing notes are not shown.</Text>
      </Card>
      {FINDINGS.map((finding) => {
        const response = demo.findings[finding.id]?.response;
        return (
          <Card key={finding.id}>
            <View style={styles.between}>
              <Text style={styles.title}>{finding.name}</Text>
              <Text style={styles.title}>{money(finding.amount)}</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button label="Accept" tone={response === 'Accept' ? 'primary' : 'secondary'} onPress={() => demo.setFinding(finding.id, 'Accept')} />
              </View>
              <View style={styles.flex}>
                <Button label="Dispute" tone={response === 'Dispute' ? 'primary' : 'secondary'} onPress={() => demo.setFinding(finding.id, 'Dispute', reasons[finding.id])} />
              </View>
            </View>
            {response === 'Dispute' ? (
              <Field label="Reason">
                <Input
                  multiline
                  value={reasons[finding.id] ?? ''}
                  onChangeText={(reason) => {
                    setReasons((current) => ({ ...current, [finding.id]: reason }));
                    demo.setFinding(finding.id, 'Dispute', reason);
                  }}
                  placeholder="What should be reviewed?"
                />
              </Field>
            ) : null}
          </Card>
        );
      })}
      <Button
        label="Submit all responses"
        onPress={() => {
          if (!demo.findingsReady()) {
            demo.notify('Respond to every finding');
            return;
          }
          demo.notify('Responses submitted. Each finding keeps its own history.');
          router.replace('/flow/settlement');
        }}
      />
    </Screen>
  );
}

export function SettlementScreen() {
  const demo = useDemo();
  const [method, setMethod] = useState(demo.settlementMethod ?? SETTLEMENTS[0]);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Final settlement</Text>
      <Card>
        <View style={styles.between}>
          <Text style={styles.title}>Agreed charges</Text>
          <Text style={styles.title}>$200.00</Text>
        </View>
        <Text style={styles.muted}>Agreeing to a finding does not collect money or claim the bond.</Text>
      </Card>
      <Card>
        <Text style={styles.title}>Preferred arrangement</Text>
        {SETTLEMENTS.map((option) => (
          <Choice key={option} title={option} body="Manager confirmation is required" selected={method === option} onPress={() => setMethod(option)} />
        ))}
        <Button label="Request arrangement" onPress={() => demo.requestSettlement(method)} />
      </Card>
      <Notice>Only the responsible manager can verify a settlement payment and close it. Invoice status in Payments is a different record.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
  stack: { gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
