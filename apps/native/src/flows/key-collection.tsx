import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { pickEvidence } from '@/src/api/pick-evidence';
import type { EvidenceFile } from '@/src/api/tenant';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { Button, Card, Field, Input, Notice } from '@/src/ui/ui';

export function KeyCollectionForm() {
  const demo = useDemo();
  const saved = demo.keyCollection;
  const [when, setWhen] = useState(saved?.time ? saved.time.slice(0, 16) : '');
  const [location, setLocation] = useState(saved?.location ?? '');
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = demo.onboarding.key_pickup === 'completed';

  return (
    <Card>
      <Text style={styles.title}>Key collection</Text>
      <Text style={styles.body}>
        {saved?.location
          ? `Saved for ${saved.location}${saved.time ? ` · ${saved.time.slice(0, 16).replace('T', ' ')}` : ''}`
          : 'Confirm when and where you will collect the keys, and add a photo of the handover.'}
      </Text>
      {done ? <Notice>Key collection is recorded on this lease.</Notice> : null}
      {!done ? (
        <>
          <Field label="Collection time">
            <Input value={when} onChangeText={setWhen} placeholder="2026-12-02T10:00" autoCapitalize="none" />
          </Field>
          <Field label="Location">
            <Input value={location} onChangeText={setLocation} placeholder="Agency office or property" />
          </Field>
          {file ? <Text style={styles.body}>Photo ready: {file.fileName}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={file ? 'Replace photo' : 'Add handover photo'}
            tone="secondary"
            onPress={() => {
              void pickEvidence()
                .then((picked) => {
                  if (picked) setFile(picked);
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
            }}
          />
          <Button
            label="Submit key collection"
            onPress={() => {
              if (!file) {
                setError('Add a photo of the keys first');
                return;
              }
              const parsed = new Date(when);
              if (Number.isNaN(parsed.getTime()) || !location.trim()) {
                setError('Enter a collection time and location');
                return;
              }
              setError(null);
              demo.submitKeyCollection(parsed.toISOString(), location.trim(), file);
            }}
          />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
