jest.mock('expo-sqlite', () => require('./mocks/expo-sqlite'));
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

import {
  createCategory,
  deleteCategory,
  listActiveCategories,
} from '@/db/categories.repository';
import {
  createExpense,
  getMonthlyTotal,
  listExpenses,
  listTrashedExpenses,
  restoreExpense,
  trashExpense,
} from '@/db/expenses.repository';

describe('expenses + categories repositories', () => {
  it('envia un gasto a la papelera y lo excluye del historial y del total mensual', async () => {
    const categories = await listActiveCategories();
    const comida = categories.find((c) => c.name === 'Comida')!;

    const expense = await createExpense({
      amount: 12500,
      categoryId: comida.id,
      expenseDate: '2026-09-05T10:00:00.000Z',
    });

    expect((await listExpenses()).some((e) => e.id === expense.id)).toBe(true);
    expect((await getMonthlyTotal('2026-09')).total).toBeGreaterThanOrEqual(12500);

    await trashExpense(expense.id);

    expect((await listExpenses()).some((e) => e.id === expense.id)).toBe(false);
    expect((await listTrashedExpenses()).some((e) => e.id === expense.id)).toBe(true);

    await restoreExpense(expense.id);
    expect((await listExpenses()).some((e) => e.id === expense.id)).toBe(true);
  });

  it('reasigna los gastos (incluida la papelera) al eliminar una categoria', async () => {
    const source = await createCategory({ name: `Temp-${Date.now()}`, icon: '🎯', color: '#000' });
    const target = await listActiveCategories().then((cats) => cats[0]!);

    const active = await createExpense({ amount: 1000, categoryId: source.id });
    const trashed = await createExpense({ amount: 2000, categoryId: source.id });
    await trashExpense(trashed.id);

    await deleteCategory(source.id, target.id);

    const activeAfter = (await listExpenses()).find((e) => e.id === active.id);
    const trashedAfter = (await listTrashedExpenses()).find((e) => e.id === trashed.id);

    expect(activeAfter?.categoryId).toBe(target.id);
    expect(trashedAfter?.categoryId).toBe(target.id);
    expect((await listActiveCategories()).some((c) => c.id === source.id)).toBe(false);
  });

  it('rechaza importes invalidos', async () => {
    const [comida] = await listActiveCategories();
    await expect(createExpense({ amount: 0, categoryId: comida!.id })).rejects.toThrow();
    await expect(createExpense({ amount: -5, categoryId: comida!.id })).rejects.toThrow();
  });
});
