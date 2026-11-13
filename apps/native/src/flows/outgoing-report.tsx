import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { tenantApi, type OutgoingInspection, type OutgoingSection } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

function pickReport(rows: OutgoingInspection[]): OutgoingInspection | null {
  return (
    rows.find((item) => item.status === 'awaiting_confirmation') ??
    rows.find((item) => item.status !== 'confirmed') ??
    rows[0] ??
    null
  );
}

export function FinalScreen() {
  const demo = useDemo();
  const [report, setReport] = useState<OutgoingInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await tenantApi.outgoingInspections();
        const chosen = pickReport(rows);
        if (!chosen) {
          if (!cancelled) setReport(null);
          return;
        }
        const detail = await tenantApi.getOutgoingInspection(chosen.id);
        if (!cancelled) setReport(detail);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the final report');
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
  const waiting = report?.status === 'awaiting_confirmation' && !report.tenantApproved;

  async function dispute(section: OutgoingSection) {
    if (!report || busy) return;
    const description = (reasons[section.id] ?? '').trim();
    if (!description) {
      setError('Say what should be reviewed');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await tenantApi.disputeOutgoing(report.id, {
        area: section.room,
        description,
        sectionId: section.id,
      });
      setReport(next.sections ? next : { ...report, sections: sections.map((item) => (item.id === section.id ? { ...item, disputed: true, disputeComment: description } : item)) });
      demo.notify('Dispute sent on this section');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the dispute');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Final inspection</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !report ? (
        <Notice>No final report has been published on this tenancy yet. It appears here after your property manager schedules the outgoing inspection.</Notice>
      ) : null}
      {report ? (
        <>
          <Text style={styles.muted}>{report.propertyAddress || 'This tenancy'}</Text>
          <Card>
            <Text style={styles.title}>{report.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.muted}>{report.sectionCount} section{report.sectionCount === 1 ? '' : 's'} on the report</Text>
          </Card>
          {report.tenantOutgoingAttendance === 'pending' ? (
            <Card>
              <Text style={styles.title}>Will you attend?</Text>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Button
                    label="Yes"
                    onPress={() => {
                      void tenantApi
                        .setOutgoingAttendance(report.vacatingCaseId, 'yes')
                        .then(() => setReport({ ...report, tenantOutgoingAttendance: 'yes' }))
                        .catch((err) => setError(err instanceof Error ? err.message : 'Could not save attendance'));
                    }}
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="No"
                    tone="secondary"
                    onPress={() => {
                      void tenantApi
                        .setOutgoingAttendance(report.vacatingCaseId, 'no')
                        .then(() => setReport({ ...report, tenantOutgoingAttendance: 'no' }))
                        .catch((err) => setError(err instanceof Error ? err.message : 'Could not save attendance'));
                    }}
                  />
                </View>
              </View>
            </Card>
          ) : (
            <Notice>{report.tenantOutgoingAttendance === 'yes' ? 'You will attend the final inspection.' : 'You will not attend the final inspection.'}</Notice>
          )}
          {sections.map((section) => (
            <Card key={section.id}>
              <Text style={styles.title}>{section.room}</Text>
              {section.description ? <Text style={styles.body}>{section.description}</Text> : null}
              <View style={styles.photos}>
                {section.photos.map((url) => (
                  <Image key={url} source={{ uri: url }} style={styles.photo} />
                ))}
              </View>
              {section.disputed ? (
                <Notice>{section.disputeComment || 'You disputed this section.'}</Notice>
              ) : waiting ? (
                <>
                  <Field label="Dispute this section">
                    <Input
                      multiline
                      value={reasons[section.id] ?? ''}
                      onChangeText={(value) => setReasons((current) => ({ ...current, [section.id]: value }))}
                      placeholder="What should be reviewed?"
                    />
                  </Field>
                  <Button label="Send dispute" tone="outline" onPress={() => void dispute(section)} />
                </>
              ) : null}
            </Card>
          ))}
          {report.tenantApproved ? (
            <Notice>You approved this final report.</Notice>
          ) : waiting ? (
            <Button
              label={busy ? 'Submitting…' : 'Approve the report'}
              onPress={() => {
                if (busy) return;
                setBusy(true);
                setError(null);
                void tenantApi
                  .approveOutgoing(report.id)
                  .then((next) => {
                    setReport(next.sections ? next : { ...report, ...next, sections: report.sections });
                    demo.notify('Final report approved');
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Could not approve the report'))
                  .finally(() => setBusy(false));
              }}
            />
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
