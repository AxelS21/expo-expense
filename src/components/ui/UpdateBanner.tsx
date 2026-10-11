import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

import { radius, spacing, useTheme, type ThemeColors } from '@/constants/theme';

// Space reserved for the floating native tab bar, so the banner sits just above it.
const TAB_BAR_CLEARANCE = 72;

export function UpdateBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isDownloading, downloadProgress, isUpdatePending } = Updates.useUpdates();

  if (__DEV__ || (!isDownloading && !isUpdatePending)) return null;

  const percent = Math.round((downloadProgress ?? 0) * 100);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      <View style={styles.pill} accessibilityLiveRegion="polite">
        {isUpdatePending ? (
          <>
            <Text style={styles.title}>Actualización lista</Text>
            <Pressable
              onPress={() => Updates.reloadAsync()}
              style={styles.button}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.buttonText}>Reiniciar</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.progressBody}>
            <Text style={styles.title}>Descargando actualización… {percent}%</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(percent, 4)}%` }]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 48,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    progressBody: { gap: spacing.xs, minWidth: 220 },
    title: { fontSize: 15, fontWeight: '600', color: colors.label },
    track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.fill, overflow: 'hidden' },
    fill: { height: 4, borderRadius: radius.pill, backgroundColor: colors.tint },
    button: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.tint,
    },
    buttonText: { fontSize: 15, fontWeight: '600', color: colors.onTint },
  });
}
