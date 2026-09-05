import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { listActiveCategories } from '@/db/categories.repository';
import { getMonthlyTotal, listExpenses } from '@/db/expenses.repository';
import { formatAmount } from '@/utils/money';
import type { Category, Expense } from '@/types/models';

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [monthTotal, setMonthTotal] = useState(0);
  const [recent, setRecent] = useState<Expense[]>([]);
  const [categoriesById, setCategoriesById] = useState<Record<string, Category>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([
        getMonthlyTotal(currentYearMonth()),
        listExpenses({ limit: 5 }),
        listActiveCategories(),
      ])
        .then(([total, expenses, categories]) => {
          if (cancelled) return;
          setMonthTotal(total.total);
          setRecent(expenses);
          setCategoriesById(Object.fromEntries(categories.map((c) => [c.id, c])));
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>Este mes</Text>
      {loading ? (
        <ActivityIndicator style={styles.monthLoading} />
      ) : (
        <Text style={styles.monthTotal}>{formatAmount(monthTotal)}</Text>
      )}

      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Ultimos gastos</Text>
        <Link href="/history" style={styles.link}>
          Ver todos los gastos
        </Link>
      </View>

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Sin gastos todavia</Text> : null}
        renderItem={({ item }) => {
          const category = categoriesById[item.categoryId];
          return (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>{category?.icon ?? '•'}</Text>
              <Text style={styles.rowName} numberOfLines={1}>
                {category?.name ?? 'Sin categoria'}
              </Text>
              <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
            </View>
          );
        }}
      />

      <Link href="/expense/new" asChild>
        <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="Nuevo gasto">
          <Text style={styles.fabText}>+$</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  monthLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginTop: 12 },
  monthLoading: { alignSelf: 'flex-start', marginTop: 8 },
  monthTotal: { fontSize: 36, fontWeight: '700', marginTop: 4 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
  },
  recentTitle: { fontSize: 17, fontWeight: '600' },
  link: { color: '#0A84FF', fontSize: 14 },
  list: { paddingTop: 8, gap: 4 },
  empty: { color: '#8E8E93', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowIcon: { fontSize: 20 },
  rowName: { flex: 1, fontSize: 16 },
  rowAmount: { fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
