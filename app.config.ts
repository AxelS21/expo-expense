import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Expense',
  slug: 'expense',
  scheme: 'expense',
  version: '1.1.0',
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
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-sharing',
    [
      'expo-widgets',
      {
        widgets: [
          {
            name: 'QuickAddWidget',
            displayName: 'Nuevo gasto',
            description: 'Abre el formulario para cargar un gasto.',
            ios: {
              supportedFamilies: ['accessoryCircular'],
            },
          },
          {
            name: 'QuickLogWidget',
            displayName: 'Registro rápido',
            description: 'Registra un gasto frecuente con un toque, sin abrir la app.',
            ios: {
              supportedFamilies: ['accessoryRectangular', 'systemSmall', 'systemMedium'],
            },
          },
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  updates: {
    url: 'https://u.expo.dev/342bbce2-9f8b-447f-b4c2-b109546c7584',
    // Builds come from GitHub Actions, not EAS Build, so the channel is set here.
    requestHeaders: {
      'expo-channel-name': 'production',
    },
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '342bbce2-9f8b-447f-b4c2-b109546c7584',
    },
  },
  owner: 'axels21',
};

export default config;
