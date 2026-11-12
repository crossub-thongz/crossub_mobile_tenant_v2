import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text } from 'react-native';

import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Card, Screen, Tag } from '@/src/ui/ui';

export default function LeaseScreen() {
  const router = useRouter();
  const { property, documents } = useDemo();

  return (
    <Screen>
      <BackButton fallback="/flow/tenancy" />
      <Text style={styles.title}>My lease</Text>
      <Card>
        <Text style={styles.address}>{property.title}</Text>
        <Text style={styles.rent}>{money(property.rent)} / week</Text>
        <Text style={styles.body}>
          {property.start} – {property.end}
        </Text>
        <Tag label={property.status} tone="green" />
      </Card>
      <Text style={styles.section}>Documents</Text>
      {documents.length === 0 ? <Text style={styles.body}>No documents are on this tenancy yet.</Text> : null}
      {documents.map((doc) => (
        <Card key={doc.id} onPress={() => (doc.url ? void Linking.openURL(doc.url) : router.push(`/lease/${encodeURIComponent(doc.id)}`))}>
          <Text style={styles.address}>{doc.name}</Text>
          <Text style={styles.body}>Uploaded {doc.uploaded}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  section: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  rent: { color: colors.green, fontSize: 18, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
