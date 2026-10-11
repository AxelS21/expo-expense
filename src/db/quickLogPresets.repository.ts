import { randomUUID } from 'expo-crypto';

import type { PlannedExpense } from '@/services/quickLog.plan';
import { MAX_QUICK_LOG_PRESETS } from '@/services/quickLog.plan';
import { type Amount, isValidAmount } from '@/utils/money';

import { getDatabase } from './index';

export interface QuickLogPreset {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: Amount;
  sortOrder: number;
}

interface PresetRow {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: number;
  sort_order: number;
}

function fromRow(row: PresetRow): QuickLogPreset {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    amount: row.amount,
    sortOrder: row.sort_order,
  };
}

export async function listQuickLogPresets(): Promise<QuickLogPreset[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PresetRow>(
    `SELECT p.id, p.category_id, c.name AS category_name, c.icon AS category_icon, p.amount, p.sort_order
     FROM quick_log_presets p
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.sort_order ASC, p.created_at ASC`
  );
  return rows.map(fromRow);
}

export async function createQuickLogPreset(input: { categoryId: string; amount: Amount }): Promise<void> {
  if (!isValidAmount(input.amount)) {
    throw new Error('El importe debe ser un entero positivo.');
  }
  const db = await getDatabase();
  const { count, maxOrder } = (await db.getFirstAsync<{ count: number; maxOrder: number | null }>(
    'SELECT COUNT(*) AS count, MAX(sort_order) AS maxOrder FROM quick_log_presets'
  )) ?? { count: 0, maxOrder: null };
  if (count >= MAX_QUICK_LOG_PRESETS) {
    throw new Error(`Podés tener hasta ${MAX_QUICK_LOG_PRESETS} accesos rápidos.`);
  }

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO quick_log_presets (id, category_id, amount, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), input.categoryId, input.amount, (maxOrder ?? -1) + 1, now, now]
  );
}

export async function deleteQuickLogPreset(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM quick_log_presets WHERE id = ?', [id]);
}

/** Swaps the preset with its neighbour; renumbers sort_order so gaps never accumulate. */
export async function moveQuickLogPreset(id: string, direction: 'up' | 'down'): Promise<void> {
  const ordered = await listQuickLogPresets();
  const index = ordered.findIndex((preset) => preset.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ordered.length) return;

  const next = [...ordered];
  const [moved] = next.splice(index, 1);
  if (!moved) return;
  next.splice(target, 0, moved);

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const [order, preset] of next.entries()) {
      await db.runAsync('UPDATE quick_log_presets SET sort_order = ?, updated_at = ? WHERE id = ?', [
        order,
        now,
        preset.id,
      ]);
    }
  });
}

/** Presets keyed by id, including the raw category id and amount used at ingestion time. */
export async function getQuickLogPresetsById(): Promise<Map<string, { id: string; categoryId: string; amount: Amount }>> {
  const presets = await listQuickLogPresets();
  return new Map(presets.map((p) => [p.id, { id: p.id, categoryId: p.categoryId, amount: p.amount }]));
}

export async function listIngestedIds(ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM widget_ingested WHERE id IN (${placeholders})`,
    [...ids]
  );
  return new Set(rows.map((row) => row.id));
}

/** Inserts the planned expenses and records every new entry id, all in one transaction. */
export async function applyIngestion(
  expenses: readonly PlannedExpense[],
  newlyIngestedIds: readonly string[]
): Promise<void> {
  if (newlyIngestedIds.length === 0) return;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const expense of expenses) {
      await db.runAsync(
        `INSERT INTO expenses (id, amount, category_id, note, expense_date, deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, NULL, ?, ?)`,
        [randomUUID(), expense.amount, expense.categoryId, expense.expenseDate, now, now]
      );
    }
    for (const id of newlyIngestedIds) {
      await db.runAsync('INSERT OR IGNORE INTO widget_ingested (id, ingested_at) VALUES (?, ?)', [id, now]);
    }
  });
}
