import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Link href="/diagnostics" style={styles.row}>
        <Text style={styles.rowText}>Diagnóstico del widget</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.systemGroupedBackground },
  content: { padding: spacing.lg },
  row: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowText: { fontSize: 17, color: colors.label },
});
