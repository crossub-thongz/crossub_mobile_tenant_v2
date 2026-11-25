import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatDisplayDate } from '@/src/api/dates';
import { tenantApi } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { taskMessagePath } from '@/src/flows/messages';
import { colors } from '@/src/theme';
import { DatePickerField } from '@/src/ui/date-picker-field';
import { BackButton, Button, Card, Field, Input, Screen } from '@/src/ui/ui';

function isoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return trimmed;
}

export default function TerminationScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [moveOut, setMoveOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const openCase = demo.terminationStarted && demo.vacating ? demo.vacating : null;

  async function changeDate() {
    if (!openCase || busy) return;
    const date = isoDate(moveOut);
    if (!date) {
      setError('Choose the date you plan to leave.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await tenantApi.updateVacateDate(openCase.id, date);
      await demo.refreshAccount();
      demo.rememberVacateDate(formatDisplayDate(date), demo.propertyUuid);
      demo.notify('Vacate date updated');
      setMoveOut('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the vacate date');
    } finally {
      setBusy(false);
    }
  }

  async function cancelCase() {
    if (!openCase || busy) return;
    setBusy(true);
    setError(null);
    try {
      await tenantApi.cancelVacating(openCase.id, reason.trim() || undefined);
      await demo.refreshAccount();
      demo.notify('Vacating case withdrawn');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw the vacating case');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackButton fallback="/" />
      <Text style={styles.kicker}>NOTICE FROM CROSSUB</Text>
      <Text style={styles.title}>Termination notice</Text>
      <Card>
        <Text style={styles.address}>{demo.vacating?.address || demo.property.title}</Text>
        <Text style={styles.body}>{demo.vacating?.reason || 'No termination notice is open.'}</Text>
        {demo.vacating?.vacateDate ? <Text style={styles.body}>Vacate date {demo.vacating.vacateDate}</Text> : null}
      </Card>
      <Button
        label="Message Crossub"
        tone="outline"
        onPress={() => {
          if (!demo.vacating) {
            router.push('/flow/new-message');
            return;
          }
          const place = demo.vacating.address || demo.property.title;
          const when = demo.vacating.vacateDate ? ` (${demo.vacating.vacateDate})` : '';
          router.push(
            taskMessagePath({
              subject: `Notice to vacate — ${place}${when}`,
              category: 'Leasing',
              caseType: 'LEASING',
              caseId: demo.vacating.id,
            }),
          );
        }}
      />
      {openCase ? (
        <Card>
          <Text style={styles.address}>Move-out date {openCase.vacateDate || demo.terminationMoveOut}</Text>
          <Field label="New vacate date">
            <DatePickerField value={moveOut} onChange={setMoveOut} />
          </Field>
          <Button label="Change vacate date" onPress={() => changeDate()} />
          <Field label="Reason for staying, if you have one">
            <Input value={reason} onChangeText={setReason} placeholder="Optional" />
          </Field>
          <Button label="I'm not moving out" tone="secondary" onPress={() => cancelCase()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Move-out services" tone="outline" onPress={() => router.push('/move-out-services')} />
        </Card>
      ) : (
        <Card>
          <Field label="Select move-out date">
            <DatePickerField value={moveOut} onChange={setMoveOut} />
          </Field>
          <Text style={styles.body}>Confirm when you plan to leave. Moving and cleaning can be arranged after that.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="Confirm vacating date"
            onPress={() => {
              const date = isoDate(moveOut);
              if (!date) {
                setError('Choose the date you plan to leave.');
                return;
              }
              if (busy) return;
              setBusy(true);
              setError(null);
              return tenantApi
                .createVacating({
                  expectedVacateDate: date,
                  ...(demo.propertyUuid ? { propertyId: demo.propertyUuid } : {}),
                })
                .then(async () => {
                  await demo.refreshAccount();
                  demo.rememberVacateDate(formatDisplayDate(date), demo.propertyUuid);
                  demo.notify('Vacating case opened');
                  router.push('/move-out-services');
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the vacating case'))
                .finally(() => setBusy(false));
            }}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  address: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
