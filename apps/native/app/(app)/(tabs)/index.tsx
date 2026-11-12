import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Card, RowItem, Screen, Section, TabHeader, Tag } from '@/src/ui/ui';

export default function HomeScreen() {
  const router = useRouter();
  const demo = useDemo();
  const { property, scenario, current, maintenance, notices, rentReview, inspections, accountStatus, accountError, rentPaidTo } = demo;
  const attention = notices
    .filter((item) => !item.read)
    .map((item) => ({ id: item.id, icon: 'notifications-outline' as const, title: item.title, subtitle: item.body, href: item.href }));
  const progress = [
    ...maintenance.map((item) => ({
      id: `repair-${item.id}`,
      icon: 'construct-outline' as const,
      title: item.title,
      subtitle: item.urgent ? `Urgent · ${item.status}` : item.status,
      href: '/flow/maintenance',
    })),
    ...inspections.slice(0, 2).map((item) => ({
      id: `inspection-${item.id}`,
      icon: 'clipboard-outline' as const,
      title: item.title,
      subtitle: item.when || item.status,
      href: '/flow/inspection',
    })),
  ];

  return (
    <Screen tab>
      <TabHeader kicker="MY HOME" title="Good morning" />
      <Pressable accessibilityRole="button" onPress={() => router.push('/portal-home')} style={styles.portalLink}>
        <Text style={styles.link}>Open web home</Text>
      </Pressable>
      {accountStatus === 'loading' || accountStatus === 'idle' ? <Text style={styles.muted}>Loading your tenancy…</Text> : null}
      {accountError ? <Text style={styles.muted}>{accountError}</Text> : null}
      {rentReview && rentReview ? (
        <Card onPress={() => router.push(`/rent-review/${rentReview.id}`)}>
          <Text style={styles.kicker}>RENT REVIEW</Text>
          <Text style={styles.address}>{money(rentReview.proposedRent)} / week proposed</Text>
          <Text style={styles.muted}>Effective {rentReview.effective || 'the date on the notice'}.</Text>
        </Card>
      ) : null}
      <Card onPress={() => router.push('/flow/properties')}>
        <Text style={styles.kicker}>YOUR PROPERTY</Text>
        <Text style={styles.address}>{property.title}</Text>
        <Text style={styles.muted}>
          {property.place} · {property.status}
        </Text>
      </Card>

      {attention.length > 0 ? (
        <View style={styles.block}>
          <Section title="Needs your attention" action={<Tag label={`${attention.length} items`} tone="amber" />} />
          <Card soft>
            {attention.map((item) => (
              <RowItem key={item.id} icon={item.icon} title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href)} />
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.block}>
        <Section title="Rent information" />
        <Card onPress={() => router.push(scenario.ledger && current ? '/flow/ledger' : '/flow/rent-details')}>
          <View style={styles.between}>
            <Text style={styles.muted}>{scenario.ledger && current ? 'WEEKLY RENT' : 'WEEKLY RENT'}</Text>
            <Tag label={scenario.ledger && current ? 'Crossub Accounting' : 'Agent managed'} tone={scenario.ledger && current ? 'green' : 'neutral'} />
          </View>
          <Text style={styles.amount}>{money(property.rent)}</Text>
          <Text style={styles.muted}>
            {scenario.ledger && current
              ? `Paid to ${rentPaidTo || 'the date on your ledger'}`
              : 'Payment records stay with your agent. This app does not guess arrears.'}
          </Text>
        </Card>
      </View>

      {current && progress.length > 0 ? (
        <View style={styles.block}>
          <Section
            title="In progress"
            action={
              <Pressable accessibilityRole="button" onPress={() => router.push('/activity')}>
                <Text style={styles.link}>View all</Text>
              </Pressable>
            }
          />
          <Card>
            {progress.slice(0, 3).map((item) => (
              <RowItem key={item.id} icon={item.icon} title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href)} />
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.block}>
        <Section title="Quick actions" />
        <View style={styles.actions}>
          {[
            { icon: 'construct-outline' as const, label: 'Report issue', href: '/flow/report' },
            { icon: 'chatbubble-outline' as const, label: 'Contact us', href: '/flow/new-message' },
            { icon: 'clipboard-outline' as const, label: 'Inspections', href: '/flow/inspections' },
            { icon: 'key-outline' as const, label: 'Key handover', href: '/flow/keys' },
          ].map((action) => (
            <Pressable key={action.label} accessibilityRole="button" style={styles.action} onPress={() => {
                if (action.href === '/flow/report' && !current) {
                  demo.notify('This tenancy has ended. New requests are closed.');
                  return;
                }
                router.push(action.href);
              }}>
              <Ionicons name={action.icon} size={20} color="#53695b" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 6 },
  muted: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  block: { gap: 10, marginTop: 8 },
  link: { color: colors.green, fontWeight: '700', fontSize: 12 },
  portalLink: { alignSelf: 'flex-start', marginTop: -8 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 82,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 6,
  },
  actionLabel: { color: '#53695b', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
