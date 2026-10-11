import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AmountKeypad } from '@/components/expenses/AmountKeypad';
import { Symbol } from '@/components/ui/Symbol';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { listActiveCategories } from '@/db/categories.repository';
import {
  type QuickLogPreset,
  createQuickLogPreset,
  deleteQuickLogPreset,
  listQuickLogPresets,
  moveQuickLogPreset,
} from '@/db/quickLogPresets.repository';
import { MAX_QUICK_LOG_PRESETS } from '@/services/quickLog.plan';
import type { Category } from '@/types/models';
import { amountFromKeypad, formatAmount } from '@/utils/money';
import { runQuickLogSync } from '@/widgets/register';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

// Presets for the quick log widget: one tap on the widget logs category + amount.
export default function QuickLogSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [presets, setPresets] = useState<QuickLogPreset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [keypad, setKeypad] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const [nextPresets, nextCategories] = await Promise.all([listQuickLogPresets(), listActiveCategories()]);
    setPresets(nextPresets);
    setCategories(nextCategories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  async function mutate(action: () => Promise<void>) {
    try {
      await action();
      await reload();
      runQuickLogSync();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo guardar', errorMessage(error));
    }
  }

  const amount = amountFromKeypad(keypad);
  const canSave = categoryId !== null && amount !== null && !saving;
  const isFull = presets.length >= MAX_QUICK_LOG_PRESETS;

  async function handleSave() {
    if (categoryId === null || amount === null) return;
    setSaving(true);
    await mutate(async () => {
      await createQuickLogPreset({ categoryId, amount });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdding(false);
      setCategoryId(null);
      setKeypad('');
    });
    setSaving(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.caption}>
        Cada acceso registra un gasto con un toque desde el widget, sin abrir la app. Los gastos
        aparecen la próxima vez que abrís Expense.
      </Text>

      {presets.length > 0 ? (
        <View style={styles.group}>
          {presets.map((preset, index) => (
            <View key={preset.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.presetRow}>
                <Text style={styles.presetIcon}>{preset.categoryIcon}</Text>
                <View style={styles.presetText}>
                  <Text style={styles.rowText} numberOfLines={1}>
                    {preset.categoryName}
                  </Text>
                  <Text style={styles.rowValue}>{formatAmount(preset.amount)}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Subir ${preset.categoryName}`}
                  disabled={index === 0}
                  onPress={() => mutate(() => moveQuickLogPreset(preset.id, 'up'))}
                  style={({ pressed }) => [styles.iconButton, (pressed || index === 0) && styles.dimmed]}
                >
                  <Symbol name="chevron.up" size={16} weight="semibold" color={colors.tint} fallback="↑" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bajar ${preset.categoryName}`}
                  disabled={index === presets.length - 1}
                  onPress={() => mutate(() => moveQuickLogPreset(preset.id, 'down'))}
                  style={({ pressed }) => [
                    styles.iconButton,
                    (pressed || index === presets.length - 1) && styles.dimmed,
                  ]}
                >
                  <Symbol name="chevron.down" size={16} weight="semibold" color={colors.tint} fallback="↓" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${preset.categoryName}`}
                  onPress={() => mutate(() => deleteQuickLogPreset(preset.id))}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.dimmed]}
                >
                  <Symbol name="trash" size={16} color={colors.destructive} fallback="✕" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Todavía no configuraste accesos rápidos.</Text>
      )}

      {isFull ? (
        <Text style={styles.caption}>Llegaste al máximo de {MAX_QUICK_LOG_PRESETS} accesos.</Text>
      ) : adding ? (
        <View style={styles.form}>
          <Text style={[styles.amount, amount === null && styles.amountPlaceholder]}>
            {formatAmount(amount ?? 0)}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            keyboardShouldPersistTaps="handled"
          >
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <AmountKeypad value={keypad} onChange={setKeypad} />
          <Pressable
            style={[styles.saveButton, !canSave && styles.disabledButton]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            {saving ? (
              <ActivityIndicator color={colors.onTint} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar acceso</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAdding(false)}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.dimmed]}
          >
            <Text style={styles.actionText}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          style={({ pressed }) => [styles.group, styles.addRow, pressed && styles.dimmed]}
        >
          <Symbol name="plus.circle.fill" size={20} color={colors.tint} fallback="+" />
          <Text style={styles.actionText}>Agregar acceso</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.lg },
    caption: { fontSize: 13, color: colors.secondaryLabel, marginHorizontal: spacing.lg },
    empty: { fontSize: 15, color: colors.secondaryLabel, textAlign: 'center', marginVertical: spacing.lg },
    group: { backgroundColor: colors.surface, borderRadius: radius.md },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.lg,
    },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 56,
      paddingLeft: spacing.lg,
      paddingRight: spacing.xs,
    },
    presetIcon: { fontSize: 22 },
    presetText: { flex: 1 },
    rowText: { fontSize: 17, color: colors.label },
    rowValue: { fontSize: 15, color: colors.secondaryLabel, fontVariant: ['tabular-nums'] },
    iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    dimmed: { opacity: 0.4 },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 44,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    actionText: { fontSize: 17, color: colors.tint },
    form: { gap: spacing.lg },
    amount: {
      fontSize: 44,
      fontWeight: '700',
      color: colors.label,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    amountPlaceholder: { color: colors.tertiaryLabel },
    categoryRow: { gap: spacing.sm },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
    },
    categoryChipSelected: { backgroundColor: colors.tint },
    categoryIcon: { fontSize: 18 },
    categoryName: { fontSize: 15, fontWeight: '500', color: colors.label },
    categoryNameSelected: { color: colors.onTint },
    saveButton: {
      backgroundColor: colors.tint,
      borderRadius: radius.lg,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: { color: colors.onTint, fontSize: 17, fontWeight: '600' },
    disabledButton: { opacity: 0.4 },
    cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  });
}
