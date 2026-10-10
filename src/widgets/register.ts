import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export type WidgetDiagnostics = {
  status: 'skipped' | 'registered' | 'failed';
  error?: string;
  widgetsDirectory?: string | null;
  timeline?: string;
  provisionedAppGroups?: string;
};

// The signed provisioning profile embeds an XML plist; read the App Groups it grants.
function readProvisionedAppGroups(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
    const bytes = new File(Paths.bundle, 'embedded.mobileprovision').bytesSync();
    let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);

    const match = text.match(
      /<key>com\.apple\.security\.application-groups<\/key>\s*<array>([\s\S]*?)<\/array>/,
    );
    if (!match?.[1]) return 'no application-groups entitlement in profile';
    const groups = [...match[1].matchAll(/<string>(.*?)<\/string>/g)].map((m) => m[1]);
    return groups.length > 0 ? groups.join(', ') : 'empty application-groups array';
  } catch (error) {
    return `error: ${describeError(error)}`;
  }
}

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
    diagnostics = {
      status: 'registered',
      widgetsDirectory: nativeModule.widgetsDirectory ?? null,
      provisionedAppGroups: readProvisionedAppGroups(),
    };

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
