import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Button, Card, Notice, RowItem, Screen, Section, TabHeader, Tag } from '@/src/ui/ui';

export default function PaymentsScreen() {
  const router = useRouter();
  const { scenario, property, current, notify, rentPaidTo, paymentReference, ledger } = useDemo();
  const showsLedger = scenario.ledger && current;

  return (
    <Screen tab>
      <TabHeader kicker="RENT & DOCUMENTS" title="Payments" />
      <Card>
        <View style={styles.between}>
          <Text style={styles.kicker}>WEEKLY RENT</Text>
          <Tag label={showsLedger ? 'Crossub Accounting' : 'External accounting'} tone={showsLedger ? 'green' : 'neutral'} />
        </View>
        <Text style={styles.amount}>{money(property.rent)}</Text>
        <Text style={styles.muted}>
          {showsLedger ? 'Rent records come from Crossub Accounting. This screen cannot mark a payment as paid.' : 'Rent collection is managed by your agent.'}
        </Text>
      </Card>

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
          <Notice>Payment history, arrears, paid-to dates and receipts stay hidden when the trust account is outside Crossub Accounting.</Notice>
          <Card>
            <RowItem icon="home-outline" title="Tenancy rent details" subtitle={`${money(property.rent)} per week`} onPress={() => router.push('/flow/rent-details')} />
            <RowItem icon="reader-outline" title="Published invoices" subtitle="No payment status is invented" onPress={() => router.push('/flow/invoices')} />
          </Card>
        </>
      )}

      <Section title="Payment instructions" />
      <Card>
        <Text style={styles.title}>Bank transfer</Text>
        <Text style={styles.muted}>Account name: {scenario.trustName}</Text>
        <Text style={styles.muted}>Reference: {paymentReference || 'Shown on your rent invoice'}</Text>
        <Button label="Copy payment details" tone="outline" onPress={() => notify(paymentReference ? `Reference ${paymentReference}` : 'Your payment reference is on the tenancy.')} />
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
});
