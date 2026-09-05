import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { migrations } from './migrations';

const DB_NAME = 'expense.db';

const DEFAULT_CATEGORIES = [
  { name: 'Comida', icon: '🍔', color: '#FF9F0A' },
  { name: 'Supermercado', icon: '🛒', color: '#30D158' },
  { name: 'Transporte', icon: '🚗', color: '#0A84FF' },
  { name: 'Otros', icon: '•••', color: '#8E8E93' },
] as const;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const { user_version: currentVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )) ?? { user_version: 0 };

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const { count } = (await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  )) ?? { count: 0 };
  if (count > 0) return;

  const now = new Date().toISOString();
  for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, sort_order, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [randomUUID(), category.name, category.icon, category.color, index, now, now]
    );
  }
}

/** Elimina definitivamente los gastos en papelera con mas de 2 dias. Seguro de correr al iniciar. */
async function purgeExpiredTrash(db: SQLite.SQLiteDatabase): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync('DELETE FROM expenses WHERE deleted_at IS NOT NULL AND deleted_at < ?', [
    cutoff,
  ]);
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  await seedDefaultCategories(db);
  await purgeExpiredTrash(db);
  return db;
}

/** Fuente unica de verdad de la conexion SQLite. Idempotente: siempre la misma promesa. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}
