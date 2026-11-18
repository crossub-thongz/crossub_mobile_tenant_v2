import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import { downloadAuthedPdf, isApiFile, ledgerPdfBytes, sharePdf } from '@/src/api/files';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

export function LedgerScreen() {
  const { scenario, ledger, rentPaidTo, property } = useDemo();
  const [error, setError] = useState<string | null>(null);
  if (!scenario.ledger) return <Hidden title="Rent ledger" body="Your agent manages this trust account. The rent ledger stays with the agency." />;
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
        {ledger.map((item) => (
          <View key={item.id} style={styles.between}>
            <View style={styles.flex}>
              <Text style={styles.title}>{item.when || 'Undated'}</Text>
              <Text style={styles.muted}>{item.detail}</Text>
            </View>
            <Text style={styles.title}>{item.amount == null ? '—' : money(item.amount)}</Text>
          </View>
        ))}
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="Download ledger PDF"
        tone="outline"
        onPress={() => {
          setError(null);
          const lines = [
            'Rent ledger',
            property.title,
            `Rent paid to ${rentPaidTo || '—'}`,
            `Weekly rent ${money(property.rent)}`,
            ...rows.map(([date, amount, detail]) => `${date}  ${amount}  ${detail}`),
          ];
          void sharePdf('rent-ledger.pdf', ledgerPdfBytes(lines)).catch((err) =>
            setError(err instanceof Error ? err.message : 'Could not share the ledger'),
          );
        }}
      />
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
          {scenario.accounting}
        </Text>
      </Card>
      <Button label="Contact the responsible team" tone="outline" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

const DOCUMENT_CATEGORY = { INVOICE: 'maintenance_invoice' } as const;
const LEDGER_TYPE = { RENT: 'RENT' } as const;

export function InvoicesScreen() {
  const { documents } = useDemo();
  const [error, setError] = useState<string | null>(null);
  const invoices = documents.filter((item) => item.category === DOCUMENT_CATEGORY.INVOICE);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Tenant invoices</Text>
      {invoices.length === 0 ? <Notice>No invoices are on this tenancy.</Notice> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {invoices.map((doc) => (
        <Card key={doc.id} onPress={() => openDocument(doc.url, doc.name, setError)}>
          <Text style={styles.title}>{doc.name}</Text>
          <Text style={styles.muted}>{doc.uploaded || 'Date not recorded'}</Text>
        </Card>
      ))}
    </Screen>
  );
}

export function ReceiptsScreen() {
  const { scenario, ledger } = useDemo();
  if (!scenario.ledger) return <Hidden title="Rent receipts" body="Your agent manages this trust account. Receipts stay with the agency." />;
  const receipts = ledger.filter((item) => item.type === LEDGER_TYPE.RENT);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Rent receipts</Text>
      <Text style={styles.muted}>Rent lines from the ledger. There is no separate receipt file on this account.</Text>
      {receipts.length === 0 ? <Notice>No rent lines are on this tenancy yet.</Notice> : null}
      {receipts.map((item) => (
        <Card key={item.id}>
          <Text style={styles.title}>{item.when || 'Undated'}</Text>
          <Text style={styles.muted}>
            {item.amount == null ? '—' : money(item.amount)} · {item.detail}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

function openDocument(url: string, name: string, setError: (message: string | null) => void) {
  setError(null);
  if (!url) {
    setError('This document has no file.');
    return;
  }
  const fileName = `${name.replace(/[^\w.-]+/g, '-') || 'document'}.pdf`;
  if (isApiFile(url)) {
    void downloadAuthedPdf(url, fileName).catch((err) => setError(err instanceof Error ? err.message : 'Could not open this file'));
    return;
  }
  void Linking.openURL(url).catch(() => setError('Could not open this file'));
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
  error: { color: colors.danger, fontSize: 13 },
});
