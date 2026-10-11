import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import {
  applyIngestion,
  listIngestedIds,
  listQuickLogPresets,
} from '@/db/quickLogPresets.repository';

import {
  type PresetForIngestion,
  type QuickLogWidgetProps,
  type WidgetPreset,
  buildPresetLabel,
  collectPending,
  planIngestion,
  removeIngested,
} from './quickLog.plan';

type QuickLogWidget = typeof import('@/widgets/QuickLogWidget').default;

// expo-widgets is a native module that Expo Go and non-iOS platforms do not have.
function loadWidget(): QuickLogWidget | null {
  if (Platform.OS !== 'ios') return null;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@/widgets/QuickLogWidget') as typeof import('@/widgets/QuickLogWidget')).default;
  } catch {
    return null;
  }
}

let inFlight: Promise<number> | null = null;

/**
 * Turns widget taps into expenses, then pushes the current presets to the widget.
 * Order matters: insert first (idempotent via widget_ingested), then re-read the timeline
 * and remove only the ingested ids, so a tap made in between is never lost.
 * Returns how many expenses were created. Concurrent calls share one run.
 */
export function syncQuickLog(): Promise<number> {
  if (!inFlight) {
    inFlight = runSync().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runSync(): Promise<number> {
  const presets = await listQuickLogPresets();
  const widgetPresets: WidgetPreset[] = presets.map((preset) => ({
    id: preset.id,
    label: buildPresetLabel({ icon: preset.categoryIcon, name: preset.categoryName }, preset.amount),
    icon: preset.categoryIcon,
    amount: preset.amount,
  }));

  const widget = loadWidget();
  if (!widget) return 0;

  const before = collectPending(await widget.getTimeline());
  const presetsById = new Map<string, PresetForIngestion>(
    presets.map((preset) => [preset.id, { id: preset.id, categoryId: preset.categoryId, amount: preset.amount }])
  );
  const alreadyIngested = await listIngestedIds(before.pending.map((entry) => entry.id));
  const plan = planIngestion(before.pending, alreadyIngested, presetsById);
  await applyIngestion(plan.expenses, plan.newlyIngestedIds);

  const after = collectPending(await widget.getTimeline());
  const next: QuickLogWidgetProps = {
    presets: widgetPresets,
    pending: removeIngested(after.pending, plan.ingestedIds),
  };
  if (after.latest?.lastLogged) next.lastLogged = after.latest.lastLogged;
  widget.updateSnapshot(next);
  return plan.expenses.length;
}
