import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { usePublicListing } from '@/src/api/use-listings';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

const STEPS = [
  { id: 'property', title: 'A. Rental property' },
  { id: 'personal', title: 'B. Personal details' },
  { id: 'occupancy', title: 'C. Occupancy' },
  { id: 'address', title: 'D. Current address' },
  { id: 'previous', title: 'E. Previous address' },
  { id: 'employment', title: 'F. Employment' },
  { id: 'emergency', title: 'G. Emergency contact' },
  { id: 'documents', title: 'H. 100-point check' },
  { id: 'declaration', title: 'I. Declaration' },
] as const;

const POINTS: { name: string; points: number }[] = [
  { name: 'Photo ID', points: 40 },
  { name: 'Proof of income', points: 30 },
  { name: 'Rental ledger', points: 30 },
];

export default function ApplyScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Array.isArray(id) ? id[0] : id;
  const { listing: property } = usePublicListing(listingId);
  const { checkIns, submitApplication } = useDemo();
  const [step, setStep] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    leaseTerm: property?.leaseTerm?.replace(' months', '') ?? '12',
    occupants: '1',
    pets: '',
    currentAddress: '',
    previousAddress: '',
    employment: '',
    income: '',
    emergencyName: '',
    emergencyPhone: '',
    documents: [] as string[],
    agreed: false,
  });

  if (!property) {
    return (
      <Screen>
        <BackButton fallback="/listings" />
        <Text style={styles.body}>{property === undefined ? 'Loading this listing…' : 'Property not found.'}</Text>
      </Screen>
    );
  }

  const checkedIn = property.sessionId ? Boolean(checkIns[`${property.id}:${property.sessionId}`]) : true;
  if (property.sessionId && !checkedIn) {
    return (
      <Screen>
        <BackButton fallback={`/listings/${property.id}`} />
        <Text style={styles.title}>Check in first</Text>
        <Text style={styles.body}>This open inspection links your visit to the application. Check in, then come back to apply.</Text>
        <Button label="Check in" onPress={() => router.replace(`/listings/${property.id}/check-in?sessionId=${property.sessionId}`)} />
      </Screen>
    );
  }

  if (!property.canApply) {
    return (
      <Screen>
        <BackButton fallback={`/listings/${property.id}`} />
        <Notice>This property is not accepting applications right now.</Notice>
      </Screen>
    );
  }

  if (submittedId) {
    return (
      <Screen>
        <Text style={styles.kicker}>APPLICATION SENT</Text>
        <Text style={styles.title}>{property.address}</Text>
        <Text style={styles.body}>Your application was sent to CROSSUB. The reference is on the confirmation from the tenant API.</Text>
        {status === 'authed' ? (
          <Button label="View application" onPress={() => router.replace(`/applications/${submittedId}`)} />
        ) : (
          <Button label="Sign in to track it" onPress={() => router.replace('/login')} />
        )}
        <Button label="Back to listings" tone="outline" onPress={() => router.replace('/listings')} />
      </Screen>
    );
  }

  const current = STEPS[step];
  const set = (key: 'name' | 'email' | 'phone' | 'leaseTerm' | 'occupants' | 'pets' | 'currentAddress' | 'previousAddress' | 'employment' | 'income' | 'emergencyName' | 'emergencyPhone') => (value: string) =>
    setForm((item) => ({ ...item, [key]: value }));

  const points = POINTS.filter((item) => form.documents.includes(item.name)).reduce((sum, item) => sum + item.points, 0);

  const next = () => {
    if (current.id === 'personal' && (!form.name.trim() || !form.email.includes('@') || !form.phone.trim())) {
      setError('Enter your name, email, and phone number.');
      return;
    }
    if (current.id === 'documents' && points < 100) {
      setError('Attach documents that add up to 100 points.');
      return;
    }
    if (current.id === 'declaration') {
      if (!form.agreed) {
        setError('Confirm the declaration before you submit.');
        return;
      }
      void submitApplication({
        propertyId: property.id,
        propertyAddress: property.address,
        applicantName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        leaseTerm: form.leaseTerm.trim() || '12',
        occupants: form.occupants.trim() || '1',
        employment: `${form.employment.trim() || 'Not stated'}${form.income.trim() ? ` · income ${form.income.trim()}` : ''}`,
        documents: form.documents,
      }).then((applicationId) => {
        if (applicationId) setSubmittedId(applicationId);
      });
      return;
    }
    setError(null);
    setStep((value) => value + 1);
  };

  return (
    <Screen>
      <BackButton fallback={`/listings/${property.id}`} />
      <Text style={styles.kicker}>
        NSW APPLICATION · {step + 1} OF {STEPS.length}
      </Text>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.body}>{property.address}</Text>
      {current.id === 'property' ? (
        <Card>
          <Field label="Lease term (months)">
            <Input value={form.leaseTerm} onChangeText={set('leaseTerm')} />
          </Field>
        </Card>
      ) : null}
      {current.id === 'personal' ? (
        <Card>
          <Field label="Full name">
            <Input value={form.name} onChangeText={set('name')} autoComplete="name" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
          </Field>
          <Field label="Mobile">
            <Input value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          </Field>
        </Card>
      ) : null}
      {current.id === 'occupancy' ? (
        <Card>
          <Field label="Adults who will live here">
            <Input value={form.occupants} onChangeText={set('occupants')} keyboardType="number-pad" />
          </Field>
          <Field label="Pets">
            <Input value={form.pets} onChangeText={set('pets')} placeholder="None, or describe them" />
          </Field>
        </Card>
      ) : null}
      {current.id === 'address' ? (
        <Card>
          <Field label="Current address">
            <Input value={form.currentAddress} onChangeText={set('currentAddress')} />
          </Field>
        </Card>
      ) : null}
      {current.id === 'previous' ? (
        <Card>
          <Field label="Previous address">
            <Input value={form.previousAddress} onChangeText={set('previousAddress')} placeholder="Optional" />
          </Field>
        </Card>
      ) : null}
      {current.id === 'employment' ? (
        <Card>
          <Field label="Employment">
            <Input value={form.employment} onChangeText={set('employment')} placeholder="Full time, employer" />
          </Field>
          <Field label="Annual income">
            <Input value={form.income} onChangeText={set('income')} placeholder="$96,000" />
          </Field>
        </Card>
      ) : null}
      {current.id === 'emergency' ? (
        <Card>
          <Field label="Emergency contact">
            <Input value={form.emergencyName} onChangeText={set('emergencyName')} />
          </Field>
          <Field label="Their phone">
            <Input value={form.emergencyPhone} onChangeText={set('emergencyPhone')} keyboardType="phone-pad" />
          </Field>
        </Card>
      ) : null}
      {current.id === 'documents' ? (
        <Card>
          <Text style={styles.body}>Select the documents you are attaching. You need 100 points.</Text>
          <Text style={styles.points}>{points} points attached</Text>
          {POINTS.map((item) => {
            const on = form.documents.includes(item.name);
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                onPress={() =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    documents: on ? currentForm.documents.filter((name) => name !== item.name) : [...currentForm.documents, item.name],
                  }))
                }
                style={styles.doc}
              >
                <Text style={styles.docTitle}>
                  {on ? 'Attached' : 'Attach'} · {item.name}
                </Text>
                <Text style={styles.body}>{item.points} points</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}
      {current.id === 'declaration' ? (
        <Card>
          <Text style={styles.body}>I declare that the information in this application is true, and I authorise the agent to check it.</Text>
          <Pressable accessibilityRole="button" onPress={() => setForm((item) => ({ ...item, agreed: !item.agreed }))} style={styles.doc}>
            <Text style={styles.docTitle}>{form.agreed ? 'Declaration accepted' : 'Accept the declaration'}</Text>
          </Pressable>
        </Card>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        {step > 0 ? <Button label="Back" tone="outline" onPress={() => { setError(null); setStep((value) => value - 1); }} /> : null}
        <Button label={current.id === 'declaration' ? 'Submit application' : 'Continue'} onPress={next} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
  points: { color: colors.ink, fontWeight: '700' },
  doc: { paddingVertical: 8 },
  docTitle: { color: colors.ink, fontWeight: '700' },
  actions: { gap: 8 },
});
