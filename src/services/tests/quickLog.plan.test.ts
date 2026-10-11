import {
  type PendingEntry,
  type PresetForIngestion,
  buildPresetLabel,
  collectPending,
  planIngestion,
  removeIngested,
} from '../quickLog.plan';

const presets = new Map<string, PresetForIngestion>([
  ['p1', { id: 'p1', categoryId: 'c1', amount: 1500 }],
  ['p2', { id: 'p2', categoryId: 'c2', amount: 800 }],
]);

const at = Date.UTC(2026, 9, 10, 12, 0, 0);

describe('planIngestion', () => {
  it('creates one expense per unknown pending entry, using the preset and the tap time', () => {
    const pending: PendingEntry[] = [
      { id: 'e1', presetId: 'p1', at },
      { id: 'e2', presetId: 'p2', at: at + 1000 },
    ];
    const plan = planIngestion(pending, new Set(), presets);
    expect(plan.expenses).toEqual([
      { entryId: 'e1', categoryId: 'c1', amount: 1500, expenseDate: new Date(at).toISOString() },
      { entryId: 'e2', categoryId: 'c2', amount: 800, expenseDate: new Date(at + 1000).toISOString() },
    ]);
    expect(plan.ingestedIds).toEqual(['e1', 'e2']);
  });

  it('skips entries that were already ingested', () => {
    const plan = planIngestion([{ id: 'e1', presetId: 'p1', at }], new Set(['e1']), presets);
    expect(plan.expenses).toEqual([]);
    expect(plan.ingestedIds).toEqual(['e1']);
  });

  it('records entries of a deleted preset as ingested without creating an expense', () => {
    const plan = planIngestion([{ id: 'e1', presetId: 'gone', at }], new Set(), presets);
    expect(plan.expenses).toEqual([]);
    expect(plan.ingestedIds).toEqual(['e1']);
    expect(plan.newlyIngestedIds).toEqual(['e1']);
  });

  it('dedupes repeated ids inside one batch', () => {
    const entry = { id: 'e1', presetId: 'p1', at };
    const plan = planIngestion([entry, entry], new Set(), presets);
    expect(plan.expenses).toHaveLength(1);
    expect(plan.ingestedIds).toEqual(['e1']);
  });

  it('ignores malformed entries', () => {
    const plan = planIngestion(
      [{ id: 'e1', presetId: 'p1', at: Number.NaN }, { id: '', presetId: 'p1', at }] as PendingEntry[],
      new Set(),
      presets
    );
    expect(plan.expenses).toEqual([]);
    expect(plan.ingestedIds).toEqual([]);
  });
});

describe('removeIngested', () => {
  it('keeps entries added after the read and drops only ingested ids', () => {
    const fresh: PendingEntry[] = [
      { id: 'e1', presetId: 'p1', at },
      { id: 'e3', presetId: 'p2', at },
    ];
    expect(removeIngested(fresh, ['e1', 'e2'])).toEqual([{ id: 'e3', presetId: 'p2', at }]);
  });
});

describe('buildPresetLabel', () => {
  it('joins icon, name and formatted amount', () => {
    const label = buildPresetLabel({ icon: '🍔', name: 'Comida' }, 1500);
    expect(label.startsWith('🍔 Comida ')).toBe(true);
    expect(label).toMatch(/1\.500/);
  });
});

describe('collectPending', () => {
  it('merges pending entries across timeline entries and returns the newest props', () => {
    const a = { id: 'e1', presetId: 'p1', at };
    const b = { id: 'e2', presetId: 'p2', at };
    const result = collectPending([
      { date: new Date(1000), props: { presets: [], pending: [a], lastLogged: 'old' } },
      { date: new Date(2000), props: { presets: [], pending: [a, b], lastLogged: 'new' } },
    ]);
    expect(result.pending).toEqual([a, b]);
    expect(result.latest?.lastLogged).toBe('new');
  });

  it('handles an empty timeline', () => {
    expect(collectPending([])).toEqual({ pending: [], latest: undefined });
  });
});
