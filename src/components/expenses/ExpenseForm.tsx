import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { amountFromKeypad, formatAmount, type Amount } from '@/utils/money';
import type { Category } from '@/types/models';
import { AmountKeypad } from './AmountKeypad';
import { dateFromDayKey, dayKeyFromDate, formatDayLabel, shiftDayKey, todayKey } from './expenseDate';

export interface ExpenseFormValues {
  amount: Amount;
  categoryId: string;
  note: string;
  /** Local calendar day, 'YYYY-MM-DD'. */
  dayKey: string;
}

interface ExpenseFormProps {
  categories: Category[];
  initialKeypad?: string;
  initialCategoryId?: string | null;
  initialNote?: string;
  initialDayKey?: string;
  submitLabel: string;
  /** Persists the values. Rejecting keeps the form editable so the user can retry. */
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

export function ExpenseForm({
  categories,
  initialKeypad = '',
  initialCategoryId = null,
  initialNote = '',
  initialDayKey,
  submitLabel,
  onSubmit,
}: ExpenseFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [keypad, setKeypad] = useState(initialKeypad);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? categories[0]?.id ?? null);
  const [note, setNote] = useState(initialNote);
  const [editingNote, setEditingNote] = useState(false);
  const [dayKey, setDayKey] = useState(initialDayKey ?? todayKey());
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const amount = amountFromKeypad(keypad);
  const canSave = amount !== null && categoryId !== null && !saving;
  const isToday = dayKey === todayKey();
  const amountText = formatAmount(amount ?? 0);
  const trimmedNote = note.trim();

  async function handleSubmit() {
    if (!canSave || amount === null || categoryId === null) return;
    setSaving(true);
    try {
      await onSubmit({ amount, categoryId, note, dayKey });
    } catch {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={[styles.amount, amount === null && styles.amountPlaceholder]}
        numberOfLines={1}
        adjustsFontSizeToFit
        accessibilityRole="header"
        accessibilityLabel={`Monto: ${amountText}`}
        accessibilityLiveRegion="polite"
      >
        {amountText}
      </Text>

      <View style={styles.pillRow}>
        <Pressable
          style={[styles.pill, datePanelOpen && styles.pillActive]}
          onPress={() => setDatePanelOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={`Fecha: ${formatDayLabel(dayKey)}`}
          accessibilityState={{ expanded: datePanelOpen }}
        >
          <Text style={styles.pillIcon}>📅</Text>
          <Text style={styles.pillText}>{formatDayLabel(dayKey)}</Text>
        </Pressable>

        {editingNote ? (
          <TextInput
            style={[styles.pill, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            onBlur={() => setEditingNote(false)}
            onSubmitEditing={() => setEditingNote(false)}
            autoFocus
            returnKeyType="done"
            maxLength={120}
            placeholder="Nota"
            placeholderTextColor={colors.tertiaryLabel}
            accessibilityLabel="Nota opcional"
          />
        ) : (
          <Pressable
            style={[styles.pill, styles.notePill]}
            onPress={() => setEditingNote(true)}
            accessibilityRole="button"
            accessibilityLabel={trimmedNote ? `Nota: ${trimmedNote}` : 'Agregar nota'}
          >
            <Text style={styles.pillIcon}>✎</Text>
            <Text style={[styles.pillText, !trimmedNote && styles.pillTextMuted]} numberOfLines={1}>
              {trimmedNote || 'Agregar nota'}
            </Text>
          </Pressable>
        )}
      </View>

      {datePanelOpen && (
        <View style={styles.datePanel}>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setDayKey((key) => shiftDayKey(key, -1))}
              accessibilityRole="button"
              accessibilityLabel="Día anterior"
            >
              <Text style={styles.stepperGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.stepperLabel}>{formatDayLabel(dayKey)}</Text>
            <Pressable
              style={[styles.stepperButton, isToday && styles.disabled]}
              onPress={() => setDayKey((key) => shiftDayKey(key, 1))}
              disabled={isToday}
              accessibilityRole="button"
              accessibilityLabel="Día siguiente"
              accessibilityState={{ disabled: isToday }}
            >
              <Text style={styles.stepperGlyph}>›</Text>
            </Pressable>
          </View>
          {Platform.OS === 'ios' && (
            <Host matchContents>
              <DatePicker
                selection={dateFromDayKey(dayKey)}
                range={{ end: new Date() }}
                displayedComponents={['date']}
                onDateChange={(date) => setDayKey(dayKeyFromDate(date))}
                modifiers={[datePickerStyle('graphical')]}
              />
            </Host>
          )}
        </View>
      )}

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
              <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <AmountKeypad value={keypad} onChange={setKeypad} />

      <Pressable
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSubmit}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled: !canSave }}
      >
        {saving ? (
          <ActivityIndicator color={colors.onTint} />
        ) : (
          <Text style={styles.saveButtonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, gap: spacing.lg },
    amount: {
      fontSize: 56,
      fontWeight: '700',
      color: colors.label,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
      marginTop: spacing.sm,
    },
    amountPlaceholder: { color: colors.tertiaryLabel },
    pillRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
    },
    pillActive: { backgroundColor: colors.fill },
    notePill: { flexShrink: 1 },
    noteInput: { flex: 1, fontSize: 15, color: colors.label },
    pillIcon: { fontSize: 15, color: colors.secondaryLabel },
    pillText: { fontSize: 15, fontWeight: '500', color: colors.label, flexShrink: 1 },
    pillTextMuted: { color: colors.secondaryLabel },
    datePanel: { borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepperButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperGlyph: { fontSize: 24, color: colors.tint, fontWeight: '600' },
    stepperLabel: { fontSize: 17, fontWeight: '600', color: colors.label },
    categoryRow: { gap: spacing.sm },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      minHeight: 44,
      paddingHorizontal: spacing.md + 2,
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
    disabled: { opacity: 0.4 },
  });
}
