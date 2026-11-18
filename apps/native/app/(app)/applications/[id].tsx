import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { downloadAuthedPdf, isApiFile } from '@/src/api/files';
import { pickEvidence } from '@/src/api/pick-evidence';
import { messageAttachment, tenantApi, type EvidenceFile } from '@/src/api/tenant';
import { STATUS_LABEL, type ApplicationStatus } from '@/src/demo/applications';
import { useDemo } from '@/src/demo/store';
import { APPLICATION_DOCUMENT_SLOTS } from '@/src/leasing/application-slots';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen, Tag } from '@/src/ui/ui';
import type { components } from '@crossub-thongz/api-contract';

type ApplicationDetail = components['schemas']['TenantApplicationDetailResponseDto'];

const APPLICATION_STATUS = {
  APPROVED: 'APPROVED',
  LEASED: 'LEASED',
  DECLINED: 'DECLINED',
  WITHDRAWN: 'WITHDRAWN',
  DRAFT: 'DRAFT',
} as const;

function applicationStatus(raw: string | undefined, fallback: ApplicationStatus): ApplicationStatus {
  if (raw === APPLICATION_STATUS.APPROVED || raw === APPLICATION_STATUS.LEASED) return 'approved';
  if (raw === APPLICATION_STATUS.DECLINED || raw === APPLICATION_STATUS.WITHDRAWN) return 'declined';
  if (raw === APPLICATION_STATUS.DRAFT) return 'missing_information';
  if (raw) return 'submitted';
  return fallback;
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const applicationId = Array.isArray(id) ? id[0] : id;
  const { applications } = useDemo();
  const listed = applications.find((item) => item.id === applicationId);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotId, setSlotId] = useState(APPLICATION_DOCUMENT_SLOTS[0]?.documentType ?? '');
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    void tenantApi
      .getApplication(applicationId)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this application');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (!listed && !detail && !loading) {
    return (
      <Screen>
        <BackButton fallback="/applications" />
        <Text style={styles.body}>{error || 'Application not found.'}</Text>
      </Screen>
    );
  }

  const form = detail?.formData ?? {};
  const fields = [
    ['Name', textValue(form.fullName) || textValue(form.applicantName) || listed?.applicantName || ''],
    ['Email', textValue(form.email) || listed?.email || ''],
    ['Phone', textValue(form.phone) || listed?.phone || ''],
    ['Lease months', textValue(form.leaseTerm) || listed?.leaseTerm || ''],
    ['Occupants', textValue(form.occupants) || listed?.occupants || ''],
    ['Employment', textValue(form.employment) || listed?.employment || ''],
  ].filter(([, value]) => value);
  const status = applicationStatus(detail?.status, listed?.status ?? 'submitted');
  const documents = detail?.documents ?? [];

  return (
    <Screen>
      <BackButton fallback="/applications" />
      <Text style={styles.kicker}>{detail?.reference || listed?.reference}</Text>
      <Text style={styles.title}>{detail?.propertyAddress || listed?.propertyAddress}</Text>
      <Text style={styles.body}>Submitted {listed?.submittedAt || ''}</Text>
      <Tag label={STATUS_LABEL[status]} tone={status === 'approved' ? 'green' : status === 'missing_information' ? 'amber' : 'neutral'} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {fields.length > 0 ? (
        <Card>
          <Text style={styles.label}>Applicant</Text>
          {fields.map(([label, value]) => (
            <Text key={label} style={styles.body}>
              {label}: {value}
            </Text>
          ))}
        </Card>
      ) : null}
      <Card>
        <Text style={styles.label}>Documents on file</Text>
        {documents.length === 0 ? <Text style={styles.body}>No documents are on this application.</Text> : null}
        {documents.map((doc) => (
          <Text
            key={`${doc.fileName}-${doc.uploadedAt}`}
            style={styles.value}
            onPress={() => openDocument(doc.url, doc.fileName, setError)}
          >
            {doc.label || doc.fileName}
          </Text>
        ))}
      </Card>
      {detail?.status === APPLICATION_STATUS.WITHDRAWN ? (
        <Text style={styles.body}>Adding a file after the application is withdrawn is not available.</Text>
      ) : detail ? (
        <Card>
          <Text style={styles.label}>Add a checklist file</Text>
          <View style={styles.pills}>
            {APPLICATION_DOCUMENT_SLOTS.map((slot) => (
              <Pressable
                key={slot.documentType}
                accessibilityRole="button"
                onPress={() => setSlotId(slot.documentType)}
                style={[styles.pill, slotId === slot.documentType && styles.pillOn]}
              >
                <Text style={[styles.pillText, slotId === slot.documentType && styles.pillTextOn]}>{slot.label}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            label={file ? file.fileName : 'Choose a photo'}
            tone="outline"
            onPress={() => {
              void pickEvidence()
                .then((picked) => {
                  if (!picked) return;
                  if (!picked.mimeType.startsWith('image/')) {
                    setError('Choose a photo of the document. Video files are not accepted here.');
                    return;
                  }
                  setError(null);
                  setFile(picked);
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
            }}
          />
          <Button
            label={saving ? 'Adding' : 'Add to this application'}
            onPress={() => {
              const slot = APPLICATION_DOCUMENT_SLOTS.find((item) => item.documentType === slotId);
              if (!applicationId || saving) return;
              if (!slot || !file) {
                setError('Choose a checklist type and a photo.');
                return;
              }
              setSaving(true);
              setError(null);
              const uploaded = messageAttachment(file);
              void tenantApi
                .addApplicationDocument(applicationId, {
                  category: slot.category,
                  documentType: slot.documentType,
                  label: slot.label,
                  points: slot.points,
                  fileName: uploaded.fileName,
                  mimeType: uploaded.mimeType,
                  sizeBytes: uploaded.sizeBytes,
                  contentBase64: uploaded.contentBase64,
                })
                .then((next) => {
                  setDetail(next);
                  setFile(null);
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not add that file'))
                .finally(() => setSaving(false));
            }}
          />
        </Card>
      ) : null}
      {status === 'approved' ? <Button label="Start onboarding checklist" onPress={() => router.push('/onboarding')} /> : null}
    </Screen>
  );
}

function openDocument(url: string, name: string, setError: (message: string | null) => void) {
  if (!url) {
    setError('This document has no file.');
    return;
  }
  const fileName = `${name.replace(/[^\w.-]+/g, '-') || 'document'}.pdf`;
  if (isApiFile(url)) {
    void downloadAuthedPdf(url, fileName).catch((err) => setError(err instanceof Error ? err.message : 'Could not open this file'));
    return;
  }
  void Linking.openURL(url).catch(() => setError('Could not open this file'));
}

const styles = StyleSheet.create({
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.ink, fontWeight: '700' },
  value: { color: colors.ink, fontSize: 14, paddingVertical: 4 },
  error: { color: colors.danger, fontSize: 13 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.card },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
});
