import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { inspectionPath } from '@/src/api/load-account';
import { cycleAmount, normalizeCycle } from '@/src/api/rent';
import { useAuth } from '@/src/auth/auth-context';
import { money } from '@/src/demo/model';
import { colors } from '@/src/theme';
import { useDemo } from '@/src/demo/store';
import { useRentArrears } from '@/src/flows/arrears-banner';
import { AppMenuButton } from '@/src/ui/app-menu';
import { BackButton, Screen } from '@/src/ui/ui';

type IonName = keyof typeof Ionicons.glyphMap;

function statusTone(status: string): 'progress' | 'done' | 'attention' {
  const value = status.toLowerCase();
  if (value.includes('complete') || value.includes('approved')) return 'done';
  if (value.includes('action') || value.includes('required')) return 'attention';
  return 'progress';
}

function statusText(status: string): string {
  const words = status.replaceAll('_', ' ').toLowerCase();
  return words.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
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
    const routine = demo.routineAction;
    attention.push({
      id: 'routine',
      icon: 'clipboard-outline',
      title: 'Routine inspection',
      subtitle: routine.flow === 'self' && routine.actionRequired ? 'Complete your self-inspection' : routine.scheduledAt?.slice(0, 10) || 'Open the visit',
      href: routine.flow === 'self' && routine.actionRequired ? '/flow/self-inspection' : `/flow/inspection?id=${routine.id}`,
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
      href: `/flow/maintenance?job=${needsCompletion.id}`,
    });
  }

  const selfInspectionId = demo.routineAction?.flow === 'self' && demo.routineAction.actionRequired ? demo.routineAction.id : null;
  const featuredInspection = (demo.routineAction ? demo.inspections.find((item) => item.id === demo.routineAction?.id) : undefined)
    ?? demo.inspections.find((item) => !['completed', 'cancelled', 'COMPLETED', 'CANCELLED', 'PUBLISHED'].includes(item.status));
  const progress = [
    ...openRepairs.slice(0, 2).map((item) => ({
      id: item.id,
      icon: 'construct-outline' as const,
      title: item.title,
      subtitle: item.urgent ? `Urgent · ${item.status}` : item.status,
      href: `/flow/maintenance?job=${item.id}` as Href,
    })),
    ...(featuredInspection
      ? [{
          id: featuredInspection.id,
          icon: 'clipboard-outline' as const,
          title: featuredInspection.title,
          subtitle: featuredInspection.when || featuredInspection.status,
          href: inspectionPath(featuredInspection.type, featuredInspection.id, selfInspectionId) as Href,
        }]
      : []),
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

  const actions: { icon: IonName; title: string; subtitle: string; href: Href }[] = [
    { icon: 'construct-outline', title: 'Report Issue', subtitle: 'Submit maintenance request', href: '/flow/report' },
    { icon: 'call-outline', title: 'Contact Us', subtitle: 'Contact us tell us your request', href: '/flow/new-message' },
    { icon: 'clipboard-outline', title: 'Inspections', subtitle: 'Manage your inspections', href: '/flow/inspections' },
    { icon: 'key-outline', title: 'Key Handover', subtitle: 'Submit key handover', href: '/flow/keys' },
  ];

  const slides: { id: string; title: string; meta: string; value: string; action: string; href: Href }[] = [];
  if (arrears) {
    slides.push({
      id: 'arrears',
      title: 'Rent past the paid-to date',
      meta: `Due on ${arrears.paidToLabel}`,
      value: money(arrears.outstanding),
      action: 'Pay Now',
      href: '/payments',
    });
  }
  if (demo.terminationStarted && demo.vacating) {
    slides.push({
      id: 'vacating',
      title: 'End of lease',
      meta: 'Vacate',
      value: demo.vacating.vacateDate || 'Date on the notice',
      action: 'Renew Now',
      href: '/termination',
    });
  }
  if (!arrears && rentAmount > 0) {
    slides.push({
      id: 'rent',
      title: 'Next Rent Payment',
      meta: cycleLabel(cycle),
      value: money(rentAmount),
      action: 'Pay Now',
      href: showsLedger ? '/payments' : '/flow/rent-details',
    });
  }
  for (const item of attention) {
    if (item.id === 'vacating') continue;
    slides.push({ id: item.id, title: item.title, meta: '', value: item.subtitle, action: 'Open', href: item.href });
  }
  const name = [user?.firstName, user?.lastName].map((part) => part?.trim()).filter(Boolean).join(' ');

  return (
    <Screen tab={tab} background={colors.bg}>
      {tab ? null : <BackButton fallback="/" />}
      <View style={styles.helloCard}>
        <View style={styles.helloRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
          <Text style={styles.hello}>{name ? `Hi, ${name}` : 'Hi'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/flow/notifications')} style={styles.round}>
            <Ionicons name="notifications-outline" size={18} color={colors.ink} />
            {unreadNotices ? <View style={styles.dot} /> : null}
          </Pressable>
          <AppMenuButton />
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push(demo.current ? '/flow/properties' : '/listings')} style={styles.address}>
          <Ionicons name="business" size={16} color={colors.green} />
          <View style={styles.flex}>
            <Text style={styles.addressKicker}>Current Address</Text>
            <Text style={styles.addressTitle}>{demo.current ? demo.property.title : 'No property linked'}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
        </Pressable>
      </View>

      <Text style={styles.section}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable key={action.title} accessibilityRole="button" onPress={() => router.push(action.href)} style={styles.action}>
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={18} color={colors.green} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSub}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {slides.length > 0 ? (
        <>
          <Text style={styles.section}>Needs Your Attention</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slideRow}>
            {slides.map((slide) => (
              <Pressable key={slide.id} accessibilityRole="button" onPress={() => router.push(slide.href)} style={styles.alert}>
                <Text style={styles.alertTitle}>{slide.title}</Text>
                <View style={styles.alertBody}>
                  <View style={styles.flex}>
                    {slide.meta ? <Text style={styles.alertMeta}>{slide.meta}</Text> : null}
                    <Text style={styles.alertValue}>{slide.value}</Text>
                  </View>
                  <View style={styles.pay}>
                    <Text style={styles.payText}>{slide.action}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {demo.accountStatus === 'loading' ? <Text style={styles.meta}>Loading your tenancy…</Text> : null}
      {demo.accountError ? <Text style={styles.error}>{demo.accountError}</Text> : null}

      <Text style={styles.section}>In Progress</Text>
      {progress.length === 0 ? <Text style={styles.meta}>Nothing is in progress.</Text> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slideRow}>
          {progress.map((item) => {
            const tone = statusTone(item.subtitle);
            return (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(item.href)} style={styles.job}>
                <View style={styles.jobIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.green} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.meta}>{item.subtitle}</Text>
                  <View style={[styles.pill, tone === 'done' && styles.pillDone, tone === 'attention' && styles.pillAlert]}>
                    <Text style={[styles.pillText, tone === 'done' && styles.pillTextDone, tone === 'attention' && styles.pillTextAlert]}>
                      {statusText(item.subtitle.split(' · ').pop() || item.subtitle)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#b7c4bd" />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  helloCard: { backgroundColor: '#fff', borderRadius: 24, padding: 14, gap: 12 },
  helloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#12324a', alignItems: 'center', justifyContent: 'center' },
  hello: { flex: 1, color: colors.green, fontSize: 18, fontWeight: '700' },
  round: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  address: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.soft, borderRadius: 16, padding: 12 },
  addressKicker: { color: colors.muted, fontSize: 11 },
  addressTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  flex: { flex: 1 },
  section: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, gap: 8, minHeight: 132 },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  actionSub: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  slideRow: { gap: 12, paddingRight: 8 },
  alert: { width: 280, backgroundColor: colors.danger, borderRadius: 22, padding: 16, gap: 12 },
  alertTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  alertBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  alertMeta: { color: '#ffe4e4', fontSize: 12 },
  alertValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  pay: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  payText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  error: { color: colors.danger, fontSize: 13 },
  job: { width: 260, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 22, padding: 14 },
  jobIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#fff1d6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  pillDone: { backgroundColor: colors.greenTag },
  pillAlert: { backgroundColor: '#ffe1e1' },
  pillText: { color: colors.amber, fontSize: 11, fontWeight: '700' },
  pillTextDone: { color: colors.green },
  pillTextAlert: { color: colors.danger },
});

