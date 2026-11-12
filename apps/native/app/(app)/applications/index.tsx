import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { STATUS_LABEL } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen, Tag } from '@/src/ui/ui';

export default function ApplicationsScreen() {
  const router = useRouter();
  const { applications } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/profile" />
      <Text style={styles.title}>Applications</Text>
      <Text style={styles.body}>Track your application on properties where a new-leasing case is open.</Text>
      {applications.length === 0 ? (
        <Card>
          <Text style={styles.body}>No applications yet. Apply from a listing, and it will show up here.</Text>
        </Card>
      ) : (
        applications.map((item) => (
          <Card key={item.id} onPress={() => router.push(`/applications/${item.id}`)}>
            <Text style={styles.address}>{item.propertyAddress}</Text>
            <Text style={styles.body}>Ref {item.reference}</Text>
            <Text style={styles.body}>Submitted {item.submittedAt}</Text>
            <Tag label={STATUS_LABEL[item.status]} tone={item.status === 'approved' ? 'green' : item.status === 'missing_information' ? 'amber' : 'neutral'} />
            {item.missingDocuments.length > 0 ? (
              <Text style={styles.warn}>{item.missingDocuments.length} document(s) required</Text>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  warn: { color: colors.amber, fontSize: 12, fontWeight: '700' },
});
