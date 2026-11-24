import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDemo } from '@/src/demo/store';
import { colors } from '@/src/theme';

const HOME_SIZE = 56;
const BAR_PADDING = 12;
const BAR_BORDER = 1;
const ORDER = ['activity', 'inbox', 'index', 'payments', 'profile'] as const;

const LABEL: Record<(typeof ORDER)[number], string> = {
  activity: 'Activity',
  inbox: 'Inbox',
  index: 'Home',
  payments: 'Payments',
  profile: 'Profile',
};

function TenantTabBar({
  state,
  navigateToTab,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const unread = useDemo().threads.filter((thread) => thread.unread).length;
  const routes = ORDER.map((name) => state.routes.find((route) => route.name === name)).filter((route) => route != null);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {routes.map((route) => {
          const index = state.routes.findIndex((item) => item.key === route.key);
          const focused = state.index === index;
          const name = route.name as (typeof ORDER)[number];
          const isHome = name === 'index';
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              hitSlop={isHome ? { top: HOME_SIZE / 2 } : undefined}
              style={styles.item}
            >
              {isHome ? (
                <View style={styles.homeSlot}>
                  <View style={styles.home}>
                    <Ionicons name="sync" size={26} color="#fff" />
                  </View>
                </View>
              ) : (
                <View>
                  <Ionicons
                    name={iconName(name, focused)}
                    size={22}
                    color={focused ? colors.green : '#9aa8a1'}
                  />
                  {name === 'inbox' && unread > 0 ? <View style={styles.dot} /> : null}
                </View>
              )}
              <Text style={[styles.label, focused && styles.labelOn, isHome && styles.homeLabel]}>{LABEL[name]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function iconName(name: Exclude<(typeof ORDER)[number], 'index'>, focused: boolean): keyof typeof Ionicons.glyphMap {
  if (name === 'activity') return focused ? 'list' : 'list-outline';
  if (name === 'inbox') return focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
  if (name === 'payments') return focused ? 'card' : 'card-outline';
  return focused ? 'person' : 'person-outline';
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TenantTabBar state={props.state} navigateToTab={props.navigateToTab} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0, height: 92, overflow: 'visible' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: 'transparent', paddingHorizontal: 16, overflow: 'visible' },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingTop: BAR_PADDING,
    paddingBottom: BAR_PADDING,
    borderWidth: BAR_BORDER,
    borderColor: colors.greenLine,
    overflow: 'visible',
  },
  item: { flex: 1, alignItems: 'center', gap: 4, overflow: 'visible' },
  homeSlot: { height: 22, alignItems: 'center', overflow: 'visible' },
  home: {
    position: 'absolute',
    width: HOME_SIZE,
    height: HOME_SIZE,
    borderRadius: HOME_SIZE / 2,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    top: -(HOME_SIZE / 2) - BAR_PADDING - BAR_BORDER,
  },
  label: { color: '#9aa8a1', fontSize: 11, fontWeight: '600' },
  labelOn: { color: colors.green },
  homeLabel: { color: colors.green, fontWeight: '700' },
  dot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
});
