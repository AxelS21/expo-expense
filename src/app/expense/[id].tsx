import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { listActiveCategories } from '@/db/categories.repository';
import { getExpenseById, trashExpense, updateExpense } from '@/db/expenses.repository';
import { ExpenseForm, type ExpenseFormValues } from '@/components/expenses/ExpenseForm';
import { keypadFromAmount } from '@/utils/money';
import { type ThemeColors, useTheme } from '@/constants/theme';
import type { Category, Expense } from '@/types/models';

export default function EditExpenseScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getExpenseById(id), listActiveCategories()]).then(([found, cats]) => {
      setCategories(cats);
      if (!found) {
        setNotFound(true);
        return;
      }
      setExpense(found);
    });
  }, [id]);

  async function handleSubmit({ amount, categoryId, note, dayKey }: ExpenseFormValues) {
    if (!expense) return;
    try {
      // Keep the stored time-of-day suffix and replace only the calendar day, as before.
      const time = expense.expenseDate.slice(10);
      await updateExpense(expense.id, { amount, categoryId, note, expenseDate: `${dayKey}${time}` });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  function handleDelete() {
    if (!expense) return;
    Alert.alert('Enviar a la papelera', 'El gasto quedará recuperable durante 2 días.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await trashExpense(expense.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  }

  if (!expense) {
    return (
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.center}
      >
        {notFound ? <Text style={styles.message}>Gasto no encontrado.</Text> : <ActivityIndicator />}
      </ScrollView>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="trash" accessibilityLabel="Eliminar gasto" onPress={handleDelete} />
      </Stack.Toolbar>
      <ExpenseForm
        categories={categories}
        initialKeypad={keypadFromAmount(expense.amount)}
        initialCategoryId={expense.categoryId}
        initialNote={expense.note ?? ''}
        initialDayKey={expense.expenseDate.slice(0, 10)}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
    message: { fontSize: 15, color: colors.secondaryLabel },
  });
}
