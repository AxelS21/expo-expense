import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import * as Updates from 'expo-updates';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RELEASE_LABEL } from '@/constants/release';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { Symbol } from '@/components/ui/Symbol';
import type { Backup } from '@/services/backup.format';
import { exportBackup, pickBackup, restoreBackup } from '@/services/backup.service';
import { runQuickLogSync } from '@/widgets/register';

type BackupTask = 'export' | 'restore' | null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatPublishedAt(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const versionValue = `${RELEASE_LABEL} · ${Updates.isEmbeddedLaunch ? 'build' : 'OTA'}`;
  const publishedAt = formatPublishedAt(Updates.createdAt);
  const [task, setTask] = useState<BackupTask>(null);

  async function handleExport() {
    setTask('export');
    try {
      await exportBackup();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo exportar', errorMessage(error));
    } finally {
      setTask(null);
    }
  }

  async function runRestore(backup: Backup) {
    setTask('restore');
    try {
      const summary = await restoreBackup(backup);
      runQuickLogSync();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Backup restaurado',
        `Se restauraron ${summary.expenses} gastos y ${summary.categories} categorías.`
      );
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo restaurar', `${errorMessage(error)} Tus datos no cambiaron.`);
    } finally {
      setTask(null);
    }
  }

  async function handleRestore() {
    setTask('restore');
    let backup: Backup;
    try {
      const picked = await pickBackup();
      if (picked.status === 'canceled') return;
      if (picked.status === 'invalid') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Backup inválido', picked.error.message);
        return;
      }
      backup = picked.backup;
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo leer el archivo', errorMessage(error));
      return;
    } finally {
      setTask(null);
    }

    const { expenses, categories } = backup.data;
    Alert.alert(
      'Restaurar backup',
      `Esto reemplaza todos tus datos actuales por los del backup (${expenses.length} gastos, ${categories.length} categorías). Antes se guarda una copia de seguridad de tus datos actuales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => runRestore(backup),
        },
      ]
    );
  }

  const busy = task !== null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Link href="/settings/diagnostics" style={styles.row}>
        <Text style={styles.rowText}>Diagnóstico del widget</Text>
      </Link>

      <Text style={styles.sectionHeader}>Gastos</Text>
      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/categories')}
          style={({ pressed }) => [styles.valueRow, pressed && styles.pressed]}
        >
          <Text style={styles.rowText}>Categorías</Text>
          <Symbol name="chevron.right" size={14} weight="semibold" color={colors.tertiaryLabel} fallback="›" />
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/quick-log')}
          style={({ pressed }) => [styles.valueRow, pressed && styles.pressed]}
        >
          <Text style={styles.rowText}>Accesos rápidos del widget</Text>
          <Symbol name="chevron.right" size={14} weight="semibold" color={colors.tertiaryLabel} fallback="›" />
        </Pressable>
      </View>

      <Text style={styles.sectionHeader}>Datos</Text>
      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={handleExport}
          style={({ pressed }) => [styles.valueRow, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, busy && styles.disabled]}>Exportar backup</Text>
          {task === 'export' ? <ActivityIndicator color={colors.secondaryLabel} /> : null}
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={handleRestore}
          style={({ pressed }) => [styles.valueRow, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, busy && styles.disabled]}>Restaurar backup</Text>
          {task === 'restore' ? <ActivityIndicator color={colors.secondaryLabel} /> : null}
        </Pressable>
      </View>

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
    actionText: { fontSize: 17, color: colors.tint },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.6 },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.lg,
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
