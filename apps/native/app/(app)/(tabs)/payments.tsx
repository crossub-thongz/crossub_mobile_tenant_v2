import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import { cycleAmount, cycleUnit, normalizeCycle } from '@/src/api/rent';
import { messageAttachment, tenantApi, type EvidenceFile } from '@/src/api/tenant';
import { useRentArrears } from '@/src/flows/arrears-banner';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Button, Card, Notice, RowItem, Screen, Section, TabHeader } from '@/src/ui/ui';

const PAYMENT_METHOD = {
  EFT: 'EFT',
  BPAY: 'BPAY',
  CHEQUE: 'CHEQUE',
  CASH: 'CASH',
  CARD: 'CARD',
} as const;

type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  EFT: 'Bank transfer',
  BPAY: 'BPAY',
  CHEQUE: 'Cheque',
  CASH: 'Cash',
  CARD: 'Card',
};

const PROOF_MAX_BYTES = 4 * 1024 * 1024;

function proofBytes(file: EvidenceFile): number {
  return Math.ceil((file.contentBase64.length * 3) / 4);
}

export default function PaymentsScreen() {
  const router = useRouter();
  const demo = useDemo();
  const { scenario, property, current, notify, rentPaidTo, paymentReference, ledger, propertyUuid, refreshAccount } = demo;
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [proof, setProof] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const showsLedger = scenario.ledger && current;
  const cycle = normalizeCycle(demo.paymentCycle ?? property.frequency);
  const due = current && property.rent > 0 ? cycleAmount(property.rent, cycle) : null;
  const arrears = useRentArrears();
  const amountDue = arrears?.outstanding ?? due;

  return (
    <Screen tab>
      <TabHeader kicker="" title="Payments" />
      {arrears ? (
        <View style={styles.arrears}>
          <Text style={styles.arrearsTitle}>Rent past the paid-to date</Text>
          <Text style={styles.muted}>
            Rent is paid to {arrears.paidToLabel}. {arrears.periods} {arrears.unit}
            {arrears.periods === 1 ? ' is' : 's are'} past that date.
          </Text>
          <Text style={styles.arrearsAmount}>Outstanding {money(arrears.outstanding)}</Text>
        </View>
      ) : null}
      {amountDue != null ? (
        <Card>
          <Text style={styles.kicker}>PAY RENT</Text>
          <Text style={styles.amount}>{money(amountDue)}</Text>
          <Text style={styles.muted}>
            {arrears ? 'Outstanding amount due' : `Suggested payment — one ${cycleUnit(cycle)} at the current rent`}
          </Text>
          <Text style={styles.muted}>Reference: {paymentReference || 'Shown on the tenancy'}</Text>
          <Notice>Card payments are not taken in the app. Pay the agency, then send the proof below. The ledger changes when accounting matches it.</Notice>
        </Card>
      ) : (
        <Card>
          <Text style={styles.title}>Pay rent</Text>
          <Text style={styles.muted}>Rent payments appear here once an active lease is linked to this account.</Text>
        </Card>
      )}

      {showsLedger ? (
        <>
          <View style={styles.tiles}>
            <Tile label="Rent paid to" value={rentPaidTo || '—'} />
            <Tile label="Ledger lines" value={String(ledger.length)} />
          </View>
          <Card>
            <RowItem icon="list-outline" title="Rent ledger" subtitle="Periods and part payments stay separate" onPress={() => router.push('/flow/ledger')} />
            <RowItem icon="document-outline" title="Rent receipts" subtitle="Issued receipts only" onPress={() => router.push('/flow/receipts')} />
            <RowItem icon="reader-outline" title="Tenant invoices" subtitle="Invoice status is separate from settlement" onPress={() => router.push('/flow/invoices')} />
            <RowItem icon="document-text-outline" title="Final statement" subtitle="Bond, arrears, and the refund" onPress={() => router.push('/statement')} />
          </Card>
        </>
      ) : (
        <>
          <Card>
            <RowItem icon="home-outline" title="Tenancy rent details" subtitle={`${money(property.rent)} per week`} onPress={() => router.push('/flow/rent-details')} />
            <RowItem icon="reader-outline" title="Published invoices" subtitle="No payment status is invented" onPress={() => router.push('/flow/invoices')} />
          </Card>
        </>
      )}

      {current && propertyUuid ? (
        <Card>
          <Text style={styles.kicker}>I'VE PAID</Text>
          <Text style={styles.title}>Tell accounting which payment you made</Text>
          <Text style={styles.muted}>Choose the type, then a photo of the receipt or transfer. This does not mark the rent as paid.</Text>
          <View style={styles.pills}>
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => setMethod(id)}
                style={[styles.pill, method === id && styles.pillOn]}
              >
                <Text style={[styles.pillText, method === id && styles.pillTextOn]}>{PAYMENT_METHOD_LABEL[id]}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            label={proof ? proof.fileName : 'Upload proof of payment'}
            tone="outline"
            onPress={() => {
              setError(null);
              void pickEvidence()
                .then((file) => {
                  if (!file) return;
                  if (!file.mimeType.startsWith('image/')) {
                    setError('Choose a photo of the payment. Video is not a receipt.');
                    return;
                  }
                  if (proofBytes(file) > PROOF_MAX_BYTES) {
                    setError('That photo is over 4 MB. Choose a smaller one.');
                    return;
                  }
                  setProof(file);
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
            }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {sent ? <Notice>{sent}</Notice> : null}
          <Button
            label={busy ? 'Sending proof' : "I've paid"}
            onPress={() => {
              if (busy) return;
              if (!method) {
                setError('Choose the type of payment.');
                return;
              }
              if (!proof) {
                setError('Upload a photo of the payment.');
                return;
              }
              setBusy(true);
              setError(null);
              const amountLine = amountDue != null ? `Amount shown: ${money(amountDue)}.` : '';
              const referenceLine = paymentReference ? `Reference: ${paymentReference}.` : '';
              void tenantApi
                .createMessage({
                  subject: "I've paid",
                  department: 'ACCOUNTING',
                  propertyId: propertyUuid,
                  body: [`Paid by ${PAYMENT_METHOD_LABEL[method]}.`, referenceLine, amountLine, 'Proof is attached for accounting to match. This does not mark the rent as paid.']
                    .filter(Boolean)
                    .join(' '),
                  attachments: [messageAttachment(proof)],
                })
                .then(async () => {
                  setSent(`Proof of the ${PAYMENT_METHOD_LABEL[method].toLowerCase()} payment was sent. Accounting matches it before the ledger changes.`);
                  setProof(null);
                  setMethod(null);
                  notify('Payment proof sent');
                  await refreshAccount();
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not send the payment proof'))
                .finally(() => setBusy(false));
            }}
          />
        </Card>
      ) : null}

      <Section title="Payment instructions" />
      <Card>
        <Text style={styles.title}>Bank transfer</Text>
        <Text style={styles.muted}>Use the account on your rent invoice. Quote this reference on the transfer.</Text>
        <Text style={styles.title}>{paymentReference || 'Reference appears on the tenancy'}</Text>
        <Button label="Show reference" tone="outline" onPress={() => notify(paymentReference ? `Reference ${paymentReference}` : 'Your payment reference is on the tenancy.')} />
      </Card>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  amount: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, gap: 6 },
  tileValue: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: '#78857b', fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
  error: { color: colors.danger, fontSize: 13 },
  arrears: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    backgroundColor: 'rgba(245,158,11,0.12)',
    padding: 16,
    gap: 4,
  },
  arrearsTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  arrearsAmount: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});
