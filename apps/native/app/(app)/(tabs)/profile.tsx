import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { tenantApi } from '@/src/api/tenant';
import { useAuth } from '@/src/auth/auth-context';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, Notice, RowItem, Screen, Section, TabHeader } from '@/src/ui/ui';

function displayName(first: string | null | undefined, last: string | null | undefined): string {
  const name = [first, last].map((part) => part?.trim()).filter(Boolean).join(' ');
  return name || 'Name not recorded';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { email, user, logout } = useAuth();
  const demo = useDemo();
  const [name, setName] = useState(displayName(user?.firstName, user?.lastName));

  useEffect(() => {
    let cancelled = false;
    void tenantApi
      .profile()
      .then((profile) => {
        if (!cancelled) setName(displayName(profile.firstName, profile.lastName));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen tab>
      <TabHeader kicker="ACCOUNT & TENANCY" title="Profile" />
      <Card onPress={() => router.push('/flow/personal')}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.muted}>{email || 'No email on this account'}</Text>
      </Card>

      <Section title="My tenancy" />
      <Card>
        <RowItem icon="home-outline" title="My properties" subtitle="Current and previous tenancies" onPress={() => router.push('/flow/properties')} />
        <RowItem icon="search-outline" title="Browse listings" subtitle="Open inspections you can visit without a tenancy" onPress={() => router.push('/listings')} />
        <RowItem icon="document-outline" title="Applications" subtitle="Track what you have submitted" onPress={() => router.push('/applications')} />
        <RowItem icon="checkbox-outline" title="Move-in onboarding" subtitle="Deposit, bond, lease, and keys" onPress={() => router.push('/onboarding')} />
        <RowItem icon="document-text-outline" title="Tenancy details" subtitle="Read only" onPress={() => router.push('/flow/tenancy')} />
        <RowItem icon="reader-outline" title="Rent review" subtitle="Notice and your response" onPress={() => router.push('/rent-review')} />
        <RowItem icon="alert-circle-outline" title="Termination notice" subtitle="Reply date and move-out" onPress={() => router.push('/termination')} />
        <RowItem icon="folder-outline" title="Documents" subtitle="Newest first" onPress={() => router.push('/flow/documents')} />
        <RowItem icon="people-outline" title="Household members" subtitle="Names and roles only" onPress={() => router.push('/flow/household')} />
      </Card>

      <Section title="Account" />
      <Card>
        <RowItem icon="person-outline" title="Personal information" subtitle="Email and phone need verification" onPress={() => router.push('/flow/personal')} />
        <RowItem icon="notifications-outline" title="Notifications" subtitle="Notices from your tenancy" onPress={() => router.push('/flow/notifications')} />
        <RowItem icon="options-outline" title="Notification settings" subtitle="Which notices this phone shows" onPress={() => router.push('/flow/notification-settings')} />
        <RowItem icon="lock-closed-outline" title="Privacy and security" subtitle="Password, MFA, device unlock" onPress={() => router.push('/flow/security')} />
        <RowItem icon="help-circle-outline" title="Help" subtitle="FAQ, tutorial, and the access agreement" onPress={() => router.push('/help')} />
      </Card>

      <Section title="Account type" />
      {demo.accountStatus === 'ready' && demo.accountingKnown ? (
        <Card>
          <Text style={styles.name}>{demo.scenario.label}</Text>
          <Text style={styles.muted}>{demo.scenario.accounting}</Text>
        </Card>
      ) : null}
      {demo.accountStatus === 'ready' && !demo.accountingKnown ? (
        <Notice>Account type is not on this tenancy. It comes from the agency, and this account cannot change it.</Notice>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  signOut: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: colors.danger, fontWeight: '700' },
});
