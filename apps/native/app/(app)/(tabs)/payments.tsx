import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { cycleAmount, cycleUnit, normalizeCycle } from '@/src/api/rent';
import { useRentArrears } from '@/src/flows/arrears-banner';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Button, Card, Notice, RowItem, Screen, Section, TabHeader } from '@/src/ui/ui';

export default function PaymentsScreen() {
  const router = useRouter();
  const demo = useDemo();
  const { scenario, property, current, notify, rentPaidTo, paymentReference, ledger } = demo;
  const showsLedger = scenario.ledger && current;
  const cycle = normalizeCycle(demo.paymentCycle ?? property.frequency);
  const due = current && property.rent > 0 ? cycleAmount(property.rent, cycle) : null;
  const arrears = useRentArrears();
  const amountDue = arrears?.outstanding ?? due;

  return (
    <Screen tab>
      <TabHeader kicker="RENT & DOCUMENTS" title="Payments" />
      <Notice>{scenario.accounting}</Notice>
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
          <Text style={styles.muted}>Reference: {paymentReference || 'Shown on your rent invoice'}</Text>
          {demo.rentPaymentNote ? (
            <Notice>{`You noted a transfer of ${money(demo.rentPaymentNote.amount)}. The ledger updates when it clears.`}</Notice>
          ) : null}
          <Button
            label="I've paid by bank transfer"
            onPress={() => {
              if (amountDue == null) return;
              demo.noteRentPayment(amountDue);
            }}
          />
          <Button label="Pay by card (coming soon)" tone="outline" onPress={() => notify('Card payments will connect when the payment gateway is live. Use a bank transfer for now.')} />
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
          <Notice>Payment history, arrears, paid-to dates and receipts stay with the agency. This trust account is not in Crossub Accounting.</Notice>
          <Card>
            <RowItem icon="home-outline" title="Tenancy rent details" subtitle={`${money(property.rent)} per week`} onPress={() => router.push('/flow/rent-details')} />
            <RowItem icon="reader-outline" title="Published invoices" subtitle="No payment status is invented" onPress={() => router.push('/flow/invoices')} />
          </Card>
        </>
      )}

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
