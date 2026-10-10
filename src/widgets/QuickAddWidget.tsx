import { Text, VStack } from '@expo/ui/swift-ui';
import { font, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

// Lock Screen shortcut: tapping opens the new-expense form after the normal iOS unlock.
const QuickAddWidget = () => {
  'widget';
  return (
    <VStack modifiers={[widgetURL('expense://expense/new')]}>
      <Text modifiers={[font({ weight: 'bold', size: 20 })]}>+$</Text>
    </VStack>
  );
};

export default createWidget('QuickAddWidget', QuickAddWidget);
