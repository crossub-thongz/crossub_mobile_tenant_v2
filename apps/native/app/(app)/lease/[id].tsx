import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { LEASE_DOCUMENTS } from '@/src/demo/tenancy-notices';
import { colors } from '@/src/theme';
import { BackButton, Card, Notice, Screen } from '@/src/ui/ui';

export default function LeaseDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const docId = Array.isArray(id) ? id[0] : id;
  const doc = LEASE_DOCUMENTS.find((item) => item.id === docId);

  if (!doc) {
    return (
      <Screen>
        <BackButton fallback="/lease" />
        <Text style={styles.body}>Document not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton fallback="/lease" />
      <Text style={styles.kicker}>LEASE DOCUMENT</Text>
      <Text style={styles.title}>{doc.name}</Text>
      <Text style={styles.body}>Uploaded {doc.uploaded}</Text>
      <Card>
        <Text style={styles.body}>{doc.body}</Text>
      </Card>
      <Notice>The signed file opens from a short-lived link once the tenant account is connected. This screen shows the record, not the PDF.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
