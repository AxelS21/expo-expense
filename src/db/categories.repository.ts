import { randomUUID } from 'expo-crypto';
import { getDatabase } from './index';
import type { Category } from '@/types/models';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function fromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function listActiveCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE is_archived = 0 ORDER BY sort_order ASC'
  );
  return rows.map(fromRow);
}

export async function listAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY sort_order ASC');
  return rows.map(fromRow);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
  return row ? fromRow(row) : null;
}

export async function findCategoryByName(name: string): Promise<Category | null> {
  const db = await getDatabase();
  const target = normalizeName(name);
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories');
  const match = rows.find((row) => normalizeName(row.name) === target);
  return match ? fromRow(match) : null;
}

/** Palette cycled for categories created in the app, so screens never hardcode colors. */
const NEW_CATEGORY_COLORS = ['#FF9F0A', '#30D158', '#0A84FF', '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A'];

export async function createCategory(input: {
  name: string;
  icon: string;
  color?: string;
}): Promise<Category> {
  const existing = await findCategoryByName(input.name);
  if (existing) {
    throw new Error('Ya existe una categoria con ese nombre.');
  }

  const db = await getDatabase();
  const { maxOrder } = (await db.getFirstAsync<{ maxOrder: number | null }>(
    'SELECT MAX(sort_order) as maxOrder FROM categories'
  )) ?? { maxOrder: null };

  const nextOrder = (maxOrder ?? -1) + 1;
  const color = input.color ?? NEW_CATEGORY_COLORS[nextOrder % NEW_CATEGORY_COLORS.length] ?? '#0A84FF';
  const now = new Date().toISOString();
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, sort_order, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, input.name.trim(), input.icon, color, nextOrder, now, now]
  );

  const created = await getCategoryById(id);
  if (!created) throw new Error('No se pudo crear la categoria.');
  return created;
}

export async function updateCategory(
  id: string,
  input: { name?: string; icon?: string; color?: string }
): Promise<Category> {
  const current = await getCategoryById(id);
  if (!current) throw new Error('Categoria no encontrada.');

  if (input.name && normalizeName(input.name) !== normalizeName(current.name)) {
    const clash = await findCategoryByName(input.name);
    if (clash) throw new Error('Ya existe una categoria con ese nombre.');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?',
    [input.name?.trim() ?? current.name, input.icon ?? current.icon, input.color ?? current.color, now, id]
  );

  const updated = await getCategoryById(id);
  if (!updated) throw new Error('No se pudo actualizar la categoria.');
  return updated;
}

export async function setCategoryArchived(id: string, isArchived: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE categories SET is_archived = ?, updated_at = ? WHERE id = ?', [
    isArchived ? 1 : 0,
    now,
    id,
  ]);
}

/** Reasigna todos los gastos (incluida la papelera) de una categoria a otra y elimina la original. */
export async function deleteCategory(id: string, reassignToId: string): Promise<void> {
  if (id === reassignToId) {
    throw new Error('No se puede reasignar una categoria a si misma.');
  }
  const target = await getCategoryById(reassignToId);
  if (!target || target.isArchived) {
    throw new Error('La categoria de destino debe existir y estar activa.');
  }

  const activeCount = (await listActiveCategories()).length;
  const beingDeleted = await getCategoryById(id);
  if (!beingDeleted) throw new Error('Categoria no encontrada.');
  if (!beingDeleted.isArchived && activeCount <= 1) {
    throw new Error('Debe existir al menos una categoria activa.');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE expenses SET category_id = ?, updated_at = ? WHERE category_id = ?', [
      reassignToId,
      now,
      id,
    ]);
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  });
}
