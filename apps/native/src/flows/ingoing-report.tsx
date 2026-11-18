import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { tenantApi } from '@/src/api/tenant';
import type { components } from '@crossub-thongz/api-contract';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

type IngoingInspection = components['schemas']['TenantIngoingInspectionResponseDto'];
type IngoingSection = components['schemas']['TenantIngoingInspectionSectionDto'];

function pickReport(rows: IngoingInspection[]): IngoingInspection | null {
  return (
    rows.find((item) => item.status === 'awaiting_confirmation') ??
    rows.find((item) => item.status !== 'confirmed' && item.status !== 'rejected') ??
    rows[0] ??
    null
  );
}

export function EntryScreen() {
  const demo = useDemo();
  const [report, setReport] = useState<IngoingInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await tenantApi.ingoingInspections();
        const chosen = pickReport(rows);
        if (!chosen) {
          if (!cancelled) setReport(null);
          return;
        }
        const detail = await tenantApi.getIngoingInspection(chosen.id);
        if (!cancelled) setReport(detail);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the entry report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = report?.sections ?? [];
  const waiting = report?.status === 'awaiting_confirmation' && !report.tenantApproved && !report.tenantRejected;

  async function feedback(section: IngoingSection, status: 'confirmed' | 'disputed') {
    if (!report || busy) return;
    const comment = (comments[section.id] ?? '').trim();
    if (status === 'disputed' && !comment) {
      setError('Say what should be reviewed');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await tenantApi.submitIngoingFeedback(report.id, section.id, {
        status,
        ...(comment ? { comment } : {}),
      });
      setReport(next.sections ? next : report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this section');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Entry condition report</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !report ? (
        <Notice>No entry report has been published on this tenancy yet. It appears here after your property manager schedules the ingoing inspection.</Notice>
      ) : null}
      {report ? (
        <>
          <Text style={styles.muted}>{report.propertyAddress || 'This tenancy'}</Text>
          <Card>
            <Text style={styles.title}>{report.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.muted}>
              {report.sectionCount} section{report.sectionCount === 1 ? '' : 's'} on the report
            </Text>
            {report.reportUrl ? <Text style={styles.muted}>The report file is on this inspection.</Text> : null}
          </Card>
          {sections.map((section) => (
            <Card key={section.id}>
              <Text style={styles.title}>{section.room}</Text>
              {section.description ? <Text style={styles.body}>{section.description}</Text> : null}
              <View style={styles.photos}>
                {section.photos.map((url) => (
                  <Image key={url} source={{ uri: url }} style={styles.photo} />
                ))}
              </View>
              {section.disputed ? <Notice>{section.disputeComment || 'You disputed this section.'}</Notice> : null}
              {section.confirmed && !section.disputed ? <Notice>{section.feedbackComment || 'You confirmed this section.'}</Notice> : null}
              {waiting && !section.confirmed && !section.disputed ? (
                <>
                  <Field label="Comment">
                    <Input
                      multiline
                      value={comments[section.id] ?? ''}
                      onChangeText={(value) => setComments((current) => ({ ...current, [section.id]: value }))}
                      placeholder="Optional when you confirm. Required when you dispute."
                    />
                  </Field>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Button label="Confirm" onPress={() => void feedback(section, 'confirmed')} />
                    </View>
                    <View style={styles.flex}>
                      <Button label="Dispute" tone="secondary" onPress={() => void feedback(section, 'disputed')} />
                    </View>
                  </View>
                </>
              ) : null}
            </Card>
          ))}
          {report.tenantApproved ? <Notice>You approved this entry report.</Notice> : null}
          {report.tenantRejected ? <Notice>{report.rejectReason || 'You rejected this entry report.'}</Notice> : null}
          {waiting ? (
            <>
              <Button
                label={busy ? 'Submitting…' : 'Approve the report'}
                onPress={() => {
                  if (busy || !report) return;
                  setBusy(true);
                  setError(null);
                  void tenantApi
                    .approveIngoing(report.id)
                    .then((next) => {
                      setReport(next.sections ? next : { ...report, ...next, sections: report.sections });
                      demo.notify('Entry report approved');
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Could not approve the report'))
                    .finally(() => setBusy(false));
                }}
              />
              <Field label="Reason for rejecting the report">
                <Input multiline value={rejectReason} onChangeText={setRejectReason} placeholder="What does not match the property?" />
              </Field>
              <Button
                label="Reject the report"
                tone="outline"
                onPress={() => {
                  if (busy || !report) return;
                  const reason = rejectReason.trim();
                  if (!reason) {
                    setError('Say why you are rejecting the report');
                    return;
                  }
                  setBusy(true);
                  setError(null);
                  void tenantApi
                    .rejectIngoing(report.id, reason)
                    .then((next) => {
                      setReport(next.sections ? next : { ...report, ...next, sections: report.sections });
                      demo.notify('Entry report rejected');
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Could not reject the report'))
                    .finally(() => setBusy(false));
                }}
              />
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 88, height: 88, borderRadius: 10, backgroundColor: colors.line },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
