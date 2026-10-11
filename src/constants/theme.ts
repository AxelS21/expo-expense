import { useColorScheme } from 'react-native';

// Explicit palettes selected from the JS color scheme. PlatformColor was dropped because its
// native resolution did not match the container appearance on iOS 26 (dark background, dark text).
export const lightColors = {
  background: '#F3F4F8',
  surface: '#FFFFFF',
  label: '#0B1220',
  secondaryLabel: '#5B6475',
  tertiaryLabel: '#8A93A3',
  separator: 'rgba(15,23,42,0.08)',
  fill: '#E8EBF2',
  tint: '#2F6BFF',
  destructive: '#E5484D',
  // Text/icons drawn on top of `tint` fills.
  onTint: '#FFFFFF',
} as const;

export type ThemeColors = { readonly [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#0B0F17',
  surface: '#161B26',
  label: '#F4F6FA',
  secondaryLabel: '#A3ACBC',
  tertiaryLabel: '#7C8597',
  separator: 'rgba(255,255,255,0.08)',
  fill: '#222938',
  tint: '#5B8CFF',
  destructive: '#FF6369',
  onTint: '#FFFFFF',
};

export type ThemeScheme = 'light' | 'dark';

export function useTheme(): { colors: ThemeColors; scheme: ThemeScheme } {
  const scheme: ThemeScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: scheme === 'dark' ? darkColors : lightColors, scheme };
}

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
