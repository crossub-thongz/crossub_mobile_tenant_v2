import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';

export function Screen({ children, tab = false }: { children: ReactNode; tab?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={tab ? ['top'] : ['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scroll, tab && styles.tabScroll]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function TabHeader({ kicker, title }: { kicker: string; title: string }) {
  const router = useRouter();
  const unreadNotices = useDemo().notices.some((item) => !item.read);
  return (
    <View style={styles.top}>
      <View style={styles.grow}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.h1}>{title}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={() => router.push('/flow/notifications')}
        style={styles.iconBtn}
      >
        <Ionicons name="notifications-outline" size={18} color={colors.ink} />
        {unreadNotices ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

export function BackButton({ fallback = '/' }: { fallback?: Href }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))} style={styles.back}>
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export function Card({ children, soft = false, onPress }: { children: ReactNode; soft?: boolean; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, soft && styles.soft]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, soft && styles.soft]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function RowItem({
  icon,
  title,
  subtitle,
  tag,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tag?: string;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.row}>
      <View style={styles.glyph}>
        <Ionicons name={icon} size={18} color={colors.ink} />
      </View>
      <View style={styles.grow}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{subtitle}</Text>
      </View>
      {tag ? <Tag label={tag} tone={tag === 'Action Required' ? 'amber' : 'neutral'} /> : null}
      <Ionicons name="chevron-forward" size={16} color="#9bad9f" />
    </View>
  );
  if (!onPress) return <View style={styles.item}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.item}>
      {body}
    </Pressable>
  );
}

export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'green' | 'amber' }) {
  return (
    <View style={[styles.tag, tone === 'green' && styles.tagGreen, tone === 'amber' && styles.tagAmber]}>
      <Text style={[styles.tagText, tone === 'green' && styles.tagTextGreen, tone === 'amber' && styles.tagTextAmber]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'outline';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, tone === 'secondary' && styles.buttonSecondary, tone === 'outline' && styles.buttonOutline]}
    >
      <Text style={[styles.buttonText, tone !== 'primary' && styles.buttonTextDark]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children }: { children: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#8b9b90" style={[styles.input, props.multiline && styles.multiline]} {...props} />;
}

export function Choice({
  selected,
  title,
  body,
  onPress,
}: {
  selected: boolean;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? colors.green : colors.muted} />
      <View style={styles.grow}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{body}</Text>
      </View>
    </Pressable>
  );
}

export function TaskHeader({ title, status }: { title: string; status: string }) {
  const tone = status === 'Completed' || status === 'Scheduled' ? 'green' : 'amber';
  return (
    <View style={styles.taskHead}>
      <View style={styles.grow}>
        <Text style={styles.h2}>{title}</Text>
        <PropertyLine />
      </View>
      <Tag label={status} tone={tone} />
    </View>
  );
}

export function PropertyLine() {
  const { property } = useDemo();
  return <Text style={styles.itemSub}>{property.title}</Text>;
}

export function Timeline({ status }: { status: string }) {
  const { scenario } = useDemo();
  const events = [
    ['Task created', 'Your property management team opened this task.'],
    ['Under review', `Updated by ${scenario.team}.`],
    ['Current stage', status],
  ];
  return (
    <View style={styles.section}>
      <Section title="Timeline" />
      <Card>
        {events.map(([title, body]) => (
          <View key={title} style={styles.event}>
            <View style={styles.dot} />
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemSub}>{body}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

export function ToastHost() {
  const { toast } = useDemo();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <View style={styles.toast}>
        <Text style={styles.toastText}>{toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32, gap: 12 },
  tabScroll: { paddingBottom: 28 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  grow: { flex: 1 },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  h1: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 4 },
  h2: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  back: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  backText: { color: colors.green, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  soft: { backgroundColor: colors.soft, borderColor: '#dbecdf' },
  section: { gap: 10, marginTop: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  item: { paddingVertical: 8 },
  glyph: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#f0f4f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  itemSub: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  tag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eef1ef' },
  tagGreen: { backgroundColor: colors.greenTag },
  tagAmber: { backgroundColor: colors.amberBg },
  tagText: { fontSize: 10, fontWeight: '700', color: '#75847a' },
  tagTextGreen: { color: '#138150' },
  tagTextAmber: { color: colors.amber },
  button: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonSecondary: { backgroundColor: '#f0f4f1' },
  buttonOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: '#cee4d4' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  buttonTextDark: { color: colors.green },
  notice: { backgroundColor: colors.notice, borderRadius: 12, padding: 12 },
  noticeText: { color: colors.noticeText, fontSize: 12, lineHeight: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#58695e' },
  input: {
    borderWidth: 1,
    borderColor: '#dfe8e0',
    borderRadius: 11,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  choice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    padding: 14,
    backgroundColor: colors.card,
  },
  choiceOn: { borderColor: colors.green, backgroundColor: colors.soft },
  taskHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  event: { paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#dce9df', paddingBottom: 14, gap: 4 },
  dot: {
    position: 'absolute',
    left: -6,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  toastWrap: { position: 'absolute', left: 20, right: 20, bottom: 28 },
  toast: { backgroundColor: '#213d2c', borderRadius: 13, padding: 14 },
  toastText: { color: '#fff', fontSize: 13, lineHeight: 18 },
});
