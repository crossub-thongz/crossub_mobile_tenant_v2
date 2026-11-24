import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/src/api/client';
import { downloadAuthedPdf, isApiFile } from '@/src/api/files';
import { tenantApi } from '@/src/api/tenant';
import { loadNoticePrefs } from '@/src/notifications/preferences';
import { pickEvidence } from '@/src/api/pick-evidence';
import type { EvidenceFile } from '@/src/api/tenant';
import { messageWhen, type Thread } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

const CATEGORIES: Thread['category'][] = ['General', 'Maintenance', 'Inspection', 'Leasing'];

type CrosTurn = { role: 'user' | 'assistant'; content: string };

export function CrosScreen() {
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<CrosTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function send() {
    const content = draft.trim();
    if (!content || pending) return;
    const history: CrosTurn[] = [...turns, { role: 'user', content }];
    setDraft('');
    setNotice(null);
    setPending(true);
    setTurns(history);
    return tenantApi
      .askCros(history)
      .then((result) => {
        setTurns([...history, { role: 'assistant', content: result.reply }]);
      })
      .catch((err: unknown) => {
        setNotice(err instanceof ApiError || err instanceof Error ? err.message : 'Cros could not answer.');
      })
      .finally(() => setPending(false));
  }

  return (
    <SafeAreaView style={styles.chatSafe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.chatFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <BackButton />
          <View style={styles.chatTitleRow}>
            <Image source={require('@/assets/brand/cros-logo.png')} style={styles.chatAvatar} />
            <View style={styles.flex}>
              <Text style={styles.h2}>Ask Cros</Text>
              <Text style={styles.muted}>Chat</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.chatMessages} keyboardShouldPersistTaps="handled">
          {turns.length === 0 ? <Bubble mine={false} text="Ask a question about your tenancy." meta="Cros" /> : null}
          {turns.map((turn, index) => (
            <Bubble key={`${turn.role}-${index}`} mine={turn.role === 'user'} text={turn.content} meta={turn.role === 'user' ? 'You' : 'Cros'} />
          ))}
          {pending ? <Bubble mine={false} text="Replying" meta="Cros" /> : null}
        </ScrollView>
        <View style={styles.chatComposer}>
          {notice ? <Text style={styles.error}>{notice}</Text> : null}
          <View style={styles.composer}>
            <View style={styles.flex}>
              <Input
                value={draft}
                onChangeText={(value) => {
                  setDraft(value);
                  if (notice) setNotice(null);
                }}
                placeholder="Message Cros"
                editable={!pending}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: pending }}
              disabled={pending}
              onPress={send}
              style={[styles.send, pending && styles.sendBusy]}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function NewMessageScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [category, setCategory] = useState<Thread['category']>('General');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>New message</Text>
      <Text style={styles.muted}>Routed to {demo.scenario.team} for this tenancy.</Text>
      <Card>
        <Field label="Category">
          <View style={styles.pills}>
            {CATEGORIES.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => setCategory(item)} style={[styles.pill, category === item && styles.pillOn]}>
                <Text style={[styles.pillText, category === item && styles.pillTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Subject">
          <Input value={subject} onChangeText={setSubject} placeholder="What is this about?" />
        </Field>
        <Field label="Message">
          <Input multiline value={body} onChangeText={setBody} placeholder="How can we help?" />
        </Field>
        <Button label={file ? file.fileName : 'Attach a photo or video'} tone="outline" onPress={() => void chooseFile(setFile, setError)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Send message"
          onPress={() => {
            return demo.createThread({ category, subject, body, file }).then((id) => {
              if (id) router.replace(`/flow/conversation?thread=${id}`);
            });
          }}
        />
      </Card>
    </Screen>
  );
}

export function ConversationScreen() {
  const router = useRouter();
  const demo = useDemo();
  const params = useLocalSearchParams<{ thread?: string }>();
  const threadId = Array.isArray(params.thread) ? params.thread[0] : params.thread;
  useEffect(() => {
    if (threadId && demo.threads.some((item) => item.id === threadId && item.unread)) demo.markThreadRead(threadId);
  }, [demo, threadId]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const thread = demo.threads.find((item) => item.id === threadId);
  const reply = demo.replies[threadId];
  const closed = thread?.status === 'Completed';
  const history = thread?.messages ?? [];
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>{thread?.subject ?? 'Conversation'}</Text>
      {!thread ? <Notice>This conversation is not on your account.</Notice> : null}
      <Text style={styles.muted}>
        {demo.scenario.team} · {thread?.status ?? 'Open'}
      </Text>
      {history.length === 0 && thread?.preview ? (
        <Bubble mine={false} text={thread.preview} meta={[demo.scenario.team, messageWhen(thread.lastAt)].filter(Boolean).join(' · ')} />
      ) : null}
      {history.map((message, index) => (
        <Bubble
          key={`${message.body}-${index}`}
          mine={message.fromSelf}
          text={message.body}
          meta={[message.fromSelf ? 'You' : demo.scenario.team, messageWhen(message.at)].filter(Boolean).join(' · ')}
          attachments={message.attachments}
          onOpenFile={(url, name) => openMessageFile(url, name, setError)}
        />
      ))}
      {thread?.caseRoute ? (
        <Button label="Open the related case" tone="outline" onPress={() => router.push(thread.caseRoute!)} />
      ) : null}
      {reply ? <Bubble mine text={reply} meta="You" /> : null}
      {closed ? (
        <Notice>This conversation is read only. Start a new enquiry if you need to follow up.</Notice>
      ) : thread ? (
        <View style={styles.composer}>
          <View style={styles.flex}>
            <Input value={text} onChangeText={setText} placeholder="Write a message" />
          </View>
          <Button
            label="Send"
            onPress={() => {
              return demo.sendChat(threadId, text, file).then((sent) => {
                if (sent) {
                  setText('');
                  setFile(null);
                }
              });
            }}
          />
        </View>
      ) : null}
      {thread && !closed ? (
        <Button label={file ? file.fileName : 'Attach a photo or video'} tone="outline" onPress={() => void chooseFile(setFile, setError)} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function chooseFile(setFile: (file: EvidenceFile | null) => void, setError: (message: string | null) => void) {
  void pickEvidence()
    .then((picked) => {
      if (!picked) return;
      setError(null);
      setFile(picked);
    })
    .catch((err) => setError(err instanceof Error ? err.message : 'Could not open the photo library'));
}

function openMessageFile(url: string, name: string, setError: (message: string | null) => void) {
  if (!url) {
    setError('This file has no link.');
    return;
  }
  if (isApiFile(url)) {
    void downloadAuthedPdf(url, name).catch((err) => setError(err instanceof Error ? err.message : 'Could not open this file'));
    return;
  }
  void Linking.openURL(url).catch(() => setError('Could not open this file'));
}

export function CompletedChatScreen() {
  const router = useRouter();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Completed conversation</Text>
      <Notice>Closed conversations appear in your inbox when your property manager closes them. There is no sample thread on this screen.</Notice>
      <Button label="Start new enquiry" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const { notices, markNoticeRead, markAllNoticesRead } = useDemo();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      void loadNoticePrefs().then((prefs) => {
        setHidden(new Set(Object.entries(prefs).filter(([, on]) => !on).map(([id]) => id)));
      });
    }, []),
  );
  const visible = notices.filter((item) => !hidden.has(item.type));
  const unread = visible.filter((item) => !item.read).length;
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Notifications</Text>
      <Text style={styles.muted}>{unread === 0 ? 'You are up to date.' : `${unread} unread`}</Text>
      {unread > 0 ? <Button label="Mark all read" tone="secondary" onPress={markAllNoticesRead} /> : null}
      {visible.length === 0 ? <Notice>No notices are showing. Hidden kinds stay in Notification preferences on this phone.</Notice> : null}
      {visible.map((item) => (
        <Card
          key={item.id}
          onPress={() => {
            if (!item.read) markNoticeRead(item.id);
            router.push(item.href);
          }}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.muted}>{item.body}</Text>
          <Text style={styles.meta}>{item.read ? 'Read' : 'Unread'}</Text>
        </Card>
      ))}
      <Notice>Opening a notification marks it read and opens the task.</Notice>
    </Screen>
  );
}

function Bubble({
  mine,
  text,
  meta,
  attachments,
  onOpenFile,
}: {
  mine: boolean;
  text: string;
  meta: string;
  attachments?: { fileName: string; url: string }[];
  onOpenFile?: (url: string, name: string) => void;
}) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      {text ? <Text style={styles.body}>{text}</Text> : null}
      {attachments?.map((file) => (
        <Text key={file.url} style={styles.link} onPress={() => onOpenFile?.(file.url, file.fileName)}>
          {file.fileName}
        </Text>
      ))}
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  meta: { color: '#8b998c', fontSize: 11, marginTop: 6 },
  bubble: { maxWidth: '88%', borderRadius: 15, padding: 12 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.greenWash },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.card },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
  error: { color: colors.danger, fontSize: 13 },
  link: { color: colors.green, fontSize: 13, fontWeight: '700', marginTop: 6 },
  chatSafe: { flex: 1, backgroundColor: colors.bg },
  chatFlex: { flex: 1 },
  chatHeader: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAvatar: { width: 48, height: 48 },
  chatMessages: { padding: 20, gap: 12, flexGrow: 1 },
  chatComposer: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  sendBusy: { opacity: 0.55 },
});
