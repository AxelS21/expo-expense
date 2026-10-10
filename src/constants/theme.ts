import { Platform, PlatformColor, type ColorValue } from 'react-native';

// Semantic iOS system colors adapt to light/dark mode automatically.
// Non-iOS platforms get static light-mode fallbacks.
function semantic(iosName: string, fallback: string): ColorValue {
  return Platform.OS === 'ios' ? PlatformColor(iosName) : fallback;
}

export const colors = {
  label: semantic('label', '#000000'),
  secondaryLabel: semantic('secondaryLabel', '#8E8E93'),
  tertiaryLabel: semantic('tertiaryLabel', '#C7C7CC'),
  systemBackground: semantic('systemBackground', '#FFFFFF'),
  systemGroupedBackground: semantic('systemGroupedBackground', '#F2F2F7'),
  secondarySystemGroupedBackground: semantic('secondarySystemGroupedBackground', '#FFFFFF'),
  tertiarySystemFill: semantic('tertiarySystemFill', '#E5E5EA'),
  separator: semantic('separator', '#C6C6C8'),
  tint: semantic('systemBlue', '#0A84FF'),
  destructive: semantic('systemRed', '#FF3B30'),
  // Text/icons drawn on top of `tint` fills.
  onTint: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
