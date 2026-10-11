import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Presets shown by the quick log widget, plus the ids of widget taps already turned into
 * expenses. widget_ingested makes ingestion idempotent if the app dies before it can
 * remove the taps from the widget queue.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE quick_log_presets (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE widget_ingested (
      id TEXT PRIMARY KEY NOT NULL,
      ingested_at TEXT NOT NULL
    );
  `);
}
