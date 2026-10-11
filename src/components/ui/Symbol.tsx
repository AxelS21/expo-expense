import { Platform, StyleSheet, Text, View } from 'react-native';
import { Host, Image, type ImageProps } from '@expo/ui/swift-ui';
import { accessibilityHidden, font } from '@expo/ui/swift-ui/modifiers';

type SymbolWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface SymbolProps {
  /** SF Symbol name, e.g. 'chevron.right'. */
  name: NonNullable<ImageProps['systemName']>;
  /** Point size; also the fixed box size so the layout never jumps while the native view mounts. */
  size: number;
  color: string;
  weight?: SymbolWeight;
  /** Text glyph rendered on platforms without SF Symbols. */
  fallback?: string;
  /** Set only when the symbol stands alone; by default it is decorative and hidden from VoiceOver. */
  accessibilityLabel?: string;
}

/** SF Symbol through the SwiftUI `Image` from `@expo/ui` (already in the native build, OTA-safe). */
export function Symbol({ name, size, color, weight = 'regular', fallback, accessibilityLabel }: SymbolProps) {
  const labelled = accessibilityLabel !== undefined;
  const box = { width: size, height: size };

  return (
    <View
      style={[styles.box, box]}
      accessible={labelled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={labelled ? 'image' : undefined}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
    >
      {Platform.OS === 'ios' ? (
        <Host style={box}>
          <Image
            systemName={name}
            color={color}
            modifiers={[font({ size, weight }), accessibilityHidden(true)]}
          />
        </Host>
      ) : fallback ? (
        <Text style={{ fontSize: size, lineHeight: size, color }}>{fallback}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
