import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export type WidgetDiagnostics = {
  status: 'skipped' | 'registered' | 'failed';
  error?: string;
  widgetsDirectory?: string | null;
  timeline?: string;
};

let diagnostics: WidgetDiagnostics = { status: 'skipped' };

export function getWidgetDiagnostics(): WidgetDiagnostics {
  return diagnostics;
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

// expo-widgets is a native module that Expo Go does not include, so load it lazily.
export function registerWidgets(): void {
  if (Platform.OS !== 'ios') return;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require('expo') as typeof import('expo');
    const nativeModule = requireNativeModule<{ widgetsDirectory?: string | null }>('ExpoWidgets');
    diagnostics = { status: 'registered', widgetsDirectory: nativeModule.widgetsDirectory ?? null };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: quickAddWidget } = require('./QuickAddWidget') as typeof import('./QuickAddWidget');
    quickAddWidget.updateSnapshot({});

    quickAddWidget
      .getTimeline()
      .then((entries) => {
        diagnostics = { ...diagnostics, timeline: JSON.stringify(entries) };
      })
      .catch((error: unknown) => {
        diagnostics = { ...diagnostics, timeline: `error: ${describeError(error)}` };
      });
  } catch (error) {
    diagnostics = { ...diagnostics, status: 'failed', error: describeError(error) };
  }
}
