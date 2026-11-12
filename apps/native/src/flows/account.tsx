import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PROPERTIES, money, type PropertyId } from '@/src/demo/model';
import { useAuth } from '@/src/auth/auth-context';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

export function PropertiesScreen() {
  const demo = useDemo();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>My properties</Text>
      <Text style={styles.kicker}>CURRENT</Text>
      <PropertyCard id="berry" selected={demo.propertyId === 'berry'} onPress={() => demo.setProperty('berry')} />
      <Text style={styles.kicker}>PREVIOUS</Text>
      <PropertyCard id="halifax" selected={demo.propertyId === 'halifax'} onPress={() => demo.setProperty('halifax')} />
      {!demo.current ? <Notice>This tenancy has ended. You can read what you are still allowed to see. New maintenance and inspections stay closed.</Notice> : null}
    </Screen>
  );
}

function PropertyCard({ id, selected, onPress }: { id: PropertyId; selected: boolean; onPress: () => void }) {
  const property = PROPERTIES[id];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, selected && styles.cardOn]}>
      <Text style={styles.kicker}>{property.status}</Text>
      <Text style={styles.title}>{property.title}</Text>
      <Text style={styles.muted}>
        {property.place} · {property.start} – {property.end}
      </Text>
    </Pressable>
  );
}

export function TenancyScreen() {
  const router = useRouter();
  const { property, scenario } = useDemo();
  const rows = [
    ['Type', property.type],
    ['Start', property.start],
    ['End', property.end],
    ['Rent', `${money(property.rent)} ${property.frequency.toLowerCase()}`],
    ['Parking and storage', property.extras],
    ['Managed by', scenario.team],
  ];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Tenancy details</Text>
      <Text style={styles.muted}>{property.title} · Read only</Text>
      <Card>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.between}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </Card>
      <Notice>Lease dates, rent and property records are changed by the agency. A correction request goes through Inbox and does not rewrite signed documents.</Notice>
      <Button label="Lease documents" onPress={() => router.push('/lease')} />
      <Button label="Request a correction" tone="outline" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function DocumentsScreen() {
  const docs = [
    ['20 Apr 2027', 'Tenancy notice'],
    ['18 Mar 2027', 'Routine inspection report'],
    ['1 Dec 2026', 'Lease renewal agreement'],
    ['13 Nov 2026', 'Entry condition report'],
  ];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Documents</Text>
      <Text style={styles.muted}>Newest first. Receipts and invoices stay in Payments.</Text>
      {docs.map(([date, title]) => (
        <Card key={title}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.muted}>{date}</Text>
        </Card>
      ))}
      <Notice>Files open through a short-lived authorised link. They are not stored at a public address.</Notice>
    </Screen>
  );
}

export function HouseholdScreen() {
  const people = [
    ['Daniel Zhou', 'You · Tenant'],
    ['Jessie Chen', 'Tenant'],
    ['Alex Wang', 'Tenant'],
  ];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Household members</Text>
      {people.map(([name, role]) => (
        <Card key={name}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.muted}>{role}</Text>
        </Card>
      ))}
      <Notice>Other members’ email addresses and phone numbers are not shown here, and you cannot edit the household.</Notice>
    </Screen>
  );
}

export function PersonalScreen() {
  const { email } = useAuth();
  const { notify } = useDemo();
  const [phone, setPhone] = useState('0412 000 000');
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Personal information</Text>
      <Card>
        <Text style={styles.muted}>Legal name</Text>
        <Text style={styles.title}>Daniel Zhou</Text>
        <Text style={styles.muted}>A legal-name change is a request to the agency. Your person ID does not change.</Text>
        <Text style={styles.muted}>Email</Text>
        <Text style={styles.title}>{email ?? 'daniel@example.com'}</Text>
        <Text style={styles.muted}>Phone</Text>
        <Text style={styles.title}>{phone}</Text>
        <Button
          label="Save and verify"
          onPress={() => {
            setPhone(phone);
            notify('We will verify the new contact before it replaces the current one.');
          }}
        />
      </Card>
    </Screen>
  );
}

export function NotificationSettingsScreen() {
  const options = ['Push notifications', 'Email updates', 'Maintenance progress', 'Inspection reminders', 'New messages'];
  const [enabled, setEnabled] = useState<Record<string, boolean>>(Object.fromEntries(options.map((item) => [item, true])));
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Notification preferences</Text>
      <Card>
        {options.map((item) => (
          <Pressable key={item} accessibilityRole="switch" accessibilityState={{ checked: enabled[item] }} onPress={() => setEnabled((current) => ({ ...current, [item]: !current[item] }))} style={styles.between}>
            <Text style={styles.title}>{item}</Text>
            <Text style={styles.value}>{enabled[item] ? 'On' : 'Off'}</Text>
          </Pressable>
        ))}
      </Card>
      <Notice>Essential notices, critical actions and security messages stay on. Turning off a routine push does not hide the task in the app.</Notice>
    </Screen>
  );
}

export function SecurityScreen() {
  const { notify } = useDemo();
  const rows = [
    ['Password', 'Change and reset by email'],
    ['MFA', 'Optional. Not required for every tenant.'],
    ['Face ID or fingerprint', 'Unlocks this device. It does not replace server sign-in.'],
    ['Signed-in devices', 'You can revoke a session'],
  ];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Privacy and security</Text>
      {rows.map(([title, body]) => (
        <Card key={title}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.muted}>{body}</Text>
          <Button label="Manage" tone="secondary" onPress={() => notify(`${title} uses the identity service. This build previews the control.`)} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  value: { color: colors.ink, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 4 },
  cardOn: { borderColor: colors.green, backgroundColor: colors.soft },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, alignItems: 'center' },
});
