import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { listActiveCategories } from '@/db/categories.repository';
import { listExpenses, trashExpense } from '@/db/expenses.repository';
import { formatAmount } from '@/utils/money';
import { groupByDay, isWithinRange, periodStart, type QuickPeriod } from '@/utils/date';
import type { Category, Expense } from '@/types/models';

const QUICK_PERIODS: { key: QuickPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'all', label: 'Todos' },
];

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<QuickPeriod>('month');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

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
    const from = showCustomRange ? customFrom || null : periodStart(period)?.toISOString() ?? null;
    const to = showCustomRange ? customTo || null : null;
    return expenses.filter((expense) => {
      if (categoryId && expense.categoryId !== categoryId) return false;
      return isWithinRange(expense.expenseDate, from, to);
    });
  }, [expenses, categoryId, period, showCustomRange, customFrom, customTo]);

  const sections = useMemo(
    () =>
      groupByDay(filtered, (e) => e.expenseDate).map((group) => ({
        title: group.label,
        data: group.items,
      })),
    [filtered]
  );

  function handleTrash(expense: Expense) {
    Alert.alert('Enviar a la papelera', 'El gasto quedara recuperable durante 2 dias.', [
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

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {QUICK_PERIODS.map((option) => (
          <Pressable
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
          onPress={() => setShowCustomRange((v) => !v)}
          style={[styles.chip, showCustomRange && styles.chipSelected]}
        >
          <Text style={[styles.chipText, showCustomRange && styles.chipTextSelected]}>Rango</Text>
        </Pressable>
      </ScrollView>

      {showCustomRange && (
        <View style={styles.rangeRow}>
          <TextInput
            style={styles.rangeInput}
            placeholder="Desde AAAA-MM-DD"
            value={customFrom}
            onChangeText={setCustomFrom}
          />
          <TextInput
            style={styles.rangeInput}
            placeholder="Hasta AAAA-MM-DD"
            value={customTo}
            onChangeText={setCustomTo}
          />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <Pressable
          onPress={() => setCategoryId(null)}
          style={[styles.chip, categoryId === null && styles.chipSelected]}
        >
          <Text style={[styles.chipText, categoryId === null && styles.chipTextSelected]}>Todas</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        ListEmptyComponent={<Text style={styles.empty}>Sin gastos en este periodo</Text>}
        renderItem={({ item }) => {
          const category = categoriesById[item.categoryId];
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/expense/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Editar gasto ${category?.name ?? ''} ${formatAmount(item.amount)}`}
            >
              <Text style={styles.rowIcon}>{category?.icon ?? '•'}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {category?.name ?? 'Sin categoria'}
                </Text>
                {item.note ? (
                  <Text style={styles.rowNote} numberOfLines={1}>
                    {item.note}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
              <Pressable
                onPress={() => handleTrash(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Eliminar gasto"
                style={styles.trashButton}
              >
                <Text style={styles.trashIcon}>🗑</Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexGrow: 0, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  chipSelected: { backgroundColor: '#0A84FF' },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  rangeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  rangeInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 4,
  },
  empty: { color: '#8E8E93', paddingVertical: 24, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowIcon: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowName: { fontSize: 16 },
  rowNote: { fontSize: 13, color: '#8E8E93' },
  rowAmount: { fontSize: 16, fontWeight: '600' },
  trashButton: { paddingLeft: 6 },
  trashIcon: { fontSize: 16 },
});
