// Pure quick log helpers. No native modules so they run under jest.

import { type Amount, formatAmount } from '@/utils/money';

/** A tap recorded by the widget extension; it lives in the widget timeline until ingested. */
export type PendingEntry = { id: string; presetId: string; at: number };

/** Preset as shown by the widget. The label is built by the app; the widget only renders it. */
export type WidgetPreset = { id: string; label: string; icon: string; amount: number };

export type QuickLogWidgetProps = {
  presets: WidgetPreset[];
  pending: PendingEntry[];
  lastLogged?: string;
};

export type PresetForIngestion = { id: string; categoryId: string; amount: Amount };

export type PlannedExpense = {
  entryId: string;
  categoryId: string;
  amount: Amount;
  expenseDate: string;
};

export type IngestionPlan = {
  /** Expenses to insert, one per entry that was not ingested before. */
  expenses: PlannedExpense[];
  /** Entries never seen before that must be recorded in widget_ingested. */
  newlyIngestedIds: string[];
  /** Every valid entry id that is safe to drop from the widget queue. */
  ingestedIds: string[];
};

function isValidEntry(entry: unknown): entry is PendingEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const { id, presetId, at } = entry as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    typeof presetId === 'string' &&
    typeof at === 'number' &&
    Number.isFinite(at)
  );
}

/**
 * Decides what to insert for the widget queue. Idempotent: ids already ingested are only
 * dropped from the queue. Entries whose preset was deleted are recorded but create nothing.
 */
export function planIngestion(
  pending: readonly unknown[],
  alreadyIngestedIds: ReadonlySet<string>,
  presetsById: ReadonlyMap<string, PresetForIngestion>
): IngestionPlan {
  const expenses: PlannedExpense[] = [];
  const newlyIngestedIds: string[] = [];
  const ingestedIds: string[] = [];
  const seen = new Set<string>();

  for (const entry of pending) {
    if (!isValidEntry(entry) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    ingestedIds.push(entry.id);
    if (alreadyIngestedIds.has(entry.id)) continue;

    newlyIngestedIds.push(entry.id);
    const preset = presetsById.get(entry.presetId);
    if (!preset) continue;
    expenses.push({
      entryId: entry.id,
      categoryId: preset.categoryId,
      amount: preset.amount,
      expenseDate: new Date(entry.at).toISOString(),
    });
  }

  return { expenses, newlyIngestedIds, ingestedIds };
}

/** Removes only the ingested ids, so taps made after the first read stay queued. */
export function removeIngested(
  pending: readonly PendingEntry[],
  ingestedIds: readonly string[]
): PendingEntry[] {
  const drop = new Set(ingestedIds);
  return pending.filter((entry) => !drop.has(entry.id));
}

export function buildPresetLabel(category: { icon: string; name: string }, amount: Amount): string {
  return `${category.icon} ${category.name} ${formatAmount(amount)}`;
}

/** The widget shows at most this many presets (systemMedium). */
export const MAX_QUICK_LOG_PRESETS = 4;

/**
 * Collects the queued taps from every timeline entry (the widget writes into the entry it
 * displays). Returns the props of the newest entry too, so callers keep `lastLogged`.
 */
export function collectPending(
  entries: readonly { date: Date | string | number; props: Partial<QuickLogWidgetProps> }[]
): { pending: PendingEntry[]; latest: Partial<QuickLogWidgetProps> | undefined } {
  const pending: PendingEntry[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const item of entry.props?.pending ?? []) {
      if (!isValidEntry(item) || seen.has(item.id)) continue;
      seen.add(item.id);
      pending.push(item);
    }
  }
  const latest = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  return { pending, latest: latest?.props };
}
