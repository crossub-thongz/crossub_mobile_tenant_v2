import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { routineSelfOpen } from '@/src/api/dates';
import { routeRecordId } from '@/src/api/load-account';
import { captureEvidenceBatch, pickEvidenceMany } from '@/src/api/pick-evidence';
import { tenantApi, type EvidenceFile, type RoutineInspectionDetail, type RoutineSelfArea } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Screen } from '@/src/ui/ui';

const ONE_BED_AREAS = ['Lounge Room', 'Dining Room', 'Kitchen', 'Laundry', 'Bathroom', 'Bedroom 1'];
const PHOTO_LIMIT = 8;
const PHOTO_QUALITY = 0.4;

const ROOM_TIPS: { match: RegExp; tip: string }[] = [
  { match: /kitchen/i, tip: 'Photograph the benches, sink, stove, and oven. Then photograph any marks, leaks, or damage. Include the cupboard under the sink if it looks wet.' },
  { match: /bath|ensuite|toilet/i, tip: 'Photograph the shower, vanity, toilet, and floor. Include mould, cracked tiles, or a leak if you see one.' },
  { match: /bed/i, tip: 'Photograph the walls, floor, windows, and built-in robes. Include marks, holes, and anything that does not close.' },
  { match: /laundry/i, tip: 'Photograph the tub, the taps, and the floor around them.' },
  { match: /lounge|living|dining/i, tip: 'Stand in the doorway and photograph the whole room. Then photograph marks on the walls, floor, or windows.' },
  { match: /balcony|outdoor|yard|garage|car/i, tip: 'Photograph the whole area in daylight, then any damage to the surfaces or fittings.' },
];

const DEFAULT_TIP =
  'Stand in the doorway and take one photo of the whole room. Then take close-ups of any damage, stains, or things that do not work. Turn the lights on so the room is clear.';

type Room = RoutineSelfArea & { referencePhotos: string[]; guide?: string };

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

function tipFor(name: string, description?: string): string {
  const written = description?.trim();
  if (written && written !== 'Upload photos and note the current condition.') return written;
  return ROOM_TIPS.find((item) => item.match.test(name))?.tip ?? DEFAULT_TIP;
}

function referenceFor(detail: RoutineInspectionDetail, room: string): string[] {
  const fromSection = detail.sections?.find((section) => section.room === room)?.referencePhotos ?? [];
  const fromIngoing = detail.referenceIngoingAreas?.find((area) => area.name === room)?.photos ?? [];
  return [...new Set([...fromSection, ...fromIngoing].filter(Boolean))];
}

function guideFor(detail: RoutineInspectionDetail, room: string): string | undefined {
  return detail.sections?.find((section) => section.room === room)?.description;
}

function roomsFor(detail: RoutineInspectionDetail): Room[] {
  const draft = detail.selfDraft?.areas ?? [];
  if (draft.length > 0) {
    return draft.map((area) => ({
      areaName: area.areaName,
      skipped: area.skipped,
      notes: area.notes,
      photoUrls: area.photoUrls ?? [],
      referencePhotos: referenceFor(detail, area.areaName),
      guide: guideFor(detail, area.areaName),
    }));
  }
  const fromSections = [...new Set((detail.sections ?? []).map((section) => section.room).filter(Boolean))];
  const names = fromSections.length > 0 ? fromSections : areasFromBedrooms(detail.bedrooms);
  return names.map((areaName) => ({
    areaName,
    photoUrls: [],
    referencePhotos: referenceFor(detail, areaName),
    guide: guideFor(detail, areaName),
  }));
}

function toDraft(rooms: Room[]): RoutineSelfArea[] {
  return rooms.map(({ areaName, skipped, notes, photoUrls }) => ({
    areaName,
    skipped,
    notes,
    photoUrls: photoUrls.filter((url) => url.startsWith('http')),
  }));
}

export function SelfInspectionScreen() {
  const router = useRouter();
  const demo = useDemo();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestedId = routeRecordId(params.id);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Room[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [done, setDone] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let id = requestedId || (routineSelfOpen(demo.routineAction?.status, demo.routineAction?.flow) ? demo.routineAction?.id ?? null : null);
        if (!id) {
          const list = await tenantApi.routineInspections();
          id = list.find((item) => routineSelfOpen(item.status, item.flow))?.id ?? null;
        }
        if (!id) {
          if (!cancelled && !submitted.current) {
            setEmpty(true);
            setAreas([]);
          }
          return;
        }
        let detail = await tenantApi.getRoutineInspection(id);
        if (routineSelfOpen(detail.status, detail.flow)) {
          try {
            detail = await tenantApi.startRoutineSelf(detail.id);
          } catch {
            detail = await tenantApi.getRoutineInspection(detail.id);
          }
        }
        if (cancelled || submitted.current) return;
        setEmpty(false);
        setInspectionId(detail.id);
        setStatus(detail.status);
        setAreas(roomsFor(detail));
        setIndex(detail.selfDraft?.areaIndex ?? 0);
        if (!routineSelfOpen(detail.status, detail.flow)) setDone(true);
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
  }, [demo.routineAction, requestedId]);

  const area = areas[index];

  async function persist(next: Room[], nextIndex = index) {
    if (!inspectionId) return;
    setAreas(next);
    setIndex(nextIndex);
    await tenantApi.saveRoutineSelfDraft(inspectionId, {
      areaIndex: nextIndex,
      areaOrder: next.map((item) => item.areaName),
      areas: toDraft(next),
    });
  }

  async function addPhotos(files: EvidenceFile[]) {
    if (!inspectionId || files.length === 0 || !area) return;
    const local = files.map((file) => file.previewUri).filter((uri): uri is string => Boolean(uri));
    const withLocal = areas.map((item, itemIndex) =>
      itemIndex === index ? { ...item, skipped: false, photoUrls: [...item.photoUrls, ...local] } : item,
    );
    setAreas(withLocal);
    setBusy(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => tenantApi.uploadMaintenancePhoto(file)));
      const urls = uploaded.map((file) => file.url);
      const next = withLocal.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, photoUrls: [...item.photoUrls.filter((url) => !local.includes(url)), ...urls] }
          : item,
      );
      await persist(next);
    } catch (err) {
      setAreas(areas);
      setError(err instanceof Error ? err.message : 'Could not upload the photo');
    } finally {
      setBusy(false);
    }
  }

  function choosePhotos(fromCamera: boolean) {
    if (busy || !inspectionId || !area) return;
    const room = PHOTO_LIMIT - area.photoUrls.length;
    if (room < 1) {
      setError(`This room already has ${PHOTO_LIMIT} photos. Remove one to add another.`);
      return;
    }
    const options = { quality: PHOTO_QUALITY, imagesOnly: true as const };
    const run = fromCamera ? captureEvidenceBatch(room, options) : pickEvidenceMany(room, options);
    void run.then((files) => addPhotos(files)).catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photos'));
  }

  function removePhoto(url: string) {
    if (busy) return;
    const next = areas.map((item, itemIndex) =>
      itemIndex === index ? { ...item, photoUrls: item.photoUrls.filter((photo) => photo !== url) } : item,
    );
    void persist(next).catch((err) => setError(err instanceof Error ? err.message : 'Could not remove the photo'));
  }

  function skipRoom() {
    if (busy || !area) return;
    Alert.alert('Skip this room?', 'This room will not be included unless you add photos later.', [
      { text: 'Stay on this room', style: 'cancel' },
      {
        text: 'Skip room',
        style: 'destructive',
        onPress: () => {
          const next = areas.map((item, itemIndex) =>
            itemIndex === index ? { ...item, skipped: true, photoUrls: [] } : item,
          );
          void persist(next).catch((err) => setError(err instanceof Error ? err.message : 'Could not save this room'));
        },
      },
    ]);
  }

  if (done) {
    return (
      <Screen>
        <BackButton />
        <Text style={styles.h2}>Inspection submitted</Text>
        <Button label="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Self-inspection</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {empty ? <Text style={styles.muted}>No self-inspection is waiting.</Text> : null}
      {area ? (
        <>
          <Text style={styles.muted}>
            {area.areaName} · {index + 1} of {areas.length}
          </Text>
          <Card>
            <Text style={styles.kicker}>WHAT TO PHOTOGRAPH</Text>
            <Text style={styles.body}>{tipFor(area.areaName, area.guide)}</Text>
            {area.referencePhotos.length > 0 ? (
              <>
                <Text style={styles.kicker}>WHEN YOU MOVED IN</Text>
                <View style={styles.photos}>
                  {area.referencePhotos.map((url) => (
                    <Image key={url} source={{ uri: url }} style={styles.photo} />
                  ))}
                </View>
              </>
            ) : null}
          </Card>
          {area.skipped ? <Text style={styles.muted}>Skipped.</Text> : null}
          <View style={styles.photos}>
            {area.photoUrls.map((url) => (
              <View key={url} style={styles.thumb}>
                <Image source={{ uri: url }} style={styles.photo} />
                <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => removePhoto(url)} style={styles.remove} hitSlop={8}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Button label={busy ? 'Uploading…' : 'Take photos'} onPress={() => choosePhotos(true)} />
            <Button label={busy ? 'Uploading…' : 'Choose photos'} tone="secondary" onPress={() => choosePhotos(false)} />
          </View>
          <Text style={styles.muted}>Up to {PHOTO_LIMIT} photos. Tap the cross to remove one.</Text>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label="Previous room" tone="secondary" onPress={() => setIndex((value) => Math.max(0, value - 1))} />
            </View>
            <View style={styles.flex}>
              {index < areas.length - 1 ? (
                <Button label="Next room" onPress={() => setIndex((value) => Math.min(areas.length - 1, value + 1))} />
              ) : (
                <Button
                  label={busy ? 'Submitting…' : 'Submit inspection'}
                  onPress={() => {
                    if (busy || !inspectionId) return;
                    const sections = areas
                      .filter((item) => !item.skipped && item.photoUrls.some((url) => url.startsWith('http')))
                      .map((item) => ({ areaName: item.areaName, photoUrls: item.photoUrls.filter((url) => url.startsWith('http')) }));
                    if (sections.length === 0) {
                      setError('Add a photo to at least one room');
                      return;
                    }
                    setBusy(true);
                    setError(null);
                    return tenantApi
                      .submitRoutineSelf(inspectionId, sections)
                      .then(() => {
                        submitted.current = true;
                        setDone(true);
                        void demo.refreshAccount();
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Could not submit the inspection'))
                      .finally(() => setBusy(false));
                  }}
                />
              )}
            </View>
          </View>
          <View style={styles.skip}>
            <Button label={area.skipped ? 'Include this room' : 'Skip this room'} tone="outline" onPress={() => (area.skipped ? void persist(areas.map((item, itemIndex) => (itemIndex === index ? { ...item, skipped: false } : item))) : skipRoom())} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.line },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#213d2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 10 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  flex: { flex: 1 },
  skip: { marginTop: 28, gap: 8 },
});
