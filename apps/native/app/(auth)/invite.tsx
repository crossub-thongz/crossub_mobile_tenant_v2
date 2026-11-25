import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme';
import { Screen } from '@/src/ui/ui';

export default function InviteScreen() {
  return (
    <Screen>
      <Text style={styles.brand}>Invitation</Text>
      <Link href="/login" dismissTo style={styles.link}>
        Back to sign in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  link: { color: colors.green, fontWeight: '700', marginTop: 8 },
});
