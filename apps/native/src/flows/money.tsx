import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

export function LedgerScreen() {
  const { scenario, notify, ledger, rentPaidTo, property } = useDemo();
  if (!scenario.ledger) return <Hidden title="Rent ledger" body="A ledger is shown only when Crossub Accounting holds the rent records for this tenancy." />;
  const rows = ledger.map((item) => [item.when || 'Undated', item.amount == null ? '—' : money(item.amount), item.detail] as const);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Rent ledger</Text>
      <Text style={styles.muted}>Read only. The rent period continues from the previous paid-through date, not from the receipt date.</Text>
      <View style={styles.tiles}>
        <Tile label="Rent paid to" value={rentPaidTo || '—'} />
        <Tile label="Weekly rent" value={money(property.rent)} />
      </View>
      <Card>
        {rows.length === 0 ? <Text style={styles.muted}>No ledger lines on this tenancy yet.</Text> : null}
        {rows.map(([date, amount, detail]) => (
          <View key={date} style={styles.between}>
            <View style={styles.flex}>
              <Text style={styles.title}>{date}</Text>
              <Text style={styles.muted}>{detail}</Text>
            </View>
            <Text style={styles.title}>{amount}</Text>
          </View>
        ))}
      </Card>
      <Button label="Download ledger PDF" tone="outline" onPress={() => notify('Ledger export will use an authorised, expiring file link.')} />
    </Screen>
  );
}

export function RentDetailsScreen() {
  const router = useRouter();
  const { property, scenario } = useDemo();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Tenancy rent</Text>
      <Card>
        <Text style={styles.muted}>Contractual rent</Text>
        <Text style={styles.amount}>{money(property.rent)}</Text>
        <Text style={styles.muted}>{property.frequency}</Text>
        <Text style={styles.body}>
          {scenario.ledger
            ? 'Open the ledger for paid-to, arrears and part payments.'
            : 'Paid-to, arrears and receipts are unavailable because this trust account is outside Crossub Accounting.'}
        </Text>
      </Card>
      <Button label="Contact the responsible team" tone="outline" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function InvoicesScreen() {
  const { scenario } = useDemo();
  const status = (paid: boolean) => (scenario.ledger ? (paid ? 'Paid' : 'Unpaid') : 'Status unavailable');
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Tenant invoices</Text>
      <Card>
        <Text style={styles.title}>Replacement access card</Text>
        <Text style={styles.muted}>$80.00 · {status(false)}</Text>
      </Card>
      <Card>
        <Text style={styles.title}>Cleaning services</Text>
        <Text style={styles.muted}>$120.00 · {status(true)}</Text>
      </Card>
      <Notice>Invoice payment status is an accounting record. Final settlement is closed manually by the manager.</Notice>
    </Screen>
  );
}

export function ReceiptsScreen() {
  const { scenario } = useDemo();
  if (!scenario.ledger) return <Hidden title="Rent receipts" body="Receipts are issued from Crossub Accounting. They are not created from a payment screenshot." />;
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Rent receipts</Text>
      <Card>
        <Text style={styles.title}>REC-00125</Text>
        <Text style={styles.muted}>5 Nov · $1,000.00</Text>
      </Card>
      <Card>
        <Text style={styles.title}>REC-00118</Text>
        <Text style={styles.muted}>29 Oct · $1,200.00</Text>
      </Card>
    </Screen>
  );
}

function Hidden({ title, body }: { title: string; body: string }) {
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>{title}</Text>
      <Notice>{body}</Notice>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.title}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  amount: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  flex: { flex: 1 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, gap: 6 },
});
