import { Link } from 'expo-router';
import * as Updates from 'expo-updates';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RELEASE_LABEL } from '@/constants/release';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';

function formatPublishedAt(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const versionValue = `${RELEASE_LABEL} · ${Updates.isEmbeddedLaunch ? 'build' : 'OTA'}`;
  const publishedAt = formatPublishedAt(Updates.createdAt);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Link href="/diagnostics" style={styles.row}>
        <Text style={styles.rowText}>Diagnóstico del widget</Text>
      </Link>

      <Text style={styles.sectionHeader}>Acerca de</Text>
      <View style={styles.group}>
        <View style={styles.valueRow}>
          <Text style={styles.rowText}>Versión</Text>
          <Text style={styles.rowValue}>{versionValue}</Text>
        </View>
      </View>
      {publishedAt ? <Text style={styles.caption}>Publicada el {publishedAt}</Text> : null}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    row: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    rowText: { fontSize: 17, color: colors.label },
    sectionHeader: {
      fontSize: 13,
      color: colors.secondaryLabel,
      textTransform: 'uppercase',
      marginTop: spacing.xxl,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg,
    },
    group: { backgroundColor: colors.surface, borderRadius: radius.md },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    rowValue: { fontSize: 17, color: colors.secondaryLabel },
    caption: {
      fontSize: 13,
      color: colors.secondaryLabel,
      marginTop: spacing.sm,
      marginHorizontal: spacing.lg,
    },
  });
}
