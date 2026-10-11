import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useTheme } from '@/constants/theme';
import { registerWidgets } from '@/widgets/register';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  useEffect(() => {
    registerWidgets();
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
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="expense/new"
          options={{ title: 'Nuevo gasto', presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [1.0] }}
        />
      </Stack>
    </>
  );
}
