import type { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount INTEGER NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      note TEXT,
      expense_date TEXT NOT NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
    CREATE INDEX idx_expenses_category_id ON expenses(category_id);
    CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);

    CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}
