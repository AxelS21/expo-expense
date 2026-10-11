import { Button, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  opacity,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { type WidgetEnvironment, createWidget } from 'expo-widgets';

import type { QuickLogWidgetProps } from '@/services/quickLog.plan';

// Quick log: each button appends a tap to `pending`. The tap handler runs in the widget
// extension's JavaScriptCore context, which has no native modules and no access to SQLite,
// so it only returns new props (merged into the timeline entry). The app ingests the queue
// on launch and on foreground (src/services/quickLog.service.ts).
//
// The 'widget' directive turns this function into a string, so it must stay self-contained:
// only the @expo/ui components and modifiers the widget bundle exposes as globals.
//
// Monochrome on purpose: on the Lock Screen (vibrant) and in tinted Home Screens (accented)
// iOS discards colors, so hierarchy comes from weight, size and opacity only.
const QuickLogWidget = (props: QuickLogWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const presets = props.presets ?? [];
  const pending = props.pending ?? [];
  const isLockScreen = environment.widgetFamily === 'accessoryRectangular';
  const limit = environment.widgetFamily === 'systemMedium' ? 4 : 2;
  const visible = presets.slice(0, limit);
  const settingsUrl = 'expense://settings/quick-log';

  if (visible.length === 0) {
    return (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[containerBackground('clear', 'widget'), widgetURL(settingsUrl)]}>
        <Text modifiers={[font({ weight: 'semibold', size: isLockScreen ? 13 : 15 })]}>
          Configurá accesos en la app
        </Text>
      </VStack>
    );
  }

  const rowSize = isLockScreen ? 13 : 15;
  const buttons = visible.map((preset) => (
    <Button
      key={preset.id}
      modifiers={[buttonStyle(isLockScreen ? 'plain' : 'bordered')]}
      onPress={() => {
        const at = Date.now();
        const entry = {
          id: at.toString(36) + '-' + Math.random().toString(36).slice(2, 10),
          presetId: preset.id,
          at,
        };
        return { pending: [...pending, entry], lastLogged: preset.label };
      }}>
      <HStack spacing={4}>
        <Text
          modifiers={[
            font({ weight: 'semibold', size: rowSize }),
            lineLimit(1),
            minimumScaleFactor(0.7),
          ]}>
          {preset.label}
        </Text>
        <Spacer />
      </HStack>
    </Button>
  ));

  const confirmation = props.lastLogged ? (
    <Text modifiers={[font({ size: isLockScreen ? 11 : 12 }), lineLimit(1), opacity(0.7)]}>
      {'✓ ' + props.lastLogged}
    </Text>
  ) : null;

  return (
    <VStack
      alignment="leading"
      spacing={isLockScreen ? 2 : 6}
      modifiers={[containerBackground('clear', 'widget'), foregroundStyle('primary')]}>
      {buttons}
      {confirmation}
    </VStack>
  );
};

export default createWidget<QuickLogWidgetProps>('QuickLogWidget', QuickLogWidget);
