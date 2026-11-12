import { Stack } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/src/theme';
import { ToastHost } from '@/src/ui/ui';

export default function AppLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      <ToastHost />
    </View>
  );
}
