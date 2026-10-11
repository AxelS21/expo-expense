import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Link, router, useFocusEffect } from 'expo-router';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { listActiveCategories } from '@/db/categories.repository';
import { listExpenses, trashExpense } from '@/db/expenses.repository';
import { formatAmount } from '@/utils/money';
import { sumAmounts } from '@/utils/aggregate';
import {
  clampDayRange,
  groupByDay,
  isWithinRange,
  monthStartDayKey,
  periodStart,
  type QuickPeriod,
} from '@/utils/date';
import { DatePickerPanel } from '@/components/DatePickerPanel';
import { dateFromDayKey, todayKey } from '@/components/expenses/expenseDate';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import type { Category, Expense } from '@/types/models';

const QUICK_PERIODS: { key: QuickPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'all', label: 'Todos' },
];

type RangeEnd = 'from' | 'to';

// Filter chips draw at 36pt to keep the rows compact; 4pt of vertical slop on each side
// brings the touch target to the 44pt HIG minimum (the 4pt row padding leaves room for it).
const CHIP_HIT_SLOP = { top: 4, bottom: 4 } as const;

const RANGE_ENDS: { end: RangeEnd; label: string }[] = [
  { end: 'from', label: 'Desde' },
  { end: 'to', label: 'Hasta' },
];

/** "hoy" or a compact Spanish day such as "1 oct". */
function rangeDayText(dayKey: string): string {
  if (dayKey === todayKey()) return 'hoy';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
    .format(dateFromDayKey(dayKey))
    .replace('.', '');
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<QuickPeriod>('month');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState(() => ({
    from: monthStartDayKey(new Date()),
    to: todayKey(),
  }));
  const [editingEnd, setEditingEnd] = useState<RangeEnd | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);

  function changeRangeEnd(end: RangeEnd, dayKey: string) {
    setCustomRange((range) => clampDayRange({ ...range, [end]: dayKey }, end));
  }

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listExpenses(), listActiveCategories()])
      .then(([e, c]) => {
        setExpenses(e);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    // Day keys make isWithinRange use local start of `from` and local end of `to`.
    const from = showCustomRange ? customRange.from : periodStart(period)?.toISOString() ?? null;
    const to = showCustomRange ? customRange.to : null;
    return expenses.filter((expense) => {
      if (categoryId && expense.categoryId !== categoryId) return false;
      return isWithinRange(expense.expenseDate, from, to);
    });
  }, [expenses, categoryId, period, showCustomRange, customRange]);

  const sections = useMemo(
    () =>
      groupByDay(filtered, (e) => e.expenseDate).map((group) => ({
        title: group.label,
        total: sumAmounts(group.items),
        data: group.items,
      })),
    [filtered]
  );

  function handleTrash(expense: Expense) {
    Alert.alert('Enviar a la papelera', 'El gasto quedará recuperable durante 2 días.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await trashExpense(expense.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          load();
        },
      },
    ]);
  }

  // Android has no Link context menu; long press opens the same two actions in a dialog.
  function showAndroidActions(expense: Expense) {
    Alert.alert('Gasto', undefined, [
      { text: 'Editar', onPress: () => router.push(`/history/${expense.id}`) },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleTrash(expense) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const filters = (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {QUICK_PERIODS.map((option) => (
          <Pressable
            hitSlop={CHIP_HIT_SLOP}
            key={option.key}
            onPress={() => {
              setShowCustomRange(false);
              setPeriod(option.key);
            }}
            style={[
              styles.chip,
              !showCustomRange && period === option.key && styles.chipSelected,
            ]}
          >
            <Text style={[styles.chipText, !showCustomRange && period === option.key && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          hitSlop={CHIP_HIT_SLOP}
          onPress={() => setShowCustomRange((v) => !v)}
          style={[styles.chip, showCustomRange && styles.chipSelected]}
        >
          <Text style={[styles.chipText, showCustomRange && styles.chipTextSelected]}>Rango</Text>
        </Pressable>
      </ScrollView>

      {showCustomRange && (
        <View style={styles.rangeBlock}>
          <View style={styles.rangeRow}>
            {RANGE_ENDS.map(({ end, label }) => {
              const active = editingEnd === end;
              const dayText = rangeDayText(customRange[end]);
              return (
                <Pressable
                  key={end}
                  style={[styles.rangePill, active && styles.rangePillActive]}
                  onPress={() => setEditingEnd((current) => (current === end ? null : end))}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${dayText}`}
                  accessibilityState={{ expanded: active }}
                >
                  <Text style={[styles.rangePillLabel, active && styles.rangePillTextActive]}>{label}</Text>
                  <Text style={[styles.rangePillValue, active && styles.rangePillTextActive]}>{dayText}</Text>
                </Pressable>
              );
            })}
          </View>
          {editingEnd && (
            <DatePickerPanel
              dayKey={customRange[editingEnd]}
              onChange={(dayKey) => changeRangeEnd(editingEnd, dayKey)}
            />
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          hitSlop={CHIP_HIT_SLOP}
          onPress={() => setCategoryId(null)}
          style={[styles.chip, categoryId === null && styles.chipSelected]}
        >
          <Text style={[styles.chipText, categoryId === null && styles.chipTextSelected]}>Todas</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            hitSlop={CHIP_HIT_SLOP}
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[styles.chip, categoryId === category.id && styles.chipSelected]}
          >
            <Text
              style={[styles.chipText, categoryId === category.id && styles.chipTextSelected]}
            >
              {category.icon} {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  return (
    <SectionList
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={filters}
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionTotal}>{formatAmount(section.total)}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Sin gastos en este período</Text>}
      renderItem={({ item, index, section }) => {
        const row = (
          <ExpenseRow
            expense={item}
            category={categoriesById[item.categoryId]}
            subtitle={item.note}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
            accessibilityHint="Mantené presionado para ver más opciones"
            onLongPress={Platform.OS === 'ios' ? undefined : () => showAndroidActions(item)}
          />
        );
        if (Platform.OS !== 'ios') {
          return (
            <Link href={`/history/${item.id}`} asChild>
              {row}
            </Link>
          );
        }
        // iOS: native context menu on long press, plain push on tap.
        return (
          <Link href={`/history/${item.id}`}>
            <Link.Trigger>{row}</Link.Trigger>
            <Link.Menu>
              <Link.MenuAction
                title="Editar"
                icon="pencil"
                onPress={() => router.push(`/history/${item.id}`)}
              />
              <Link.MenuAction
                title="Eliminar"
                icon="trash"
                destructive
                onPress={() => handleTrash(item)}
              />
            </Link.Menu>
          </Link>
        );
      }}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    filterRow: { flexGrow: 0, paddingVertical: spacing.xs },
    filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    chip: {
      height: 36,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.fill,
    },
    chipSelected: { backgroundColor: colors.tint },
    chipText: { fontSize: 14, fontWeight: '500', color: colors.label },
    chipTextSelected: { color: colors.onTint },
    rangeBlock: { paddingHorizontal: spacing.lg, marginVertical: spacing.xs, gap: spacing.sm },
    rangeRow: { flexDirection: 'row', gap: spacing.sm },
    rangePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.fill,
    },
    rangePillActive: { backgroundColor: colors.tint },
    rangePillTextActive: { color: colors.onTint },
    rangePillLabel: { fontSize: 14, color: colors.secondaryLabel },
    rangePillValue: { fontSize: 14, fontWeight: '600', color: colors.label },
    list: { paddingBottom: spacing.xxl },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg + spacing.xs,
    },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.label },
    sectionTotal: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondaryLabel,
      fontVariant: ['tabular-nums'],
    },
    empty: { color: colors.secondaryLabel, paddingVertical: spacing.xxl, textAlign: 'center' },
  });
}
