import {
  BACKUP_FORMAT,
  type BackupData,
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
} from '../backup.format';

const data: BackupData = {
  categories: [
    {
      id: 'c1',
      name: 'Comida',
      icon: '🍔',
      color: '#FF9F0A',
      sort_order: 0,
      is_archived: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  expenses: [
    {
      id: 'e1',
      amount: 1500,
      category_id: 'c1',
      note: null,
      expense_date: '2026-01-02T10:00:00.000Z',
      deleted_at: '2026-01-03T10:00:00.000Z',
      created_at: '2026-01-02T10:00:00.000Z',
      updated_at: '2026-01-02T10:00:00.000Z',
    },
  ],
  settings: [{ key: 'theme', value: 'dark' }],
  quick_log_presets: [],
};

function build(schemaVersion = 1) {
  return buildBackup({
    schemaVersion,
    appRelease: '1.0.010',
    exportedAt: new Date('2026-01-05T12:00:00.000Z'),
    data,
  });
}

describe('parseBackup', () => {
  it('round-trips a serialized backup', () => {
    const result = parseBackup(serializeBackup(build()), 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.format).toBe(BACKUP_FORMAT);
      expect(result.backup.data).toEqual(data);
    }
  });

  it('accepts an older schema version', () => {
    expect(parseBackup(serializeBackup(build(1)), 2).ok).toBe(true);
  });

  it('rejects invalid JSON', () => {
    const result = parseBackup('{nope', 1);
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'invalid_json' },
    });
  });

  it('rejects the wrong format', () => {
    const json = JSON.stringify({ ...build(), format: 'other' });
    expect(parseBackup(json, 1)).toMatchObject({
      ok: false,
      error: { code: 'wrong_format' },
    });
  });

  it('rejects a newer schema version', () => {
    const result = parseBackup(serializeBackup(build(2)), 1);
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'newer_schema' },
    });
  });

  it('rejects missing fields', () => {
    const backup = build();
    const broken = {
      ...backup,
      data: {
        ...backup.data,
        expenses: [{ ...data.expenses[0], amount: undefined }],
      },
    };
    const result = parseBackup(JSON.stringify(broken), 1);
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'invalid_structure' },
    });
  });

  it('rejects a missing data section', () => {
    const { data: _omit, ...rest } = build();
    expect(parseBackup(JSON.stringify(rest), 1)).toMatchObject({
      ok: false,
      error: { code: 'invalid_structure' },
    });
  });

  it('rejects expenses pointing to unknown categories', () => {
    const backup = build();
    const broken = { ...backup, data: { ...backup.data, categories: [] } };
    expect(parseBackup(JSON.stringify(broken), 1)).toMatchObject({
      ok: false,
      error: { code: 'invalid_structure' },
    });
  });
});

describe('parseBackup quick log presets', () => {
  const preset = {
    id: 'p1',
    category_id: 'c1',
    amount: 1500,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  it('reads a schemaVersion 1 backup without presets as an empty list', () => {
    const { quick_log_presets: _omit, ...v1Data } = data;
    const json = JSON.stringify({ ...build(1), data: v1Data });
    const result = parseBackup(json, 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backup.data.quick_log_presets).toEqual([]);
  });

  it('round-trips presets in a schemaVersion 2 backup', () => {
    const backup = { ...build(2), data: { ...data, quick_log_presets: [preset] } };
    const result = parseBackup(serializeBackup(backup), 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backup.data.quick_log_presets).toEqual([preset]);
  });

  it('rejects a schemaVersion 2 backup without the presets list', () => {
    const { quick_log_presets: _omit, ...v2Data } = data;
    const json = JSON.stringify({ ...build(2), data: v2Data });
    expect(parseBackup(json, 2)).toMatchObject({ ok: false, error: { code: 'invalid_structure' } });
  });

  it('rejects presets pointing to unknown categories', () => {
    const backup = { ...build(2), data: { ...data, quick_log_presets: [{ ...preset, category_id: 'x' }] } };
    expect(parseBackup(serializeBackup(backup), 2)).toMatchObject({
      ok: false,
      error: { code: 'invalid_structure' },
    });
  });
});

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(new Date(2026, 8, 5, 23, 30))).toBe('expense-backup-2026-09-05.json');
  });
});
