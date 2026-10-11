import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, router, useFocusEffect } from 'expo-router';
import { type ThemeColors, useTheme, radius, spacing } from '@/constants/theme';
import { listActiveCategories } from '@/db/categories.repository';
import { getMonthlyTotal, getTotalsByCategory, listExpenses } from '@/db/expenses.repository';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { type RankedCategoryTotal, rankCategoryTotals } from '@/utils/aggregate';
import { dayLabel, monthName, yearMonthKey } from '@/utils/date';
import { formatAmount } from '@/utils/money';
import type { Category, Expense } from '@/types/models';

const TOP_CATEGORIES = 4;
const CATEGORY_AVATAR = 36;

interface HomeData {
  monthTotal: number;
  previousTotal: number;
  topCategories: RankedCategoryTotal[];
  recent: Expense[];
  categoriesById: Record<string, Category>;
}

const EMPTY_DATA: HomeData = {
  monthTotal: 0,
  previousTotal: 0,
  topCategories: [],
  recent: [],
  categoriesById: {},
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomeData>(EMPTY_DATA);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const now = new Date();
      setLoading(true);
      Promise.all([
        getMonthlyTotal(yearMonthKey(now)),
        getMonthlyTotal(yearMonthKey(now, -1)),
        getTotalsByCategory(yearMonthKey(now)),
        listExpenses({ limit: 5 }),
        listActiveCategories(),
      ])
        .then(([current, previous, byCategory, recent, categories]) => {
          if (cancelled) return;
          setData({
            monthTotal: current.total,
            previousTotal: previous.total,
            topCategories: rankCategoryTotals(byCategory, TOP_CATEGORIES),
            recent,
            categoriesById: Object.fromEntries(categories.map((c) => [c.id, c])),
          });
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const { monthTotal, previousTotal, topCategories, recent, categoriesById } = data;
  const comparison = comparisonText(monthTotal, previousTotal, new Date());

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

      <View style={[styles.card, styles.hero]}>
        <Text style={styles.heroLabel}>Este mes</Text>
        {loading ? (
          <ActivityIndicator style={styles.heroLoading} />
        ) : (
          <Text style={styles.heroTotal}>{formatAmount(monthTotal)}</Text>
        )}
        {!loading && comparison ? <Text style={styles.heroComparison}>{comparison}</Text> : null}
      </View>

      {topCategories.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Por categoría</Text>
          <View style={[styles.card, styles.categoryCard]}>
            {topCategories.map((entry) => {
              const category = categoriesById[entry.categoryId];
              return (
                <View key={entry.categoryId} style={styles.categoryRow}>
                  <View style={styles.categoryAvatar}>
                    <Text style={styles.categoryEmoji}>{category?.icon ?? '•'}</Text>
                  </View>
                  <View style={styles.categoryBody}>
                    <View style={styles.categoryLine}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {category?.name ?? 'Sin categoría'}
                      </Text>
                      <Text style={styles.categoryAmount}>{formatAmount(entry.total)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(entry.ratio * 100, 2)}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Últimos gastos</Text>
        <Link href="/history" style={styles.link}>
          Ver todos
        </Link>
      </View>

      {!loading && recent.length === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyTitle}>Todavía no cargaste gastos</Text>
          <Text style={styles.emptyText}>Anotá el primero y acá vas a ver en qué se va la plata.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/expense/new')}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
          >
            <Text style={styles.emptyButtonText}>Cargar primer gasto</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listCard}>
          {recent.map((item, index) => (
            <ExpenseRow
              key={item.id}
              expense={item}
              category={categoriesById[item.categoryId]}
              subtitle={item.note || dayLabel(item.expenseDate)}
              isFirst={index === 0}
              isLast={index === recent.length - 1}
              onPress={() => router.push(`/history/${item.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/** "$X más que septiembre" / "$X menos que septiembre", or null when there is nothing to compare. */
function comparisonText(current: number, previous: number, now: Date): string | null {
  if (previous <= 0 || current === previous) return null;
  const previousMonth = monthName(now.getMonth() - 1);
  const diff = Math.abs(current - previous);
  return `${formatAmount(diff)} ${current > previous ? 'más' : 'menos'} que ${previousMonth}`;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg },
    hero: { padding: spacing.xl, gap: spacing.xs },
    heroLabel: { fontSize: 15, fontWeight: '600', color: colors.secondaryLabel },
    heroLoading: { alignSelf: 'flex-start', marginVertical: spacing.md },
    heroTotal: {
      fontSize: 44,
      fontWeight: '700',
      color: colors.label,
      fontVariant: ['tabular-nums'],
    },
    heroComparison: { fontSize: 14, color: colors.secondaryLabel },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.label,
      marginTop: spacing.xxl,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: spacing.xxl,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.xs,
    },
    sectionTitleInline: { fontSize: 17, fontWeight: '600', color: colors.label },
    link: { color: colors.tint, fontSize: 15 },
    categoryCard: { padding: spacing.lg, gap: spacing.lg },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    categoryAvatar: {
      width: CATEGORY_AVATAR,
      height: CATEGORY_AVATAR,
      borderRadius: CATEGORY_AVATAR / 2,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryEmoji: { fontSize: 18 },
    categoryBody: { flex: 1, gap: 6 },
    categoryLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    categoryName: { flex: 1, fontSize: 15, color: colors.label },
    categoryAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.label,
      fontVariant: ['tabular-nums'],
    },
    barTrack: { height: 4, borderRadius: radius.pill, backgroundColor: colors.fill, overflow: 'hidden' },
    barFill: { height: 4, borderRadius: radius.pill, backgroundColor: colors.tint },
    listCard: { borderRadius: radius.lg, overflow: 'hidden' },
    emptyCard: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.label },
    emptyText: { fontSize: 15, color: colors.secondaryLabel, textAlign: 'center' },
    emptyButton: {
      marginTop: spacing.sm,
      backgroundColor: colors.tint,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    emptyButtonPressed: { opacity: 0.85 },
    emptyButtonText: { color: colors.onTint, fontSize: 16, fontWeight: '600' },
  });
}
