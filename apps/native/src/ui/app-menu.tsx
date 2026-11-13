import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/auth-context';

const ink = '#020617';
const muted = '#334155';
const line = '#e2e8f0';
const danger = '#ef4444';

const ITEMS: { label: string; href: Href }[] = [
  { label: 'Browse listings', href: '/listings' },
  { label: 'Applications', href: '/applications' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Lease renewal', href: '/flow/renewal' },
  { label: 'Notifications', href: '/flow/notifications' },
  { label: 'Documents', href: '/flow/documents' },
  { label: 'Settings', href: '/flow/notification-settings' },
  { label: 'Profile', href: '/profile' },
  { label: 'App tutorial', href: '/help/tutorial' },
  { label: 'FAQ', href: '/help/faq' },
];

export function AppMenuButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  function go(href: Href) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        onPress={() => setOpen(true)}
        style={styles.button}
      >
        <Ionicons name="menu-outline" size={22} color={ink} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.panel, { paddingTop: insets.top + 8 }]} onPress={() => undefined}>
            <View style={styles.panelHead}>
              <Text style={styles.kicker}>Menu</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={styles.close}>
                <Ionicons name="close" size={20} color={ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {ITEMS.map((item) => (
                <Pressable key={item.label} accessibilityRole="button" onPress={() => go(item.href)} style={styles.item}>
                  <Text style={styles.itemText}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                void logout();
              }}
              style={styles.logout}
            >
              <Ionicons name="log-out-outline" size={18} color={danger} />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.35)', justifyContent: 'flex-start' },
  panel: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: line, maxHeight: '70%' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  kicker: { color: muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 12 },
  item: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  itemText: { color: ink, fontSize: 15, fontWeight: '500' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: line,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  logoutText: { color: danger, fontSize: 15, fontWeight: '600' },
});
