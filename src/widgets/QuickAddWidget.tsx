import { AccessoryWidgetBackground, Text, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, font, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

// Lock Screen shortcut: tapping opens the new-expense form after the normal iOS unlock.
// iOS 17+ requires containerBackground; without it the system renders a placeholder
// that links to Apple's documentation instead of the widget.
const QuickAddWidget = () => {
  'widget';
  return (
    <ZStack
      modifiers={[
        containerBackground('clear', 'widget'),
        widgetURL('expense://expense/new'),
      ]}>
      <AccessoryWidgetBackground />
      <Text modifiers={[font({ weight: 'bold', size: 20 })]}>+$</Text>
    </ZStack>
  );
};

export default createWidget('QuickAddWidget', QuickAddWidget);
