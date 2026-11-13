import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { arrearsFromPaidTo } from '@/src/api/rent';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';

export function useRentArrears() {
  const demo = useDemo();
  if (!demo.scenario.ledger || !demo.ledgerConnected || demo.property.rent <= 0) return null;
  return arrearsFromPaidTo({
    rentPaidToIso: demo.rentPaidToIso,
    weeklyRent: demo.property.rent,
    paymentCycle: demo.paymentCycle,
    paidToLabel: demo.rentPaidTo,
  });
}

export function ArrearsBanner() {
  const router = useRouter();
  const arrears = useRentArrears();
  if (!arrears) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/payments')} style={styles.banner}>
      <Text style={styles.title}>Rent past the paid-to date</Text>
      <Text style={styles.body}>
        Rent is paid to {arrears.paidToLabel}. {arrears.periods} {arrears.unit}
        {arrears.periods === 1 ? ' is' : 's are'} past that date.
      </Text>
      <Text style={styles.amount}>Outstanding {money(arrears.outstanding)}</Text>
      <Text style={styles.link}>Pay rent now</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    backgroundColor: 'rgba(245,158,11,0.12)',
    padding: 16,
    gap: 4,
  },
  title: { color: '#020617', fontSize: 15, fontWeight: '700' },
  body: { color: '#334155', fontSize: 13, lineHeight: 18 },
  amount: { color: '#020617', fontSize: 14, fontWeight: '700', marginTop: 4 },
  link: { color: '#00b894', fontSize: 13, fontWeight: '700', marginTop: 6 },
});
