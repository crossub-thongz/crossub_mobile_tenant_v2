import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ApiError } from '@/src/api/http';
import { tenantApi } from '@/src/api/tenant';
import { colors } from '@/src/theme';
import { Button } from '@/src/ui/ui';

type Session = { serverUrl: string; token: string };

export function CrosCall() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    let livekit: typeof import('@livekit/react-native') | null = null;
    try {
      livekit = await import('@livekit/react-native');
      if (!livekit.LiveKitRoom || !livekit.AudioSession) throw new Error('Voice calling needs an updated app.');
      livekit.registerGlobals();
      await livekit.AudioSession.startAudioSession();
      const created = await tenantApi.createVoiceSession();
      setSession({ serverUrl: created.serverUrl, token: created.token });
    } catch (err) {
      if (livekit) {
        try {
          await livekit.AudioSession.stopAudioSession();
        } catch {
          // The call never connected.
        }
      }
      const unavailable = err instanceof ApiError && err.status === 503;
      setError(unavailable ? 'Voice calling is not available right now.' : err instanceof Error ? err.message : 'Could not start the call');
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    setSession(null);
    try {
      const livekit = await import('@livekit/react-native');
      await livekit.AudioSession.stopAudioSession();
    } catch {
      // The room is already closed on screen.
    }
  }

  if (!session) {
    return (
      <>
        <Text style={styles.body}>Ask Cros on a voice call. Text replies are not available.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={busy ? 'Starting the call' : 'Start voice call'} onPress={() => start()} />
      </>
    );
  }

  return <LiveCall serverUrl={session.serverUrl} token={session.token} onEnd={() => void end()} />;
}

function LiveCall({ serverUrl, token, onEnd }: { serverUrl: string; token: string; onEnd: () => void }) {
  const [Room, setRoom] = useState<typeof import('@livekit/react-native').LiveKitRoom | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@livekit/react-native')
      .then((livekit) => {
        livekit.registerGlobals();
        if (!cancelled) setRoom(() => livekit.LiveKitRoom);
      })
      .catch(() => {
        if (!cancelled) setFailed('Voice calling needs an updated app.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <Text style={styles.error}>{failed}</Text>;
  if (!Room) return <Text style={styles.body}>Connecting</Text>;

  return (
    <Room serverUrl={serverUrl} token={token} connect audio video={false} onDisconnected={onEnd}>
      <Text style={styles.body}>You are in the call. Cros joins this room.</Text>
      <Button label="End call" tone="secondary" onPress={onEnd} />
    </Room>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
});
