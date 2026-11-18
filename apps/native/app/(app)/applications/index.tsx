import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { tenantApi } from '@/src/api/tenant';
import { STATUS_LABEL } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen, Tag } from '@/src/ui/ui';

const LIFECYCLE_LABEL = {
  open_inspection: 'Open inspection',
  open_report: 'Open report',
  application_approval: 'Application approval',
  onboarding: 'Onboarding',
} as const;

type NewLeasing = Awaited<ReturnType<typeof tenantApi.newLeasing>>[number];

export default function ApplicationsScreen() {
  const router = useRouter();
  const { applications } = useDemo();
  const [cases, setCases] = useState<NewLeasing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void tenantApi
      .newLeasing()
      .then((rows) => {
        if (!cancelled) setCases(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load new-leasing cases');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const leasingIds = new Set((cases ?? []).map((item) => item.applicationId));
  const otherApplications = applications.filter((item) => !leasingIds.has(item.id));

  return (
    <Screen>
      <BackButton fallback="/profile" />
      <Text style={styles.title}>Applications</Text>
      <Text style={styles.body}>Track your application on properties where a new-leasing case is open.</Text>
      {error ? <Text style={styles.warn}>{error}</Text> : null}
      {cases && cases.length === 0 ? <Text style={styles.body}>No new-leasing case is open.</Text> : null}
      {cases?.map((item) => (
        <Card
          key={item.cycleId}
          onPress={() => router.push(item.onboardingActive ? '/onboarding' : `/applications/${item.applicationId}`)}
        >
          <Text style={styles.address}>{item.propertyAddress || 'Property'}</Text>
          <Text style={styles.body}>Ref {item.reference}</Text>
          <Text style={styles.body}>{LIFECYCLE_LABEL[item.lifecycleStep]}</Text>
          <Tag label={STATUS_LABEL[item.applicationStatus === 'APPROVED' || item.applicationStatus === 'LEASED' ? 'approved' : item.applicationStatus === 'DECLINED' || item.applicationStatus === 'WITHDRAWN' ? 'declined' : item.applicationStatus === 'DRAFT' ? 'missing_information' : 'submitted']} />
        </Card>
      ))}
      {otherApplications.map((item) => (
        <Card key={item.id} onPress={() => router.push(`/applications/${item.id}`)}>
          <Text style={styles.address}>{item.propertyAddress}</Text>
          <Text style={styles.body}>Ref {item.reference}</Text>
          <Text style={styles.body}>Submitted {item.submittedAt}</Text>
          <Tag label={STATUS_LABEL[item.status]} tone={item.status === 'approved' ? 'green' : item.status === 'missing_information' ? 'amber' : 'neutral'} />
          {item.missingDocuments.length > 0 ? (
            <Text style={styles.warn}>{item.missingDocuments.length} document(s) required</Text>
          ) : null}
        </Card>
      ))}
      {cases && cases.length === 0 && otherApplications.length === 0 ? (
        <Card>
          <Text style={styles.body}>No applications yet. Apply from a listing, and it will show up here.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  warn: { color: colors.amber, fontSize: 12, fontWeight: '700' },
});
