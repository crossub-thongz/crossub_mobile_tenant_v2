import { StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme';

/** Web has no LiveKit room. The phone build uses cros-call.native.tsx. */
export function CrosCall() {
  return <Text style={styles.body}>Voice calls run in the iPhone and Android app.</Text>;
}

const styles = StyleSheet.create({
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
