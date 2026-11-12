import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-context';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { BackButton, Screen } from '@/src/ui/ui';

const primary = '#00b894';
const ink = '#020617';
const muted = '#334155';
const line = '#e2e8f0';
const danger = '#ef4444';

type IonName = keyof typeof Ionicons.glyphMap;

function countdown(iso: string | null): { label: string; date: string; overdue: boolean } | null {
  if (!iso) return null;
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const date = target.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday' : days > 0 ? `In ${days} days` : `${Math.abs(days)} days overdue`;
  return { label, date, overdue: days < 0 };
}

function displayName(firstName?: string, lastName?: string, email?: string | null): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || 'Tenant';
}

function SummaryCard({
  icon,
  title,
  summary,
  href,
  badge,
  urgent = false,
}: {
  icon: IonName;
  title: string;
  summary: string;
  href: Href;
  badge?: string;
  urgent?: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={[styles.summary, urgent && styles.summaryUrgent]}
    >
      <View style={[styles.iconBox, urgent && styles.iconBoxUrgent]}>
        <Ionicons name={icon} size={20} color={urgent ? danger : primary} />
      </View>
      <View style={styles.summaryBody}>
        <View style={styles.titleRow}>
          <Text style={styles.summaryTitle}>{title}</Text>
          {badge ? <Text style={[styles.badge, urgent && styles.badgeUrgent]}>{badge}</Text> : null}
        </View>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
    </Pressable>
  );
}

export default function PortalHomeScreen() {
  const { user } = useAuth();
  const demo = useDemo();
  const openRepairs = demo.maintenance.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
  const unread = demo.threads.reduce((sum, thread) => sum + (thread.unread ? 1 : 0), 0);
  const needsCompletion = openRepairs.find((item) => item.completionApprovalPending);
  const onboardingOpen =
    demo.onboardingActive &&
    (['deposit', 'bond', 'lease_signing', 'key_pickup'] as const).some((id) => demo.onboarding[id] !== 'completed');
  const routine = countdown(demo.nextRoutineAt);
  const reviewWindow = countdown(demo.nextRentReviewAt);
  const pendingReview = demo.rentReview && demo.rentReviewStatus === 'pending' ? demo.rentReview : null;
  const leaseLine = demo.current
    ? `${demo.property.title} · ${money(demo.property.rent)}/week`
    : 'No property linked — browse new leasing properties to apply';
  const hasActions = Boolean((demo.terminationStarted && demo.vacating) || onboardingOpen || pendingReview || needsCompletion);

  return (
    <Screen>
      <BackButton fallback="/" />
      <Text style={styles.pageTitle}>Home</Text>

      <View style={styles.welcome}>
        <Text style={styles.welcomeKicker}>Welcome back</Text>
        <Text style={styles.welcomeName}>{displayName(user?.firstName, user?.lastName, user?.email)}</Text>
        <Text style={styles.welcomeAddress}>
          {demo.current ? demo.property.title : 'Your tenancy summary will appear here once a lease is linked.'}
        </Text>
        {demo.current && demo.property.place ? <Text style={styles.welcomeAddress}>{demo.property.place}</Text> : null}
      </View>

      {demo.accountStatus === 'loading' ? <Text style={styles.loading}>Loading your tenancy…</Text> : null}
      {demo.accountError ? <Text style={styles.loading}>{demo.accountError}</Text> : null}

      {demo.current && (routine || reviewWindow) ? (
        <View style={styles.timers}>
          {routine ? (
            <Timer icon="clipboard-outline" label="Next routine inspection" countdown={routine} href="/flow/inspections" detail="Your property manager will schedule a routine visit or self-inspection around this date." />
          ) : null}
          {reviewWindow ? (
            <Timer icon="trending-up-outline" label="Upcoming rent review" countdown={reviewWindow} href="/rent-review" detail="Your property manager can begin the next rent review from this date. We will notify you when a formal notice is issued." />
          ) : null}
        </View>
      ) : null}

      {hasActions ? <Text style={styles.section}>Action required</Text> : null}
      {hasActions ? <View style={styles.stack}>
        {demo.terminationStarted && demo.vacating ? (
          <SummaryCard
            urgent
            icon="alert-circle-outline"
            title="End of lease"
            summary={`Vacate ${demo.vacating.vacateDate || 'the date on the notice'} · ${demo.vacating.reason}`}
            href="/termination"
            badge="Active"
          />
        ) : null}
        {onboardingOpen ? (
          <SummaryCard
            urgent
            icon="key-outline"
            title="New lease onboarding"
            summary={`${demo.property.title} · complete move-in steps`}
            href="/onboarding"
            badge="Required"
          />
        ) : null}
        {pendingReview ? (
          <SummaryCard
            urgent
            icon="wallet-outline"
            title="Rent review notice"
            summary={`Proposed ${money(pendingReview.proposedRent)}/week — ${pendingReview.negotiable ? 'accept, request a review, or dispute' : 'accept or dispute (non-negotiable)'}`}
            href={`/rent-review/${pendingReview.id}`}
            badge="Required"
          />
        ) : null}
        {needsCompletion ? (
          <SummaryCard
            urgent
            icon="construct-outline"
            title="Completion approval needed"
            summary="A repair is finished — confirm work completed"
            href="/flow/maintenance"
            badge="!"
          />
        ) : null}
        </View> : null}

      <Text style={styles.section}>Your tenancy</Text>
      <View style={styles.stack}>
        <SummaryCard icon="business-outline" title="Property details" summary={leaseLine} href={demo.current ? '/flow/tenancy' : '/listings'} />
        <SummaryCard
          icon="clipboard-outline"
          title="Inspection"
          summary={`${demo.inspections.length} inspection record(s)`}
          href="/flow/inspections"
        />
        <SummaryCard
          icon="construct-outline"
          title="Repair"
          summary={openRepairs.length > 0 ? `${openRepairs.length} active · ${openRepairs[0]?.status ?? ''}` : 'No open repairs — report an issue anytime'}
          href="/flow/maintenance"
          badge={openRepairs.length > 0 ? String(openRepairs.length) : undefined}
        />
        <SummaryCard
          icon="wallet-outline"
          title="Accounting"
          summary={demo.current ? `${demo.ledger.length} ledger line(s) · pay rent or view history` : 'Pay rent and view receipts when a lease is linked'}
          href="/payments"
        />
        {demo.rentReview ? (
          <SummaryCard
            icon="trending-up-outline"
            title="Rent review notice"
            summary={pendingReview ? `Proposed ${money(pendingReview.proposedRent)}/week — respond required` : 'Past review on this tenancy'}
            href={pendingReview ? `/rent-review/${pendingReview.id}` : '/rent-review'}
            badge={pendingReview ? 'Required' : undefined}
          />
        ) : null}
        <SummaryCard
          icon="chatbubble-outline"
          title="Message"
          summary={unread > 0 ? `${unread} unread · landlord, agent, or contractor` : 'Contact by leasing, maintenance, inspection, or accounting'}
          href="/inbox"
          badge={unread > 0 ? String(unread) : undefined}
        />
      </View>
    </Screen>
  );
}

function Timer({
  icon,
  label,
  countdown: value,
  detail,
  href,
}: {
  icon: IonName;
  label: string;
  countdown: { label: string; date: string; overdue: boolean };
  detail: string;
  href: Href;
}) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={[styles.timer, value.overdue && styles.timerWarn]}>
      <View style={styles.timerHead}>
        <Ionicons name={icon} size={16} color={value.overdue ? '#d97706' : primary} />
        <Text style={styles.timerLabel}>{label}</Text>
      </View>
      <Text style={styles.timerCount}>{value.label}</Text>
      <Text style={styles.timerDetail}>{detail}</Text>
      <Text style={styles.timerDate}>{value.date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pageTitle: { color: ink, fontSize: 22, fontWeight: '700' },
  welcome: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,184,148,0.25)',
    backgroundColor: '#ecfdf8',
    padding: 20,
    gap: 4,
  },
  welcomeKicker: { color: muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  welcomeName: { color: ink, fontSize: 18, fontWeight: '700', marginTop: 4 },
  welcomeAddress: { color: muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  loading: { color: muted, fontSize: 13 },
  timers: { gap: 12 },
  timer: { borderRadius: 16, borderWidth: 1, borderColor: line, backgroundColor: '#fff', padding: 16 },
  timerWarn: { borderColor: 'rgba(245,158,11,0.45)' },
  timerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerLabel: { color: muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  timerCount: { color: ink, fontSize: 24, fontWeight: '700', marginTop: 10 },
  timerDetail: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  timerDate: { color: ink, fontSize: 14, fontWeight: '600', marginTop: 8 },
  section: { color: muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 8 },
  stack: { gap: 8 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: '#fff',
    padding: 16,
  },
  summaryUrgent: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,184,148,0.1)', alignItems: 'center', justifyContent: 'center' },
  iconBoxUrgent: { backgroundColor: 'rgba(239,68,68,0.15)' },
  summaryBody: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { color: ink, fontSize: 14, fontWeight: '700' },
  badge: { backgroundColor: 'rgba(0,184,148,0.15)', color: primary, overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, fontSize: 10, fontWeight: '700' },
  badgeUrgent: { backgroundColor: 'rgba(239,68,68,0.2)', color: danger },
  summaryText: { color: muted, fontSize: 12, lineHeight: 18 },
});
