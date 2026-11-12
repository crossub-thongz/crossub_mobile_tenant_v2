import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCENARIOS } from '@/src/demo/model';
import { useAuth } from '@/src/auth/auth-context';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, RowItem, Screen, Section, TabHeader } from '@/src/ui/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { email, logout } = useAuth();
  const demo = useDemo();

  return (
    <Screen tab>
      <TabHeader kicker="ACCOUNT & TENANCY" title="Profile" />
      <Card onPress={() => router.push('/flow/personal')}>
        <Text style={styles.name}>Daniel Zhou</Text>
        <Text style={styles.muted}>{email ?? 'daniel@example.com'}</Text>
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
        <RowItem icon="notifications-outline" title="Notifications" subtitle="Routine updates only" onPress={() => router.push('/flow/notification-settings')} />
        <RowItem icon="lock-closed-outline" title="Privacy and security" subtitle="Password, MFA, device unlock" onPress={() => router.push('/flow/security')} />
        <RowItem icon="help-circle-outline" title="Help" subtitle="FAQ, tutorial, and the access agreement" onPress={() => router.push('/help')} />
      </Card>

      <Section title="Preview scenario" />
      <Text style={styles.muted}>Local preview of management and accounting. The live app will read these flags from the tenancy, not from this list.</Text>
      <View style={styles.scenarios}>
        {SCENARIOS.map((scenario) => {
          const selected = scenario.id === demo.scenarioId;
          return (
            <Pressable
              key={scenario.id}
              accessibilityRole="button"
              onPress={() => demo.setScenario(scenario.id)}
              style={[styles.scenario, selected && styles.scenarioOn]}
            >
              <Text style={[styles.scenarioText, selected && styles.scenarioTextOn]}>{scenario.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  scenarios: { gap: 8 },
  scenario: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 12, padding: 12 },
  scenarioOn: { borderColor: colors.green, backgroundColor: colors.soft },
  scenarioText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  scenarioTextOn: { color: colors.green },
  signOut: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: colors.danger, fontWeight: '700' },
});
