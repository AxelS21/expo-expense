import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import { listActiveCategories } from '@/db/categories.repository';
import { createExpense } from '@/db/expenses.repository';
import { ExpenseForm, type ExpenseFormValues } from '@/components/expenses/ExpenseForm';
import { isoForNewExpense, todayKey } from '@/components/expenses/expenseDate';
import { type ThemeColors, useTheme } from '@/constants/theme';
import type { Category } from '@/types/models';

export default function NewExpenseScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    listActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function handleSubmit({ amount, categoryId, note, dayKey }: ExpenseFormValues) {
    try {
      const expenseDate = dayKey === todayKey() ? undefined : isoForNewExpense(dayKey);
      await createExpense({ amount, categoryId, note, expenseDate });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Cerrar" onPress={() => router.back()} />
      </Stack.Toolbar>
      {categories === null ? (
        <ScrollView
          style={styles.container}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.center}
        >
          <ActivityIndicator />
        </ScrollView>
      ) : (
        <ExpenseForm categories={categories} submitLabel="Guardar gasto" onSubmit={handleSubmit} />
      )}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  });
}
