import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// expo-widgets is a native module that Expo Go does not include, so load it lazily.
export function registerWidgets(): void {
  if (Platform.OS !== 'ios') return;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: quickAddWidget } = require('./QuickAddWidget') as typeof import('./QuickAddWidget');
  quickAddWidget.updateSnapshot({});
}
