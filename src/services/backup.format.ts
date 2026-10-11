// Pure backup format helpers. No native modules so they run under jest.

export const BACKUP_FORMAT = 'expense-backup';

export type BackupCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

export type BackupExpense = {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  expense_date: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BackupSetting = { key: string; value: string };

export type BackupQuickLogPreset = {
  id: string;
  category_id: string;
  amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** First schema version whose backups carry quick_log_presets. */
export const QUICK_LOG_PRESETS_SCHEMA_VERSION = 2;

export type BackupData = {
  categories: BackupCategory[];
  expenses: BackupExpense[];
  settings: BackupSetting[];
  quick_log_presets: BackupQuickLogPreset[];
};

export type Backup = {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  appRelease: string;
  data: BackupData;
};

export type BackupErrorCode =
  'invalid_json' | 'wrong_format' | 'newer_schema' | 'invalid_structure';

export type BackupError = { code: BackupErrorCode; message: string };

export type ParseBackupResult = { ok: true; backup: Backup } | { ok: false; error: BackupError };

export function buildBackup(input: {
  schemaVersion: number;
  appRelease: string;
  exportedAt: Date;
  data: BackupData;
}): Backup {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: input.schemaVersion,
    exportedAt: input.exportedAt.toISOString(),
    appRelease: input.appRelease,
    data: input.data,
  };
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/** File name based on the local calendar day, e.g. expense-backup-2026-09-05.json. */
export function backupFileName(date: Date, prefix = 'expense-backup'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${prefix}-${day}.json`;
}

type Shape = Record<string, 'string' | 'number' | 'nullableString'>;

const CATEGORY_SHAPE: Shape = {
  id: 'string',
  name: 'string',
  icon: 'string',
  color: 'string',
  sort_order: 'number',
  is_archived: 'number',
  created_at: 'string',
  updated_at: 'string',
};

const EXPENSE_SHAPE: Shape = {
  id: 'string',
  amount: 'number',
  category_id: 'string',
  note: 'nullableString',
  expense_date: 'string',
  deleted_at: 'nullableString',
  created_at: 'string',
  updated_at: 'string',
};

const SETTING_SHAPE: Shape = { key: 'string', value: 'string' };

const QUICK_LOG_PRESET_SHAPE: Shape = {
  id: 'string',
  category_id: 'string',
  amount: 'number',
  sort_order: 'number',
  created_at: 'string',
  updated_at: 'string',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesShape(value: unknown, shape: Shape): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(shape).every(([key, kind]) => {
    const field = value[key];
    if (kind === 'number') return typeof field === 'number' && Number.isInteger(field);
    if (kind === 'nullableString') return field === null || typeof field === 'string';
    return typeof field === 'string';
  });
}

function pick<T>(value: Record<string, unknown>, shape: Shape): T {
  return Object.fromEntries(Object.keys(shape).map((key) => [key, value[key]])) as T;
}

function readList<T>(value: unknown, shape: Shape): T[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => matchesShape(item, shape))) return null;
  return value.map((item) => pick<T>(item as Record<string, unknown>, shape));
}

const fail = (code: BackupErrorCode, message: string): ParseBackupResult => ({
  ok: false,
  error: { code, message },
});

const STRUCTURE_ERROR = 'El archivo está incompleto o dañado.';

/** Validates format, schema version and structure. Never trusts the file. */
export function parseBackup(json: string, currentSchemaVersion: number): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return fail('invalid_json', 'El archivo no es un JSON válido.');
  }

  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT) {
    return fail('wrong_format', 'El archivo no es un backup de Expense.');
  }

  const { schemaVersion } = raw;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return fail('invalid_structure', STRUCTURE_ERROR);
  }
  if (schemaVersion > currentSchemaVersion) {
    return fail(
      'newer_schema',
      'Este backup es de una versión más nueva de la app. Actualizá la app antes de restaurarlo.'
    );
  }

  if (typeof raw.exportedAt !== 'string' || !isRecord(raw.data)) {
    return fail('invalid_structure', STRUCTURE_ERROR);
  }

  const categories = readList<BackupCategory>(raw.data.categories, CATEGORY_SHAPE);
  const expenses = readList<BackupExpense>(raw.data.expenses, EXPENSE_SHAPE);
  const settings = readList<BackupSetting>(raw.data.settings, SETTING_SHAPE);
  // Backups older than schema 2 predate the quick log presets table.
  const quickLogPresets =
    schemaVersion < QUICK_LOG_PRESETS_SCHEMA_VERSION
      ? []
      : readList<BackupQuickLogPreset>(raw.data.quick_log_presets, QUICK_LOG_PRESET_SHAPE);
  if (!categories || !expenses || !settings || !quickLogPresets) {
    return fail('invalid_structure', STRUCTURE_ERROR);
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  if (
    !expenses.every((expense) => categoryIds.has(expense.category_id)) ||
    !quickLogPresets.every((preset) => categoryIds.has(preset.category_id))
  ) {
    return fail('invalid_structure', STRUCTURE_ERROR);
  }

  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      schemaVersion,
      exportedAt: raw.exportedAt,
      appRelease: typeof raw.appRelease === 'string' ? raw.appRelease : '',
      data: { categories, expenses, settings, quick_log_presets: quickLogPresets },
    },
  };
}
