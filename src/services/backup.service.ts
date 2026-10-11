import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { RELEASE_LABEL } from '@/constants/release';
import { getDatabase } from '@/db';
import { migrations } from '@/db/migrations';

import {
  type Backup,
  type BackupCategory,
  type BackupData,
  type BackupError,
  type BackupExpense,
  type BackupQuickLogPreset,
  type BackupSetting,
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
} from './backup.format';

/** Highest schema version this build of the app understands. */
export const APP_SCHEMA_VERSION = Math.max(...migrations.map((migration) => migration.version));

async function readAllData(): Promise<{
  schemaVersion: number;
  data: BackupData;
}> {
  const db = await getDatabase();
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const categories = await db.getAllAsync<BackupCategory>(
    `SELECT id, name, icon, color, sort_order, is_archived, created_at, updated_at
     FROM categories ORDER BY sort_order, created_at`
  );
  const expenses = await db.getAllAsync<BackupExpense>(
    `SELECT id, amount, category_id, note, expense_date, deleted_at, created_at, updated_at
     FROM expenses ORDER BY expense_date`
  );
  const settings = await db.getAllAsync<BackupSetting>('SELECT key, value FROM settings');
  const quickLogPresets = await db.getAllAsync<BackupQuickLogPreset>(
    `SELECT id, category_id, amount, sort_order, created_at, updated_at
     FROM quick_log_presets ORDER BY sort_order`
  );
  return {
    schemaVersion: version?.user_version ?? APP_SCHEMA_VERSION,
    data: { categories, expenses, settings, quick_log_presets: quickLogPresets },
  };
}

async function createBackupFile(directory: typeof Paths.cache, prefix?: string): Promise<File> {
  const now = new Date();
  const { schemaVersion, data } = await readAllData();
  const backup = buildBackup({
    schemaVersion,
    appRelease: RELEASE_LABEL,
    exportedAt: now,
    data,
  });
  const file = new File(directory, backupFileName(now, prefix));
  file.create({ overwrite: true });
  file.write(serializeBackup(backup));
  return file;
}

/** Writes the backup to the cache directory and opens the share sheet. */
export async function exportBackup(): Promise<void> {
  const file = await createBackupFile(Paths.cache);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Exportar backup',
  });
}

export type RestoreResult =
  | { status: 'canceled' }
  | { status: 'invalid'; error: BackupError }
  | { status: 'ready'; backup: Backup };

/** Lets the user pick a backup file and validates it. Does not touch the database. */
export async function pickBackup(): Promise<RestoreResult> {
  const picked = await getDocumentAsync({
    type: ['application/json', 'public.json'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled) return { status: 'canceled' };

  const asset = picked.assets[0];
  if (!asset) return { status: 'canceled' };
  const text = await new File(asset.uri).text();
  const result = parseBackup(text, APP_SCHEMA_VERSION);
  return result.ok
    ? { status: 'ready', backup: result.backup }
    : { status: 'invalid', error: result.error };
}

export type RestoreSummary = {
  expenses: number;
  categories: number;
  preventiveBackupUri: string;
};

/**
 * Replaces ALL local data with the backup contents. Never merges.
 * A preventive backup of the current data is saved in the document directory first.
 */
export async function restoreBackup(backup: Backup): Promise<RestoreSummary> {
  const preventive = await createBackupFile(Paths.document, 'expense-pre-restore');
  const db = await getDatabase();
  const { categories, expenses, settings, quick_log_presets: quickLogPresets } = backup.data;

  await db.withExclusiveTransactionAsync(async (tx) => {
    // widget_ingested is kept on purpose: it only prevents re-inserting widget taps.
    await tx.runAsync('DELETE FROM quick_log_presets');
    await tx.runAsync('DELETE FROM expenses');
    await tx.runAsync('DELETE FROM categories');
    await tx.runAsync('DELETE FROM settings');

    for (const c of categories) {
      await tx.runAsync(
        `INSERT INTO categories (id, name, icon, color, sort_order, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.icon, c.color, c.sort_order, c.is_archived, c.created_at, c.updated_at]
      );
    }
    for (const e of expenses) {
      await tx.runAsync(
        `INSERT INTO expenses (id, amount, category_id, note, expense_date, deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.amount,
          e.category_id,
          e.note,
          e.expense_date,
          e.deleted_at,
          e.created_at,
          e.updated_at,
        ]
      );
    }
    for (const s of settings) {
      await tx.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
    for (const p of quickLogPresets) {
      await tx.runAsync(
        `INSERT INTO quick_log_presets (id, category_id, amount, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.category_id, p.amount, p.sort_order, p.created_at, p.updated_at]
      );
    }
  });

  return {
    expenses: expenses.length,
    categories: categories.length,
    preventiveBackupUri: preventive.uri,
  };
}
