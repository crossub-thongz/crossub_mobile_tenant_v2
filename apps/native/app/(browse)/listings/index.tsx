import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePublicListings } from '@/src/api/use-listings';
import { useAuth } from '@/src/auth/auth-context';
import { money } from '@/src/demo/model';
import { colors } from '@/src/theme';
import { Card, Screen, Tag } from '@/src/ui/ui';

export default function ListingsScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const { items, error } = usePublicListings();
  const [suburb, setSuburb] = useState('All');
  const [openOnly, setOpenOnly] = useState(false);
  const listings = items ?? [];
  const suburbs = useMemo(() => ['All', ...new Set(listings.map((item) => item.suburb).filter(Boolean))], [listings]);
  const filtered = listings.filter((item) => (suburb === 'All' || item.suburb === suburb) && (!openOnly || item.openInspection));

  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.grow}>
          <Text style={styles.kicker}>CROSSUB RENTALS</Text>
          <Text style={styles.title}>Browse listings</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push(status === 'authed' ? '/' : '/login')}>
          <Text style={styles.link}>{status === 'authed' ? 'My home' : 'Sign in'}</Text>
        </Pressable>
      </View>
      <Text style={styles.muted}>Open inspections and vacant homes. You can look without an account.</Text>
      <View style={styles.filters}>
        {suburbs.map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => setSuburb(item)} style={[styles.chip, suburb === item && styles.chipOn]}>
            <Text style={[styles.chipText, suburb === item && styles.chipTextOn]}>{item.split(' NSW')[0]}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={() => setOpenOnly((value) => !value)} style={[styles.chip, openOnly && styles.chipOn]}>
          <Text style={[styles.chipText, openOnly && styles.chipTextOn]}>Open inspection</Text>
        </Pressable>
      </View>
      {error ? <Card><Text style={styles.muted}>{error}</Text></Card> : null}
      {items === null && !error ? <Text style={styles.muted}>Loading listings…</Text> : null}
      <Text style={styles.count}>
        {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
      </Text>
      {filtered.length === 0 ? (
        <Card>
          <Text style={styles.muted}>No properties match these filters.</Text>
        </Card>
      ) : (
        filtered.map((item) => (
          <Card key={item.id} onPress={() => router.push(`/listings/${item.id}`)}>
            <View style={styles.between}>
              <Text style={styles.address}>{item.address}</Text>
              <Tag label={item.propertyType} />
            </View>
            <Text style={styles.muted}>{item.suburb}</Text>
            <Text style={styles.rent}>{item.rentWeekly ? `${money(item.rentWeekly)}/week` : 'Rent on application'}</Text>
            <Text style={styles.muted}>
              {item.status} · {item.bedrooms} bed · {item.bathrooms} bath
              {item.parking ? ` · ${item.parking} parking` : ''}
              {item.availableFrom !== 'TBC' ? ` · Available ${item.availableFrom}` : ''}
            </Text>
            {item.openInspection ? <Text style={styles.fact}>Open inspection {item.openInspection}</Text> : null}
            {item.leaseTerm ? <Text style={styles.fact}>Lease term {item.leaseTerm}</Text> : null}
            <Text style={styles.link}>{item.canApply ? 'View and apply' : 'View details'}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  grow: { flex: 1 },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 4 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  link: { color: colors.green, fontWeight: '700', fontSize: 13 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { borderColor: colors.green, backgroundColor: colors.soft },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: colors.green },
  count: { color: colors.muted, fontSize: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700', flex: 1 },
  rent: { color: colors.green, fontSize: 14, fontWeight: '700' },
  fact: { color: colors.ink, fontSize: 12, lineHeight: 18 },
});
