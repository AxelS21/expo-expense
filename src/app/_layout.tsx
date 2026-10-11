import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { UpdateBanner } from '@/components/ui/UpdateBanner';
import { useTheme } from '@/constants/theme';
import { registerWidgets, runQuickLogSync } from '@/widgets/register';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  useEffect(() => {
    registerWidgets();
    runQuickLogSync();
    // Widget taps queue up while the app is in the background; ingest them on return.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runQuickLogSync();
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.label },
          headerLargeTitleStyle: { color: colors.label },
          headerTintColor: colors.tint,
          headerTransparent: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="expense/new"
          options={{ title: 'Nuevo gasto', presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [1.0] }}
        />
      </Stack>
      <UpdateBanner />
    </>
  );
}
