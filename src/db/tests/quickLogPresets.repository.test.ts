jest.mock('expo-sqlite', () => require('../../../tests/mocks/expo-sqlite'));
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

import { deleteCategory, listActiveCategories } from '@/db/categories.repository';
import { listExpenses } from '@/db/expenses.repository';
import {
  applyIngestion,
  createQuickLogPreset,
  deleteQuickLogPreset,
  listIngestedIds,
  listQuickLogPresets,
  moveQuickLogPreset,
} from '@/db/quickLogPresets.repository';

describe('quick log presets repository', () => {
  it('creates presets in order and caps them at 4', async () => {
    const [food, market] = await listActiveCategories();
    if (!food || !market) throw new Error('seed categories missing');
    await createQuickLogPreset({ categoryId: food.id, amount: 1500 });
    await createQuickLogPreset({ categoryId: market.id, amount: 800 });
    await createQuickLogPreset({ categoryId: food.id, amount: 300 });
    await createQuickLogPreset({ categoryId: food.id, amount: 200 });
    await expect(createQuickLogPreset({ categoryId: food.id, amount: 100 })).rejects.toThrow();

    const presets = await listQuickLogPresets();
    expect(presets.map((p) => p.amount)).toEqual([1500, 800, 300, 200]);
    expect(presets[0]?.categoryName).toBe(food.name);
  });

  it('reorders and deletes presets', async () => {
    const before = await listQuickLogPresets();
    await moveQuickLogPreset(before[1]!.id, 'up');
    expect((await listQuickLogPresets()).map((p) => p.amount)).toEqual([800, 1500, 300, 200]);
    await moveQuickLogPreset(before[1]!.id, 'up');
    expect((await listQuickLogPresets()).map((p) => p.amount)).toEqual([800, 1500, 300, 200]);

    await deleteQuickLogPreset(before[3]!.id);
    expect(await listQuickLogPresets()).toHaveLength(3);
  });

  it('ingests expenses and records ids idempotently', async () => {
    const [food] = await listActiveCategories();
    const expenseDate = '2026-10-10T12:00:00.000Z';
    await applyIngestion([{ entryId: 'w1', categoryId: food!.id, amount: 999, expenseDate }], ['w1', 'w2']);
    await applyIngestion([], ['w1']);

    expect(await listIngestedIds(['w1', 'w2', 'w3'])).toEqual(new Set(['w1', 'w2']));
    const inserted = (await listExpenses()).filter((e) => e.amount === 999);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]?.expenseDate).toBe(expenseDate);
  });

  it('drops presets of a deleted category', async () => {
    const categories = await listActiveCategories();
    const market = categories[1]!;
    await deleteCategory(market.id, categories[0]!.id);
    expect((await listQuickLogPresets()).some((p) => p.categoryId === market.id)).toBe(false);
  });
});
