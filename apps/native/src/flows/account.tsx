import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { downloadAuthedPdf, isApiFile } from '@/src/api/files';
import { requestPasswordReset } from '@/src/api/auth';
import { tenantApi } from '@/src/api/tenant';
import { deviceLockEnabled, disableDeviceLock, enableDeviceLock } from '@/src/auth/device-lock';
import { NOTICE_TYPE_LABEL, loadNoticePrefs, saveNoticePref, type NoticeTypeId } from '@/src/notifications/preferences';
import { money } from '@/src/demo/model';
import { useAuth } from '@/src/auth/auth-context';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

export function PropertiesScreen() {
  const { tenancies, current } = useDemo();
  const active = tenancies.filter((item) => item.current);
  const previous = tenancies.filter((item) => !item.current);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>My properties</Text>
      {tenancies.length === 0 ? <Notice>No properties are on this account.</Notice> : null}
      {active.length > 0 ? <Text style={styles.kicker}>CURRENT</Text> : null}
      {active.map((item) => (
        <Card key={item.id}>
          <Text style={styles.title}>{item.address}</Text>
          <Text style={styles.muted}>
            {[item.place, item.start && item.end ? `${item.start} – ${item.end}` : item.start || item.end].filter(Boolean).join(' · ')}
          </Text>
          {item.rent > 0 ? <Text style={styles.muted}>{money(item.rent)} {item.frequency.toLowerCase()}</Text> : null}
        </Card>
      ))}
      {previous.length > 0 ? <Text style={styles.kicker}>PREVIOUS</Text> : null}
      {previous.map((item) => (
        <Card key={item.id}>
          <Text style={styles.title}>{item.address}</Text>
          <Text style={styles.muted}>
            {[item.place, item.start && item.end ? `${item.start} – ${item.end}` : item.start || item.end].filter(Boolean).join(' · ')}
          </Text>
        </Card>
      ))}
      {!current && tenancies.length > 0 ? <Notice>This tenancy has ended. You can read what you are still allowed to see.</Notice> : null}
    </Screen>
  );
}

export function TenancyScreen() {
  const router = useRouter();
  const demo = useDemo();
  const { property, scenario } = demo;
  const rows = [
    ['Type', property.type],
    ['Start', property.start],
    ['End', property.end],
    ['Rent', property.rent > 0 ? `${money(property.rent)} ${property.frequency.toLowerCase()}` : ''],
    ['Managed by', scenario.team],
  ].filter(([, value]) => value);
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
      <Button label="Inspections" tone="outline" onPress={() => router.push('/flow/inspections')} />
      <Button label="Repairs" tone="outline" onPress={() => router.push('/flow/maintenance')} />
      <Button label="Report a repair" tone="outline" onPress={() => router.push('/flow/report')} />
      {demo.rentReview ? <Button label="Rent review" tone="outline" onPress={() => router.push(`/rent-review/${demo.rentReview!.id}`)} /> : null}
      {demo.terminationStarted ? <Button label="End of lease" tone="outline" onPress={() => router.push('/termination')} /> : null}
      {demo.onboardingActive ? <Button label="Move-in checklist" tone="outline" onPress={() => router.push('/onboarding')} /> : null}
      <Button label="Request a correction" tone="outline" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function DocumentsScreen() {
  const { documents } = useDemo();
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Documents</Text>
      <Text style={styles.muted}>Files on this tenancy. Invoices also appear under Payments.</Text>
      {documents.length === 0 ? <Notice>No documents are on this tenancy yet.</Notice> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {documents.map((doc) => (
        <Card key={doc.id} onPress={() => openDocument(doc.url, doc.name, setError)}>
          <Text style={styles.title}>{doc.name}</Text>
          <Text style={styles.muted}>{[doc.category.replaceAll('_', ' '), doc.uploaded].filter(Boolean).join(' · ')}</Text>
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

const HOUSEHOLD_ROLE = {
  PRIMARY_TENANT: 'Primary tenant',
  CO_TENANT: 'Co-tenant',
  OCCUPANT: 'Occupant',
  GUARANTOR: 'Guarantor',
} as const;

export function HouseholdScreen() {
  const [members, setMembers] = useState<Awaited<ReturnType<typeof tenantApi.household>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void tenantApi
      .household()
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load household members');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Household members</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {members && members.length === 0 ? <Notice>No household members are recorded on this tenancy.</Notice> : null}
      {members?.map((member) => (
        <Card key={member.id}>
          <Text style={styles.title}>
            {member.name || 'Name not recorded'}
            {member.isSelf ? ' (you)' : ''}
          </Text>
          <Text style={styles.muted}>{HOUSEHOLD_ROLE[member.role]}</Text>
          {member.propertyAddress ? <Text style={styles.muted}>{member.propertyAddress}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}

export function PersonalScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof tenantApi.profile>> | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void tenantApi
      .profile()
      .then((next) => {
        if (cancelled) return;
        setProfile(next);
        setPhone(next.phone ?? '');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this profile');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = [profile?.firstName ?? user?.firstName, profile?.lastName ?? user?.lastName].filter(Boolean).join(' ');
  const email = profile?.email || user?.email || '';

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Personal information</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <Text style={styles.muted}>Legal name</Text>
        <Text style={styles.title}>{name || 'Not on this account'}</Text>
        <Text style={styles.muted}>Email</Text>
        <Text style={styles.title}>{email || 'Not on this account'}</Text>
        <Field label="Phone">
          <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Not on this account" />
        </Field>
        <Button
          label={saving ? 'Saving' : 'Save phone'}
          onPress={() => {
            const next = phone.trim();
            if (!next) {
              setError('Enter a phone number.');
              return;
            }
            setSaving(true);
            setError(null);
            void tenantApi
              .updatePhone(next)
              .then((saved) => {
                setProfile(saved);
                setPhone(saved.phone ?? next);
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Could not save the phone number'))
              .finally(() => setSaving(false));
          }}
        />
      </Card>
      <Notice>Name and email stay as they are on the account. Only the phone number can be saved here.</Notice>
    </Screen>
  );
}

export function NotificationSettingsScreen() {
  const { notify } = useDemo();
  const [prefs, setPrefs] = useState<Record<NoticeTypeId, boolean> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadNoticePrefs().then((loaded) => {
      if (!cancelled) setPrefs(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Notification preferences</Text>
      <Notice>These choices stay on this phone. They hide notices in the app. They do not stop email.</Notice>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {(Object.keys(NOTICE_TYPE_LABEL) as NoticeTypeId[]).map((id) => (
        <Card key={id}>
          <Text style={styles.title}>{NOTICE_TYPE_LABEL[id]}</Text>
          <Text style={styles.muted}>{prefs?.[id] === false ? 'Hidden on this phone' : 'Showing on this phone'}</Text>
          <Button
            label={prefs?.[id] === false ? 'Show' : 'Hide'}
            tone="secondary"
            onPress={() => {
              if (!prefs) return;
              const next = prefs[id] === false;
              setError(null);
              void saveNoticePref(id, next)
                .then((saved) => {
                  setPrefs(saved);
                  notify('Saved on this phone');
                })
                .catch(() => setError('Could not save that choice on this phone'));
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}

export function SecurityScreen() {
  const { user } = useAuth();
  const { notify } = useDemo();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof tenantApi.sessions>> | null>(null);
  const [deviceLock, setDeviceLock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void tenantApi
      .profile()
      .then((profile) => {
        if (!cancelled) setMfaEnabled(profile.mfaEnabled);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load security settings');
      });
    void tenantApi
      .sessions()
      .then((rows) => {
        if (!cancelled) setSessions(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load sign-ins');
      });
    void deviceLockEnabled().then((on) => {
      if (!cancelled) setDeviceLock(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Privacy and security</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <Text style={styles.title}>Password</Text>
        <Text style={styles.muted}>A reset link is sent to the email on this account.</Text>
        <Button
          label="Email me a reset link"
          tone="secondary"
          onPress={() => {
            const email = user?.email;
            if (!email) {
              notify('No email is on this account.');
              return;
            }
            void requestPasswordReset(email)
              .then(() => notify('If this address has an account, the reset link is on its way.'))
              .catch((err) => notify(err instanceof Error ? err.message : 'Could not send the reset email'));
          }}
        />
      </Card>
      <Card>
        <Text style={styles.title}>Authenticator</Text>
        <Text style={styles.muted}>
          {mfaEnabled
            ? 'Authenticator is on for this account. Changing it is not available in the app.'
            : 'Authenticator setup is not available for this account.'}
        </Text>
      </Card>
      <Card>
        <Text style={styles.title}>Biometrics</Text>
        <Text style={styles.muted}>
          {deviceLock
            ? 'This phone asks for Face ID or a fingerprint the next time you open the app.'
            : 'Unlock this app with Face ID or a fingerprint. It stays on this phone.'}
        </Text>
        <Button
          label={deviceLock ? 'Turn off device unlock' : 'Unlock with biometrics'}
          tone="secondary"
          onPress={() => {
            setError(null);
            void (deviceLock ? disableDeviceLock() : enableDeviceLock()).then((message) => {
              if (message) {
                setError(message);
                return;
              }
              setDeviceLock(!deviceLock);
              notify(deviceLock ? 'Device unlock is off on this phone' : 'This phone will ask to unlock the app next time you open it');
            });
          }}
        />
      </Card>
      <Text style={styles.title}>Sign-ins</Text>
      {sessions && sessions.length === 0 ? <Notice>No live sign-ins are recorded.</Notice> : null}
      {sessions?.map((session) => (
        <Card key={session.id}>
          <Text style={styles.title}>{session.userAgent || 'Sign-in'}</Text>
          <Text style={styles.muted}>{sessionWhen(session.createdAt)}</Text>
          <Button
            label="Revoke this sign-in"
            tone="outline"
            onPress={() => {
              setError(null);
              void tenantApi
                .revokeSession(session.id)
                .then(() => setSessions((current) => current?.filter((item) => item.id !== session.id) ?? []))
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not revoke that sign-in'));
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}

function sessionWhen(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  value: { color: colors.ink, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, alignItems: 'center' },
  error: { color: colors.danger, fontSize: 13 },
});
