import { randomUUID } from 'expo-crypto';
import { getDatabase } from './index';
import { isValidAmount, type Amount } from '@/utils/money';
import type { Expense } from '@/types/models';
import { localMonthRange } from '@/utils/date';

interface ExpenseRow {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  expense_date: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id,
    note: row.note,
    expenseDate: row.expense_date,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateExpenseInput {
  amount: Amount;
  categoryId: string;
  note?: string | null;
  expenseDate?: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  if (!isValidAmount(input.amount)) {
    throw new Error('El importe debe ser un entero positivo.');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = randomUUID();
  const expenseDate = input.expenseDate ?? now;
  const note = input.note?.trim() || null;

  await db.runAsync(
    `INSERT INTO expenses (id, amount, category_id, note, expense_date, deleted_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    [id, input.amount, input.categoryId, note, expenseDate, now, now]
  );

  const created = await getExpenseById(id);
  if (!created) throw new Error('No se pudo crear el gasto.');
  return created;
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExpenseRow>('SELECT * FROM expenses WHERE id = ?', [id]);
  return row ? fromRow(row) : null;
}

export interface UpdateExpenseInput {
  amount?: Amount;
  categoryId?: string;
  note?: string | null;
  expenseDate?: string;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
  const current = await getExpenseById(id);
  if (!current) throw new Error('Gasto no encontrado.');
  if (input.amount !== undefined && !isValidAmount(input.amount)) {
    throw new Error('El importe debe ser un entero positivo.');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE expenses SET amount = ?, category_id = ?, note = ?, expense_date = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.amount ?? current.amount,
      input.categoryId ?? current.categoryId,
      input.note !== undefined ? input.note?.trim() || null : current.note,
      input.expenseDate ?? current.expenseDate,
      now,
      id,
    ]
  );

  const updated = await getExpenseById(id);
  if (!updated) throw new Error('No se pudo actualizar el gasto.');
  return updated;
}

/** Envia el gasto a la papelera. No lo borra: queda recuperable por 2 dias. */
export async function trashExpense(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}

export async function restoreExpense(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE expenses SET deleted_at = NULL, updated_at = ? WHERE id = ?', [now, id]);
}

export interface ListExpensesFilter {
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export async function listExpenses(filter: ListExpensesFilter = {}): Promise<Expense[]> {
  const db = await getDatabase();
  const conditions = ['deleted_at IS NULL'];
  const params: (string | number)[] = [];

  if (filter.categoryId) {
    conditions.push('category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.fromDate) {
    conditions.push('expense_date >= ?');
    params.push(filter.fromDate);
  }
  if (filter.toDate) {
    conditions.push('expense_date <= ?');
    params.push(filter.toDate);
  }

  const limitClause = filter.limit ? ' LIMIT ?' : '';
  if (filter.limit) params.push(filter.limit);

  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT * FROM expenses WHERE ${conditions.join(' AND ')} ORDER BY expense_date DESC, created_at DESC${limitClause}`,
    params
  );
  return rows.map(fromRow);
}

export async function listTrashedExpenses(): Promise<Expense[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );
  return rows.map(fromRow);
}

export async function getMonthlyTotal(yearMonth: string): Promise<{ total: number; count: number }> {
  const db = await getDatabase();
  const { startIso, endIso } = localMonthRange(yearMonth);
  const row = await db.getFirstAsync<{ total: number | null; count: number }>(
    `SELECT SUM(amount) as total, COUNT(*) as count FROM expenses
     WHERE deleted_at IS NULL AND expense_date >= ? AND expense_date < ?`,
    [startIso, endIso]
  );
  return { total: row?.total ?? 0, count: row?.count ?? 0 };
}

export async function getTotalsByCategory(
  yearMonth: string
): Promise<{ categoryId: string; total: number }[]> {
  const db = await getDatabase();
  const { startIso, endIso } = localMonthRange(yearMonth);
  const rows = await db.getAllAsync<{ category_id: string; total: number }>(
    `SELECT category_id, SUM(amount) as total FROM expenses
     WHERE deleted_at IS NULL AND expense_date >= ? AND expense_date < ?
     GROUP BY category_id`,
    [startIso, endIso]
  );
  return rows.map((row) => ({ categoryId: row.category_id, total: row.total }));
}
