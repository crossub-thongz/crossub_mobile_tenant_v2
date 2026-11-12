import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { STATUS_LABEL } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Screen, Tag } from '@/src/ui/ui';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const applicationId = Array.isArray(id) ? id[0] : id;
  const { applications, uploadApplicationDocument } = useDemo();
  const application = applications.find((item) => item.id === applicationId);
  const [fileName, setFileName] = useState(application?.missingDocuments[0] ?? '');

  if (!application) {
    return (
      <Screen>
        <BackButton fallback="/applications" />
        <Text style={styles.body}>Application not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton fallback="/applications" />
      <Text style={styles.kicker}>{application.reference}</Text>
      <Text style={styles.title}>{application.propertyAddress}</Text>
      <Text style={styles.body}>Submitted {application.submittedAt}</Text>
      <Tag label={STATUS_LABEL[application.status]} tone={application.status === 'approved' ? 'green' : application.status === 'missing_information' ? 'amber' : 'neutral'} />
      <Card>
        <Text style={styles.label}>Applicant</Text>
        <Text style={styles.value}>{application.applicantName}</Text>
        <Text style={styles.body}>{application.email} · {application.phone}</Text>
        <Text style={styles.body}>Lease {application.leaseTerm} months · {application.occupants}</Text>
        <Text style={styles.body}>{application.employment}</Text>
      </Card>
      <Card>
        <Text style={styles.label}>Documents on file</Text>
        {application.documents.map((doc) => (
          <Text key={doc} style={styles.value}>{doc}</Text>
        ))}
      </Card>
      {application.status === 'missing_information' ? (
        <Card>
          <Text style={styles.label}>Upload missing documents</Text>
          {application.missingDocuments.map((doc) => (
            <Text key={doc} style={styles.body}>{doc}</Text>
          ))}
          <Field label="Document name">
            <Input value={fileName} onChangeText={setFileName} placeholder={application.missingDocuments[0]} />
          </Field>
          <Button label="Upload document" onPress={() => uploadApplicationDocument(application.id, fileName)} />
        </Card>
      ) : null}
      {application.status === 'approved' ? (
        <Button label="Start onboarding checklist" onPress={() => router.push('/onboarding')} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.ink, fontWeight: '700' },
  value: { color: colors.ink, fontSize: 14 },
});
