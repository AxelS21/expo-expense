import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Expense',
  slug: 'expense',
  scheme: 'expense',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['ios'],
  ios: {
    bundleIdentifier: 'com.axelgere.expense',
    supportsTablet: false,
    // La app no envia datos a terceros y no requiere permisos especiales.
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: ['expo-router', 'expo-sqlite', 'expo-sharing'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
  },
};

export default config;
