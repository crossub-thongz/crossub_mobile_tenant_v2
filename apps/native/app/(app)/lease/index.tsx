import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';

import { downloadAuthedPdf, isApiFile } from '@/src/api/files';
import { money } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen, Tag } from '@/src/ui/ui';

export default function LeaseScreen() {
  const router = useRouter();
  const { property, documents, rentReview } = useDemo();
  const [error, setError] = useState<string | null>(null);

  function openFile(path: string, fileName: string) {
    setError(null);
    void downloadAuthedPdf(path, fileName).catch((err) => setError(err instanceof Error ? err.message : 'Could not download this file'));
  }

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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Download tenancy agreement" tone="outline" onPress={() => openFile('/api/v1/tenant/leasing/onboarding/agreement.pdf', 'tenancy-agreement.pdf')} />
      {rentReview ? (
        <Button
          label="Download notice of rent increase"
          tone="outline"
          onPress={() => openFile(`/api/v1/tenant/rent-reviews/${rentReview.id}/notice-of-rent-increase.pdf`, 'notice-of-rent-increase.pdf')}
        />
      ) : null}
      <Text style={styles.section}>Documents</Text>
      {documents.length === 0 ? <Text style={styles.body}>No documents are on this tenancy yet.</Text> : null}
      {documents.map((doc) => (
        <Card
          key={doc.id}
          onPress={() => {
            if (!doc.url) {
              router.push(`/lease/${encodeURIComponent(doc.id)}`);
              return;
            }
            if (isApiFile(doc.url)) {
              openFile(doc.url, `${doc.name.replace(/[^\w.-]+/g, '-')}.pdf`);
              return;
            }
            void Linking.openURL(doc.url);
          }}
        >
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
  error: { color: colors.danger, fontSize: 13 },
});
