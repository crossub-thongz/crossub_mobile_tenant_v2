import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import { tenantApi } from '@/src/api/tenant';
import { money, type CleaningChoice } from '@/src/demo/model';
import { KeyCollectionForm } from '@/src/flows/key-collection';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Choice, Field, Input, Notice, RowItem, Screen } from '@/src/ui/ui';

export { FinalScreen } from '@/src/flows/outgoing-report';

export const CLEANING: { id: CleaningChoice; body: string }[] = [
  { id: 'Crossub Cleaning', body: 'Brightness coordinates cleaning. This is a request, not a booked quote.' },
  { id: "Agent's Cleaner", body: 'Your agent’s preferred supplier. The agent confirms completion.' },
  { id: 'Tenant Arranged', body: 'Your cleaner, or you. Upload completion photos and the date.' },
];

export function RenewalScreen() {
  const router = useRouter();
  const { applications } = useDemo();
  const renewals = applications.filter((item) => item.isRenewal);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Lease renewal</Text>
      {renewals.length === 0 ? (
        <Notice>No lease renewal offer is on this tenancy. A renewal appears here when an application is marked as a renewal.</Notice>
      ) : null}
      {renewals.map((item) => (
        <Card key={item.id} onPress={() => router.push(`/applications/${item.id}`)}>
          <Text style={styles.title}>{item.reference}</Text>
          <Text style={styles.body}>{item.propertyAddress}</Text>
          <Text style={styles.muted}>
            {item.status} · submitted {item.submittedAt || 'date not recorded'}
          </Text>
        </Card>
      ))}
      <Button label="Message your property manager" tone="outline" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function KeysScreen() {
  const demo = useDemo();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const collecting = demo.onboardingActive && demo.onboarding.key_pickup !== 'completed';
  const returning = Boolean(demo.vacating);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Key handover</Text>
      <Text style={styles.muted}>Move-in collection is saved on the lease. Key return uses the address on the vacating case.</Text>
      {collecting || demo.keyCollection ? <KeyCollectionForm /> : null}
      {returning ? (
        <Card>
          <Text style={styles.title}>Return keys to</Text>
          <Text style={styles.body}>
            {demo.vacating?.keysReturnAddress || 'Your property manager will send the key return location shortly.'}
          </Text>
          {demo.vacating?.keysReturned ? <Notice>Keys are marked returned on this vacating case.</Notice> : null}
        </Card>
      ) : null}
      {!collecting && !demo.keyCollection && !returning ? (
        <Notice>Key collection appears here once a lease is being prepared. Key return appears on an open vacating case.</Notice>
      ) : null}
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
  const { cleaning, vacating } = useDemo();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Moving out</Text>
      <Text style={styles.muted}>
        {vacating?.vacateDate ? `Vacating date ${vacating.vacateDate}.` : 'No vacating date is on this account yet.'} Only the steps you can act on are listed.
      </Text>
      <Card>
        <RowItem icon="checkmark-circle-outline" title="Vacating details" subtitle="Confirmed" onPress={() => router.push('/flow/tenancy')} />
        <RowItem icon="sparkles-outline" title="Cleaning" subtitle={cleaning ?? 'Choose an arrangement'} onPress={() => router.push('/flow/cleaning')} />
        <RowItem icon="cube-outline" title="Move-out services" subtitle="Cleaning and a moving referral" onPress={() => router.push('/move-out-services')} />
        <RowItem icon="clipboard-outline" title="Final inspection" subtitle="Review findings" onPress={() => router.push('/flow/final')} />
        <RowItem icon="key-outline" title="Key return" subtitle="Arrange or record" onPress={() => router.push('/flow/keys')} />
        <RowItem
          icon="cash-outline"
          title="Final settlement"
          subtitle={
            vacating?.status === 'open' && vacating.responsibilityStatus === 'pending'
              ? 'Confirm repair responsibilities'
              : vacating?.status === 'open' && vacating.repairQuoteStatus === 'pending' && vacating.bondAckSent
                ? 'Respond to the repair quote'
                : 'Review charges'
          }
          onPress={() => router.push('/flow/settlement')}
        />
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

const SETTLEMENT_STATUS = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' } as const;
const RESPONSIBILITY = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' } as const;
const QUOTE = { PENDING: 'pending', NONE: 'none' } as const;
const CASE_OPEN = 'open';

export function SettlementScreen() {
  const demo = useDemo();
  const vacating = demo.vacating;
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = Boolean(vacating && (vacating.refund != null || vacating.debt != null));
  const waiting = vacating?.settlementStatus === SETTLEMENT_STATUS.PENDING && ready;
  const reviewResponsibilities = vacating?.status === CASE_OPEN && vacating.responsibilityStatus === RESPONSIBILITY.PENDING;
  const reviewQuote = vacating?.status === CASE_OPEN && vacating.repairQuoteStatus === QUOTE.PENDING && vacating.bondAckSent;

  async function accept() {
    if (!vacating || busy) return;
    setBusy(true);
    setError(null);
    try {
      await tenantApi.acceptSettlement(vacating.id);
      demo.notify('Settlement accepted');
      await demo.refreshAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the settlement');
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (!vacating || busy) return;
    const note = reason.trim();
    if (!note) {
      setError('Say why you are declining the settlement');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await tenantApi.declineSettlement(vacating.id, note);
      demo.notify('Settlement declined');
      await demo.refreshAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline the settlement');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Final settlement</Text>
      {!vacating ? <Notice>No vacating case is open on this tenancy, so there is no settlement to review.</Notice> : null}
      {vacating && !ready ? <Notice>No settlement figures have been sent for this vacating case yet.</Notice> : null}
      {reviewResponsibilities && vacating ? (
        <Card>
          <Text style={styles.title}>Repair responsibilities</Text>
          <Text style={styles.muted}>Your property manager listed these items from the outgoing inspection. Confirm them before a quote is prepared.</Text>
          {vacating.responsibilityItems.map((item) => (
            <Text key={`${item.area}-${item.description}`} style={styles.body}>
              {item.area}: {item.description}{item.quote ? ` · ${item.quote}` : ''}{item.bondDeductible ? ' · bond deductible' : ''}
            </Text>
          ))}
          <Field label="Reason if you disagree">
            <Input multiline value={reason} onChangeText={setReason} placeholder="What should be reviewed?" />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={busy ? 'Sending…' : 'I acknowledge these items'}
            onPress={() => {
              setBusy(true);
              setError(null);
              void tenantApi.acceptResponsibilities(vacating.id)
                .then(() => demo.refreshAccount())
                .then(() => demo.notify('Responsibilities acknowledged'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not save that answer'))
                .finally(() => setBusy(false));
            }}
          />
          <Button
            label="I disagree"
            tone="outline"
            onPress={() => {
              const note = reason.trim();
              if (!note) {
                setError('Say why you disagree');
                return;
              }
              setBusy(true);
              setError(null);
              void tenantApi.declineResponsibilities(vacating.id, note)
                .then(() => demo.refreshAccount())
                .then(() => demo.notify('Disagreement sent'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not save that answer'))
                .finally(() => setBusy(false));
            }}
          />
        </Card>
      ) : null}
      {vacating && vacating.responsibilityStatus === RESPONSIBILITY.ACCEPTED ? <Notice>You acknowledged the repair responsibilities.</Notice> : null}
      {vacating && vacating.responsibilityStatus === RESPONSIBILITY.DECLINED ? <Notice>You disagreed with the repair responsibilities. Your property manager will send an update.</Notice> : null}
      {reviewQuote && vacating ? (
        <Card>
          <Text style={styles.title}>Repair quote</Text>
          <Text style={styles.muted}>These items may be deducted from the bond. Agreeing does not move the money.</Text>
          <Field label="Reason if you disagree">
            <Input multiline value={reason} onChangeText={setReason} placeholder="What should be reviewed?" />
          </Field>
          {error && !reviewResponsibilities ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={busy ? 'Sending…' : 'Agree to the quote'}
            onPress={() => {
              setBusy(true);
              setError(null);
              void tenantApi.acceptRepairQuote(vacating.id)
                .then(() => demo.refreshAccount())
                .then(() => demo.notify('Quote accepted'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not accept the quote'))
                .finally(() => setBusy(false));
            }}
          />
          <Button
            label="Disagree with the quote"
            tone="outline"
            onPress={() => {
              const note = reason.trim();
              if (!note) {
                setError('Say why you disagree');
                return;
              }
              setBusy(true);
              setError(null);
              void tenantApi.declineRepairQuote(vacating.id, note)
                .then(() => demo.refreshAccount())
                .then(() => demo.notify('Quote disagreement sent'))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not decline the quote'))
                .finally(() => setBusy(false));
            }}
          />
        </Card>
      ) : null}
      {vacating && ready ? (
        <Card>
          {vacating.hasSummary ? <Amount label="Unpaid rent" value={vacating.arrears} /> : null}
          {vacating.hasSummary ? <Amount label="Unpaid bills" value={vacating.bills} /> : null}
          {vacating.hasSummary ? <Amount label="Maintenance" value={vacating.deductions} /> : null}
          {vacating.hasSummary ? <Amount label="Bond held" value={vacating.bond} /> : null}
          {vacating.refund != null ? <Amount label="Proposed refund" value={vacating.refund} /> : null}
          {vacating.debt != null ? <Amount label="Amount still owing" value={vacating.debt} /> : null}
          <Text style={styles.muted}>Status: {vacating.settlementStatus}</Text>
        </Card>
      ) : null}
      {waiting ? (
        <Card>
          <Field label="Reason if you decline">
            <Input multiline value={reason} onChangeText={setReason} placeholder="What should be reviewed?" />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={busy ? 'Sending…' : 'Accept settlement'} onPress={() => void accept()} />
          <Button label="Decline settlement" tone="outline" onPress={() => void decline()} />
        </Card>
      ) : null}
      {error && !waiting ? <Text style={styles.error}>{error}</Text> : null}
      <Notice>Accepting or declining is saved on the vacating case. It does not move money by itself.</Notice>
    </Screen>
  );
}

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.between}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.title}>{money(value)}</Text>
    </View>
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
