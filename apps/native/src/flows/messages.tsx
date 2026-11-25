import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { downloadAuthedPdf, isApiFile } from '@/src/api/files';
import { loadNoticePrefs } from '@/src/notifications/preferences';
import { pickEvidence } from '@/src/api/pick-evidence';
import type { EvidenceFile } from '@/src/api/tenant';
import { messageWhen, type Thread } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, Screen } from '@/src/ui/ui';

const CATEGORIES: Thread['category'][] = ['General', 'Maintenance', 'Inspection', 'Leasing'];

function firstParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}

/** Compose a message already tied to the task the tenant was looking at. */
export function taskMessagePath(input: {
  subject: string;
  category: Thread['category'];
  caseType: 'MAINTENANCE' | 'INSPECTION' | 'LEASING' | 'RENT_REVIEW';
  caseId: string;
}): string {
  const params = new URLSearchParams({
    subject: input.subject,
    category: input.category,
    caseType: input.caseType,
    caseId: input.caseId,
  });
  return `/flow/new-message?${params.toString()}`;
}

/** Tenants do not have CROS AI. A saved link returns to the inbox. */
export function CrosScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/inbox');
  }, [router]);
  return null;
}

export function NewMessageScreen() {
  const router = useRouter();
  const demo = useDemo();
  const params = useLocalSearchParams<{ subject?: string; category?: string; caseType?: string; caseId?: string }>();
  const presetSubject = firstParam(params.subject);
  const presetCategory = firstParam(params.category);
  const caseType = firstParam(params.caseType);
  const caseId = firstParam(params.caseId);
  const linkedCategory = (CATEGORIES as string[]).includes(presetCategory) ? (presetCategory as Thread['category']) : 'General';
  const [category, setCategory] = useState<Thread['category']>(linkedCategory);
  const [subject, setSubject] = useState(presetSubject);
  const [body, setBody] = useState('');
  useEffect(() => {
    if (presetSubject) setSubject(presetSubject);
    if ((CATEGORIES as string[]).includes(presetCategory)) setCategory(presetCategory as Thread['category']);
  }, [presetSubject, presetCategory]);
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
            const linked =
              caseType === 'MAINTENANCE' || caseType === 'INSPECTION' || caseType === 'LEASING' || caseType === 'RENT_REVIEW'
                ? caseType
                : undefined;
            return demo.createThread({ category, subject, body, file, caseType: linked, caseId: linked && caseId ? caseId : undefined }).then((id) => {
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
    if (!threadId) return;
    if (!demo.threads.some((item) => item.id === threadId && item.unread)) return;
    demo.markThreadRead(threadId);
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
        <Notice>This conversation is read only.</Notice>
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
      {visible.length === 0 ? <Notice>No notices.</Notice> : null}
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
});
