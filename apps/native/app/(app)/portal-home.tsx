import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cycleAmount, normalizeCycle } from '@/src/api/rent';
import { useAuth } from '@/src/auth/auth-context';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { ArrearsBanner, useRentArrears } from '@/src/flows/arrears-banner';
import { AppMenuButton } from '@/src/ui/app-menu';
import { BackButton, Screen } from '@/src/ui/ui';

const primary = '#00b894';
const ink = '#020617';
const muted = '#334155';
const line = '#e2e8f0';
const danger = '#ef4444';

type IonName = keyof typeof Ionicons.glyphMap;

function greeting(name: string): string {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${hello}, ${name}` : hello;
}

function cycleLabel(cycle: ReturnType<typeof normalizeCycle>): string {
  if (cycle === 'monthly') return 'Monthly';
  if (cycle === 'fortnightly') return 'Fortnightly';
  return 'Weekly';
}

export default function PortalHomeScreen({ tab = false }: { tab?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const demo = useDemo();
  const arrears = useRentArrears();
  const unreadNotices = demo.notices.some((item) => !item.read);
  const openRepairs = demo.maintenance.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
  const needsCompletion = openRepairs.find((item) => item.completionApprovalPending);
  const onboardingOpen =
    demo.onboardingActive &&
    (['deposit', 'bond', 'lease_signing', 'key_pickup'] as const).some((id) => demo.onboarding[id] !== 'completed');
  const pendingReview = demo.rentReview && demo.rentReviewStatus === 'pending' ? demo.rentReview : null;
  const cycle = normalizeCycle(demo.paymentCycle ?? demo.property.frequency);
  const rentAmount = arrears?.outstanding ?? (demo.property.rent > 0 ? cycleAmount(demo.property.rent, cycle) : 0);
  const accountsRent = demo.scenario.ledger;
  const showsLedger = accountsRent && demo.ledgerConnected && demo.current;

  const attention: { id: string; icon: IonName; title: string; subtitle: string; href: Href }[] = [];
  if (demo.routineAction) {
    attention.push({
      id: 'routine',
      icon: 'clipboard-outline',
      title: 'Routine inspection',
      subtitle: demo.routineAction.flow === 'self' ? 'Complete your self-inspection' : 'Be available for the visit',
      href: demo.routineAction.flow === 'self' ? '/flow/self-inspection' : '/flow/inspections',
    });
  }
  if (onboardingOpen) {
    attention.push({
      id: 'onboarding',
      icon: 'key-outline',
      title: 'Move-in checklist',
      subtitle: 'Deposit, bond, lease, and keys',
      href: '/onboarding',
    });
  }
  if (pendingReview) {
    attention.push({
      id: 'review',
      icon: 'trending-up-outline',
      title: 'Rent review',
      subtitle: `Proposed ${money(pendingReview.proposedRent)} / week`,
      href: `/rent-review/${pendingReview.id}`,
    });
  }
  if (demo.terminationStarted && demo.vacating) {
    attention.push({
      id: 'vacating',
      icon: 'exit-outline',
      title: 'End of lease',
      subtitle: `Vacate ${demo.vacating.vacateDate || 'the date on the notice'}`,
      href: '/termination',
    });
  }
  if (needsCompletion) {
    attention.push({
      id: 'repair-done',
      icon: 'construct-outline',
      title: 'Repair finished',
      subtitle: 'Confirm the work is complete',
      href: '/flow/maintenance',
    });
  }

  const progress = [
    ...openRepairs.slice(0, 2).map((item) => ({
      id: item.id,
      icon: 'construct-outline' as const,
      title: item.title,
      subtitle: item.urgent ? `Urgent · ${item.status}` : item.status,
      href: '/flow/maintenance' as Href,
    })),
    ...demo.inspections.slice(0, 1).map((item) => ({
      id: item.id,
      icon: 'clipboard-outline' as const,
      title: item.title,
      subtitle: item.when || item.status,
      href: '/flow/inspections' as Href,
    })),
    ...(demo.keyCollection?.time
      ? [{
          id: 'keys',
          icon: 'key-outline' as const,
          title: 'Key handover',
          subtitle: demo.keyCollection.time.slice(0, 16).replace('T', ' '),
          href: '/flow/keys' as Href,
        }]
      : []),
  ];

  const actions: { icon: IonName; label: string; href: Href }[] = [
    { icon: 'construct-outline', label: 'Report issue', href: '/flow/report' },
    { icon: 'chatbubble-outline', label: 'Contact us', href: '/flow/new-message' },
    { icon: 'clipboard-outline', label: 'Inspections', href: '/flow/inspections' },
    { icon: 'key-outline', label: 'Key handover', href: '/flow/keys' },
  ];

  return (
    <Screen tab={tab} background="#ffffff">
      {tab ? null : <BackButton fallback="/" />}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>My home</Text>
          <Text style={styles.greeting}>{greeting(user?.firstName?.trim().split(/\s+/)[0] ?? '')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/flow/notifications')}
            style={styles.bell}
          >
            <Ionicons name="notifications-outline" size={18} color={ink} />
            {unreadNotices ? <View style={styles.dot} /> : null}
          </Pressable>
          <AppMenuButton />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable key={action.label} accessibilityRole="button" onPress={() => router.push(action.href)} style={styles.action}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={18} color={primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(demo.current ? '/flow/tenancy' : '/listings')}
        style={styles.card}
      >
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>Your property</Text>
            <Text style={styles.address}>{demo.current ? demo.property.title : 'No property linked'}</Text>
            <Text style={styles.meta}>
              {demo.current ? `${demo.property.place || 'Current tenancy'} · ${demo.property.status}` : 'Browse listings to apply'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </View>
      </Pressable>

      <ArrearsBanner />

      {demo.accountStatus === 'loading' ? <Text style={styles.meta}>Loading your tenancy…</Text> : null}
      {demo.accountError ? <Text style={styles.error}>{demo.accountError}</Text> : null}

      {attention.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Needs your attention</Text>
            <Text style={styles.count}>{attention.length} {attention.length === 1 ? 'item' : 'items'}</Text>
          </View>
          <View style={styles.card}>
            {attention.slice(0, 3).map((item) => (
              <HomeRow key={item.id} icon={item.icon} title={item.title} subtitle={item.subtitle} href={item.href} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rent information</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(showsLedger ? '/payments' : '/flow/rent-details')}
          style={styles.card}
        >
          <View style={styles.between}>
            <Text style={styles.eyebrow}>{showsLedger ? 'Next rent payment' : 'Weekly rent'}</Text>
            <Text style={[styles.pill, arrears ? styles.pillDanger : showsLedger ? styles.pillGreen : styles.pillNeutral]}>
              {arrears ? 'Outstanding' : showsLedger ? 'Up to date' : accountsRent ? 'Crossub Accounting' : 'Agent trust'}
            </Text>
          </View>
          <Text style={styles.rent}>{rentAmount > 0 ? money(rentAmount) : '—'}</Text>
          <View style={styles.between}>
            <Text style={styles.meta}>
              {arrears
                ? `Due ${arrears.paidToLabel} · ${cycleLabel(cycle)}`
                : showsLedger
                  ? `Paid to ${demo.rentPaidTo || '—'} · ${cycleLabel(cycle)}`
                  : accountsRent
                    ? 'Rent is recorded in Crossub Accounting'
                    : 'Your agent manages this trust account'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={primary} />
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>In progress</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/activity')}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {progress.length === 0 ? <Text style={styles.meta}>Nothing is in progress.</Text> : null}
          {progress.map((item) => (
            <HomeRow key={item.id} icon={item.icon} title={item.title} subtitle={item.subtitle} href={item.href} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function HomeRow({ icon, title, subtitle, href }: { icon: IonName; title: string; subtitle: string; href: Href }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.meta}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, gap: 4 },
  kicker: { color: muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  greeting: { color: ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: danger },
  card: { borderRadius: 16, borderWidth: 1, borderColor: line, backgroundColor: '#fff', padding: 16, gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  eyebrow: { color: muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  address: { color: ink, fontSize: 16, fontWeight: '700', marginTop: 6 },
  meta: { color: muted, fontSize: 13, lineHeight: 18 },
  error: { color: danger, fontSize: 13 },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  count: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.15)',
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rent: { color: ink, fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },
  pill: { overflow: 'hidden', borderRadius: 999, fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3 },
  pillGreen: { backgroundColor: 'rgba(0,184,148,0.15)', color: primary },
  pillDanger: { backgroundColor: 'rgba(239,68,68,0.12)', color: danger },
  pillNeutral: { backgroundColor: '#f1f5f9', color: muted },
  link: { color: primary, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,184,148,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: ink, fontSize: 15, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,184,148,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: ink, fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
