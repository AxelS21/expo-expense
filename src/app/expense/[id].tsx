import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { listActiveCategories } from '@/db/categories.repository';
import { getExpenseById, trashExpense, updateExpense } from '@/db/expenses.repository';
import { formatAmount, parseAmount } from '@/utils/money';
import { colors } from '@/constants/theme';
import type { Category, Expense } from '@/types/models';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawAmount, setRawAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
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
      setRawAmount(String(found.amount));
      setCategoryId(found.categoryId);
      setNote(found.note ?? '');
      setDateInput(found.expenseDate.slice(0, 10));
    });
  }, [id]);

  const amount = parseAmount(rawAmount);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
  const canSave = amount !== null && categoryId !== null && validDate && !saving;

  async function handleSave() {
    if (!canSave || !expense || amount === null || categoryId === null) return;
    setSaving(true);
    try {
      const time = expense.expenseDate.slice(10);
      await updateExpense(expense.id, { amount, categoryId, note, expenseDate: `${dateInput}${time}` });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!expense) return;
    Alert.alert('Enviar a la papelera', 'El gasto quedara recuperable durante 2 dias.', [
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

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text>Gasto no encontrado.</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Monto</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="number-pad"
        value={rawAmount}
        onChangeText={setRawAmount}
        accessibilityLabel="Monto del gasto"
      />
      {amount !== null && <Text style={styles.amountPreview}>{formatAmount(amount)}</Text>}

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categoryRow}>
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
      </View>

      <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.dateInput}
        value={dateInput}
        onChangeText={setDateInput}
        placeholder="2026-09-05"
        accessibilityLabel="Fecha del gasto"
      />

      <Text style={styles.label}>Nota opcional</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="Nota"
        value={note}
        onChangeText={setNote}
        multiline
        accessibilityLabel="Nota opcional"
      />

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel="Guardar cambios"
      >
        {saving ? (
          <ActivityIndicator color={colors.onTint} />
        ) : (
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel="Eliminar gasto"
      >
        <Text style={styles.deleteButtonText}>Eliminar gasto</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.systemBackground },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.secondaryLabel, marginTop: 16 },
  amountInput: { fontSize: 44, fontWeight: '700', paddingVertical: 8, color: colors.label },
  amountPreview: { fontSize: 15, color: colors.secondaryLabel },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.tertiarySystemFill,
  },
  categoryChipSelected: { backgroundColor: colors.tint },
  categoryIcon: { fontSize: 18 },
  categoryName: { fontSize: 15, fontWeight: '500', color: colors.label },
  categoryNameSelected: { color: colors.onTint },
  dateInput: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.tertiarySystemFill,
    padding: 12,
    fontSize: 16,
    color: colors.label,
  },
  noteInput: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.tertiarySystemFill,
    padding: 12,
    fontSize: 16,
    color: colors.label,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: colors.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: colors.onTint, fontSize: 17, fontWeight: '600' },
  deleteButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: colors.destructive, fontSize: 16, fontWeight: '600' },
});
