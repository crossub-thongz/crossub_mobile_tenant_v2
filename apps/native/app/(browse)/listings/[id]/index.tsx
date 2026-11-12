import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { usePublicListing } from '@/src/api/use-listings';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Array.isArray(id) ? id[0] : id;
  const { listing: property, error } = usePublicListing(listingId);
  const { checkIns } = useDemo();
  const checkedIn = property?.sessionId ? Boolean(checkIns[`${property.id}:${property.sessionId}`]) : false;

  if (property === undefined) {
    return (
      <Screen>
        <BackButton fallback="/listings" />
        <Text style={styles.body}>{error ?? 'Loading this listing…'}</Text>
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <BackButton fallback="/listings" />
        <Text style={styles.body}>{error ?? 'Property not found.'}</Text>
      </Screen>
    );
  }

  const onApply = () => {
    if (property.sessionId && !checkedIn) {
      router.push(`/listings/${property.id}/check-in?sessionId=${property.sessionId}`);
      return;
    }
    router.push(`/listings/${property.id}/apply`);
  };

  return (
    <Screen>
      <BackButton fallback="/listings" />
      <Text style={styles.title}>{property.address}</Text>
      <Text style={styles.muted}>{property.suburb}</Text>
      <Card>
        <Text style={styles.rent}>{property.rentWeekly ? `${money(property.rentWeekly)}/week` : 'Rent on application'}</Text>
        {property.bondAmount || property.depositAmount ? (
          <View style={styles.row}>
            {property.bondAmount ? (
              <View style={styles.grow}>
                <Text style={styles.kicker}>Bond</Text>
                <Text style={styles.value}>{money(property.bondAmount)}</Text>
              </View>
            ) : null}
            {property.depositAmount ? (
              <View style={styles.grow}>
                <Text style={styles.kicker}>Deposit</Text>
                <Text style={styles.value}>{money(property.depositAmount)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text style={styles.muted}>
          {property.propertyType} · {property.status}
          {property.availableFrom !== 'TBC' ? ` · Available ${property.availableFrom}` : ''}
        </Text>
        <Text style={styles.muted}>
          {property.bedrooms} bed · {property.bathrooms} bath
          {property.parking ? ` · ${property.parking} parking` : ''}
        </Text>
        {property.openInspection ? (
          <View>
            <Text style={styles.kicker}>Open inspection</Text>
            <Text style={styles.value}>{property.openInspection}</Text>
          </View>
        ) : null}
        <View>
          <Text style={styles.kicker}>Lease term</Text>
          <Text style={styles.value}>{property.leaseTerm ?? 'TBC'}</Text>
        </View>
      </Card>
      <Text style={styles.section}>Features</Text>
      {property.features.map((feature) => (
        <Text key={feature} style={styles.feature}>
          {feature}
        </Text>
      ))}
      {property.canApply ? (
        <Button label={checkedIn ? 'Apply for this property' : property.sessionId ? 'Check in, then apply' : 'Apply for this property'} onPress={onApply} />
      ) : (
        <Notice>This property is not accepting applications right now.</Notice>
      )}
      {property.sessionId ? (
        <Button
          label={checkedIn ? 'Check-in recorded' : 'Check in at the open inspection'}
          tone="outline"
          onPress={() => router.push(`/listings/${property.id}/check-in?sessionId=${property.sessionId}`)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  body: { color: colors.muted, fontSize: 14 },
  rent: { color: colors.green, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  grow: { flex: 1, gap: 2 },
  kicker: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  value: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  section: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  feature: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
