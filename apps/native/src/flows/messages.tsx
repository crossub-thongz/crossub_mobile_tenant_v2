import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Thread } from '@/src/demo/model';
import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';
import { BackButton, Button, Card, Field, Input, Notice, RowItem, Screen } from '@/src/ui/ui';

const CATEGORIES: Thread['category'][] = ['General', 'Maintenance', 'Inspection', 'Leasing'];

export function CrosScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [text, setText] = useState('');
  const [offerHandoff, setOfferHandoff] = useState(false);
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Ask Cros</Text>
      <Text style={styles.muted}>Assistant replies are not approvals. A person still makes the decision.</Text>
      <Bubble mine={false} text="I can help you find information or prepare an enquiry." meta="Cros" />
      {demo.cros.map((line, index) => (
        <View key={`${line}-${index}`}>
          <Bubble mine text={line} meta="You · Sent" />
          <Bubble mine={false} text="I can help with what is already on your tenancy. If a person needs to decide, I will open a conversation with them." meta="Cros" />
        </View>
      ))}
      <View style={styles.composer}>
        <View style={styles.flex}>
          <Input value={text} onChangeText={setText} placeholder="Ask Cros" />
        </View>
        <Button
          label="Send"
          onPress={() => {
            const result = demo.sendCros(text);
            if (result === 'empty') return;
            setText('');
            setOfferHandoff(result === 'escalate');
            if (result === 'escalate') demo.notify(`A manager decision is needed. ${demo.scenario.team} can take this.`);
          }}
        />
      </View>
      {offerHandoff ? <Button label={`Send to ${demo.scenario.team}`} onPress={() => router.push('/flow/conversation')} /> : null}
      <Card>
        <RowItem icon="construct-outline" title="Report a leaking tap" subtitle="Open the maintenance form" onPress={() => router.push('/flow/report')} />
        <RowItem icon="clipboard-outline" title="When is my inspection?" subtitle="Open the routine inspection" onPress={() => router.push('/flow/inspection')} />
      </Card>
    </Screen>
  );
}

export function NewMessageScreen() {
  const router = useRouter();
  const demo = useDemo();
  const [category, setCategory] = useState<Thread['category']>('General');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState('');
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
        <Field label="Attachment">
          <Input value={attachment} onChangeText={setAttachment} placeholder="Optional file name, photo.jpg" />
        </Field>
        <Button
          label="Send message"
          onPress={() => {
            void demo.createThread({ category, subject, body, attachment }).then((id) => {
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
  const threadId = (Array.isArray(params.thread) ? params.thread[0] : params.thread) || 'parking';
  useEffect(() => {
    if (demo.threads.some((item) => item.id === threadId && item.unread)) demo.markThreadRead(threadId);
  }, [demo, threadId]);
  const [text, setText] = useState('');
  const [file, setFile] = useState('');
  const thread = demo.threads.find((item) => item.id === threadId);
  const reply = demo.replies[threadId];
  const attachment = demo.attachments[threadId] || thread?.attachment;
  const closed = thread?.status === 'Completed';
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>{thread?.subject ?? 'Conversation'}</Text>
      <Text style={styles.muted}>
        {demo.scenario.team} · {thread?.status ?? 'Open'}
      </Text>
      {threadId === 'parking' ? (
        <>
          <Bubble mine text="Can I request an extra remote?" meta="You · Delivered" />
          <Bubble mine={false} text="We can check the building requirements and reply here." meta={demo.scenario.team} />
        </>
      ) : (
        <Bubble mine text={thread?.preview ?? ''} meta="You · Delivered" />
      )}
      {attachment ? <Text style={styles.muted}>Attachment · {attachment}</Text> : null}
      {thread?.caseRoute ? (
        <Button label="Open the related case" tone="outline" onPress={() => router.push(thread.caseRoute!)} />
      ) : null}
      {reply ? <Bubble mine text={reply} meta="You · Delivered" /> : null}
      {closed ? (
        <Notice>This conversation is read only. Start a new enquiry if you need to follow up.</Notice>
      ) : (
        <View style={styles.composer}>
          <View style={styles.flex}>
            <Input value={text} onChangeText={setText} placeholder="Write a message" />
            <Input value={file} onChangeText={setFile} placeholder="Attach a file name" />
          </View>
          <Button
            label="Send"
            onPress={() => {
              const note = file.trim() ? `${text.trim()}\n\nAttachment: ${file.trim()}` : text;
              void demo.sendChat(threadId, note).then((sent) => {
                if (!sent) return;
                if (file.trim()) demo.attachToThread(threadId, file);
                setText('');
                setFile('');
              });
            }}
          />
        </View>
      )}
      <Button label="View a completed conversation" tone="outline" onPress={() => router.push('/flow/completed-chat')} />
    </Screen>
  );
}

export function CompletedChatScreen() {
  const router = useRouter();
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Completed conversation</Text>
      <Card>
        <Text style={styles.title}>Closed by your manager</Text>
        <Text style={styles.muted}>You cannot reply or reopen this thread. A follow-up is a new conversation.</Text>
      </Card>
      <Bubble mine={false} text="This request is complete. Reply is turned off." meta="Closed" />
      <Button label="Start new enquiry" onPress={() => router.push('/flow/new-message')} />
    </Screen>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const { notices, markNoticeRead } = useDemo();
  const unread = notices.filter((item) => !item.read).length;
  return (
    <Screen>
      <BackButton />
      <Text style={styles.h2}>Notifications</Text>
      <Text style={styles.muted}>{unread === 0 ? 'You are up to date.' : `${unread} unread`}</Text>
      {notices.map((item) => (
        <Card
          key={item.id}
          onPress={() => {
            markNoticeRead(item.id);
            router.push(item.href);
          }}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.muted}>{item.body}</Text>
          <Text style={styles.meta}>{item.read ? 'Read' : 'Unread'}</Text>
        </Card>
      ))}
      <Notice>Opening a notification marks it read on this device and takes you to the task. A live account will deliver these from the server.</Notice>
    </Screen>
  );
}

function Bubble({ mine, text, meta }: { mine: boolean; text: string; meta: string }) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={styles.body}>{text}</Text>
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
  mine: { alignSelf: 'flex-end', backgroundColor: '#dcf2e3' },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.card },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  pillText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  pillTextOn: { color: '#fff' },
});
