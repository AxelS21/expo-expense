import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, router, useFocusEffect } from 'expo-router';
import { type ThemeColors, useTheme, spacing } from '@/constants/theme';
import { listActiveCategories } from '@/db/categories.repository';
import { getMonthlyTotal, listExpenses } from '@/db/expenses.repository';
import { formatAmount } from '@/utils/money';
import type { Category, Expense } from '@/types/models';

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel="Nuevo gasto"
          onPress={() => router.push('/expense/new')}
        />
      </Stack.Toolbar>
      <Text style={styles.monthLabel}>Este mes</Text>
      {loading ? (
        <ActivityIndicator style={styles.monthLoading} />
      ) : (
        <Text style={styles.monthTotal}>{formatAmount(monthTotal)}</Text>
      )}

      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Últimos gastos</Text>
        <Link href="/history" style={styles.link}>
          Ver todos los gastos
        </Link>
      </View>

      <View style={styles.list}>
        {!loading && recent.length === 0 ? (
          <Text style={styles.empty}>Sin gastos todavia</Text>
        ) : null}
        {recent.map((item) => {
          const category = categoriesById[item.categoryId];
          return (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowIcon}>{category?.icon ?? '•'}</Text>
              <Text style={styles.rowName} numberOfLines={1}>
                {category?.name ?? 'Sin categoria'}
              </Text>
              <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    monthLabel: { fontSize: 13, fontWeight: '600', color: colors.secondaryLabel, marginTop: spacing.md },
    monthLoading: { alignSelf: 'flex-start', marginTop: spacing.sm },
    monthTotal: { fontSize: 36, fontWeight: '700', marginTop: spacing.xs, color: colors.label },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xxl,
    },
    recentTitle: { fontSize: 17, fontWeight: '600', color: colors.label },
    link: { color: colors.tint, fontSize: 14 },
    list: { paddingTop: spacing.sm, gap: spacing.xs },
    empty: { color: colors.secondaryLabel, paddingVertical: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    rowIcon: { fontSize: 20 },
    rowName: { flex: 1, fontSize: 16, color: colors.label },
    rowAmount: { fontSize: 16, fontWeight: '600', color: colors.label },
  });
}
