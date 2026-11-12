import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { usePublicListing } from '@/src/api/use-listings';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Field, Input, Screen } from '@/src/ui/ui';

export default function CheckInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; sessionId?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : (params.sessionId ?? '');
  const { listing: property } = usePublicListing(listingId);
  const { checkIns, submitCheckIn } = useDemo();
  const existing = property && sessionId ? checkIns[`${property.id}:${sessionId}`] : undefined;
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    leaseTerm: existing?.leaseTerm || property?.leaseTerm || '',
    pets: existing?.pets ?? '',
    specialRequest: existing?.specialRequest ?? '',
    comments: existing?.comments ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(existing));

  const back = property ? `/listings/${property.id}` : '/listings';

  if (!sessionId) {
    return (
      <Screen>
        <BackButton fallback={back} />
        <Text style={styles.body}>Invalid check-in link. Scan the QR code at the property or ask your agent for a new link.</Text>
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <BackButton fallback="/listings" />
        <Text style={styles.body}>{property === undefined ? 'Loading this listing…' : 'Property not found.'}</Text>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <BackButton fallback="/listings" />
        <Text style={styles.kicker}>CHECK-IN COMPLETE</Text>
        <Text style={styles.title}>{property.address}</Text>
        <Text style={styles.body}>Your attendance has been recorded. The agent will see your details on the open inspection report.</Text>
        <Text style={styles.body}>
          Thank you for checking in, {form.name.trim()}. Your check-in stays linked if you apply for this property.
        </Text>
        <Button label="Apply for this property" onPress={() => router.replace(`/listings/${property.id}/apply`)} />
        <Button label="View property details" tone="outline" onPress={() => router.replace(`/listings/${property.id}`)} />
      </Screen>
    );
  }

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Screen>
      <BackButton fallback={back} />
      <Text style={styles.kicker}>OPEN INSPECTION</Text>
      <Text style={styles.title}>{property.address}</Text>
      <Text style={styles.body}>Register your attendance at this open inspection. Your agent will see your details on the inspection report.</Text>
      <Field label="Full name">
        <Input autoComplete="name" value={form.name} onChangeText={set('name')} />
      </Field>
      <Field label="Email">
        <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={form.email} onChangeText={set('email')} />
      </Field>
      <Field label="Mobile">
        <Input autoComplete="tel" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
      </Field>
      <Field label="Lease term">
        <Input value={form.leaseTerm} onChangeText={set('leaseTerm')} placeholder={property.leaseTerm || 'e.g. 12 months'} />
      </Field>
      <Field label="Pets">
        <Input value={form.pets} onChangeText={set('pets')} placeholder="e.g. 1 small dog, or leave blank if none" />
      </Field>
      <Field label="Visitor special request">
        <Input multiline value={form.specialRequest} onChangeText={set('specialRequest')} placeholder="Parking, accessibility, or a preferred move-in date" />
      </Field>
      <Field label="Comments">
        <Input multiline value={form.comments} onChangeText={set('comments')} placeholder="Anything else for the agent or inspection report" />
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="Check in"
        onPress={() => {
          void submitCheckIn({ propertyId: property.id, sessionId, ...form }).then((message) => {
          if (message) {
            setError(message);
            return;
          }
          setDone(true);
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
