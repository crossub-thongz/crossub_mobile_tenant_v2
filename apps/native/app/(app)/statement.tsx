import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

export default function StatementScreen() {
  const router = useRouter();
  const { scenario, notify, vacating, property } = useDemo();
  const bond = vacating?.bond ?? 0;
  const arrears = vacating?.arrears ?? 0;
  const bills = vacating?.bills ?? 0;
  const deductions = vacating?.deductions ?? 0;
  const refund = vacating?.refund ?? bond - arrears - bills - deductions;
  const rows = [
    ['Total bond', bond],
    ['Rent arrears', -arrears],
    ['Unpaid bills', -bills],
    ['Repair and cleaning', -deductions],
  ] as const;

  return (
    <Screen>
      <BackButton fallback="/payments" />
      <Text style={styles.title}>Final statement</Text>
      {!scenario.ledger ? (
        <Notice>Your agent manages this trust account. The app does not calculate a refund from those rent records.</Notice>
      ) : (
        <>
          <Text style={styles.body}>{vacating?.address || property.title}</Text>
          <Text style={styles.body}>{vacating ? 'Figures come from the vacating settlement on your tenancy.' : 'No settlement has been issued yet.'}</Text>
          <Card>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.body}>{label}</Text>
                <Text style={value < 0 ? styles.minus : styles.value}>{value < 0 ? `−${money(Math.abs(value))}` : money(value)}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.total}>Final refund</Text>
              <Text style={styles.total}>{money(refund)}</Text>
            </View>
          </Card>
          <Button label="Download statement PDF" tone="outline" onPress={() => notify('The PDF is issued by Crossub Accounting. It is not stored in the app yet.')} />
          <Button label="Question this statement" tone="secondary" onPress={() => router.push('/flow/new-message')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { color: colors.ink, fontWeight: '700' },
  minus: { color: colors.danger, fontWeight: '700' },
  total: { color: colors.ink, fontSize: 16, fontWeight: '700' },
});
