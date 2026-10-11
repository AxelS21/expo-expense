import { useMemo } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';
import { type ThemeColors, radius, spacing, useTheme } from '@/constants/theme';
import { formatAmount } from '@/utils/money';
import type { Category, Expense } from '@/types/models';

const AVATAR_SIZE = 40;

export interface ExpenseRowProps extends Omit<PressableProps, 'style' | 'children'> {
  expense: Expense;
  category: Category | undefined;
  /** Secondary line. Falls back to nothing when empty. */
  subtitle?: string | null;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * One expense inside a grouped surface card. The card is built from its rows: the first and
 * last rows round their outer corners, and every row except the last draws a hairline separator
 * inset after the avatar.
 */
export function ExpenseRow({
  expense,
  category,
  subtitle,
  isFirst = false,
  isLast = false,
  ...pressableProps
}: ExpenseRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const name = category?.name ?? 'Sin categoría';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatAmount(expense.amount)}`}
      {...pressableProps}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.first,
        isLast && styles.last,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{category?.icon ?? '•'}</Text>
      </View>
      <View style={[styles.body, !isLast && styles.separator]}>
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={styles.amount}>{formatAmount(expense.amount)}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingLeft: spacing.lg,
    },
    first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
    last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
    pressed: { backgroundColor: colors.fill },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.fill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 20 },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginLeft: spacing.md,
      paddingRight: spacing.lg,
      paddingVertical: spacing.md,
    },
    separator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    texts: { flex: 1, gap: 2 },
    name: { fontSize: 16, color: colors.label },
    subtitle: { fontSize: 13, color: colors.secondaryLabel },
    amount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.label,
      fontVariant: ['tabular-nums'],
    },
  });
}
