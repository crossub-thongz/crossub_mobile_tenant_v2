import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import { tenantApi, type RoutineInspectionDetail, type RoutineSelfArea } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Notice, Screen } from '@/src/ui/ui';

const ONE_BED_AREAS = ['Lounge Room', 'Dining Room', 'Kitchen', 'Laundry', 'Bathroom', 'Bedroom 1'];

function areasFromBedrooms(bedrooms: number | null | undefined): string[] {
  const count = Number.isFinite(bedrooms) ? Math.floor(Number(bedrooms)) : 1;
  const names = [...ONE_BED_AREAS];
  if (count <= 1) return names;
  names.push('Ensuite', 'Bedroom 2');
  if (count === 2) return names;
  names.push('Bedroom 3');
  if (count === 3) return names;
  names.push('Bedroom 4', 'Bathroom 2');
  return names;
}

function roomsFor(detail: RoutineInspectionDetail): RoutineSelfArea[] {
  const draft = detail.selfDraft?.areas ?? [];
  if (draft.length > 0) {
    return draft.map((area) => ({
      areaName: area.areaName,
      skipped: area.skipped,
      notes: area.notes,
      photoUrls: area.photoUrls ?? [],
    }));
  }
  const fromSections = [...new Set((detail.sections ?? []).map((section) => section.room).filter(Boolean))];
  const names = fromSections.length > 0 ? fromSections : areasFromBedrooms(detail.bedrooms);
  return names.map((areaName) => ({ areaName, photoUrls: [] }));
}

export function SelfInspectionScreen() {
  const demo = useDemo();
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [areas, setAreas] = useState<RoutineSelfArea[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let id = demo.routineAction?.flow === 'self' ? demo.routineAction.id : null;
        if (!id) {
          const list = await tenantApi.routineInspections();
          id = list.find((item) => item.flow === 'self' && item.tenantActionRequired)?.id ?? null;
        }
        if (!id) {
          if (!cancelled) setEmpty(true);
          return;
        }
        let detail = await tenantApi.getRoutineInspection(id);
        if (detail.tenantActionRequired && detail.status !== 'completed' && detail.status !== 'under_review') {
          try {
            detail = await tenantApi.startRoutineSelf(detail.id);
          } catch {
            detail = await tenantApi.getRoutineInspection(detail.id);
          }
        }
        if (cancelled) return;
        setInspectionId(detail.id);
        setStatus(detail.status);
        setAreas(roomsFor(detail));
        setIndex(detail.selfDraft?.areaIndex ?? 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not open this inspection');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [demo.routineAction]);

  const locked = status === 'completed' || status === 'under_review';
  const area = areas[index];

  async function persist(next: RoutineSelfArea[], nextIndex = index) {
    if (!inspectionId) return;
    setAreas(next);
    setIndex(nextIndex);
    await tenantApi.saveRoutineSelfDraft(inspectionId, {
      areaIndex: nextIndex,
      areaOrder: next.map((item) => item.areaName),
      areas: next,
    });
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Self-inspection</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {empty ? (
        <Notice>No self-inspection is waiting on this tenancy. Your property manager opens one when it is your turn to photograph the rooms.</Notice>
      ) : null}
      {area ? (
        <>
          <Text style={styles.muted}>
            {area.areaName} · {index + 1} of {areas.length}
            {locked ? ' · submitted' : ''}
          </Text>
          {area.skipped ? <Notice>This room is skipped. You can photograph it instead.</Notice> : null}
          <View style={styles.photos}>
            {area.photoUrls.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.photo} />
            ))}
          </View>
          {!locked ? (
            <Card>
              <Button
                label={busy ? 'Uploading…' : 'Add photo'}
                tone="secondary"
                onPress={() => {
                  if (busy || !inspectionId) return;
                  void pickEvidence()
                    .then(async (file) => {
                      if (!file) return;
                      setBusy(true);
                      setError(null);
                      try {
                        const uploaded = await tenantApi.uploadMaintenancePhoto(file);
                        const next = areas.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, skipped: false, photoUrls: [...item.photoUrls, uploaded.url] }
                            : item,
                        );
                        await persist(next);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not upload the photo');
                      } finally {
                        setBusy(false);
                      }
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
                }}
              />
              <Button
                label={area.skipped ? 'Photograph this room' : 'Skip this room'}
                tone="outline"
                onPress={() => {
                  if (busy) return;
                  const next = areas.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, skipped: !item.skipped, photoUrls: item.skipped ? item.photoUrls : [] } : item,
                  );
                  void persist(next).catch((err) => setError(err instanceof Error ? err.message : 'Could not save this room'));
                }}
              />
            </Card>
          ) : (
            <Notice>This inspection is with your property manager. The photos already submitted stay on the report.</Notice>
          )}
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label="Back" tone="secondary" onPress={() => setIndex((value) => Math.max(0, value - 1))} />
            </View>
            <View style={styles.flex}>
              {index < areas.length - 1 ? (
                <Button label="Next room" onPress={() => setIndex((value) => Math.min(areas.length - 1, value + 1))} />
              ) : (
                <Button
                  label={locked ? 'Submitted' : busy ? 'Submitting…' : 'Submit inspection'}
                  onPress={() => {
                    if (locked || busy || !inspectionId) return;
                    const sections = areas
                      .filter((item) => !item.skipped && item.photoUrls.length > 0)
                      .map((item) => ({ areaName: item.areaName, photoUrls: item.photoUrls }));
                    if (sections.length === 0) {
                      setError('Add a photo to at least one room');
                      return;
                    }
                    setBusy(true);
                    setError(null);
                    void tenantApi
                      .submitRoutineSelf(inspectionId, sections)
                      .then(async () => {
                        setStatus('under_review');
                        await demo.refreshAccount();
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Could not submit the inspection'))
                      .finally(() => setBusy(false));
                  }}
                />
              )}
            </View>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.line },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
