import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { registerWidgets } from '@/widgets/register';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    registerWidgets();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="expense/new"
          options={{ title: 'Nuevo gasto', presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [1.0] }}
        />
        <Stack.Screen name="expense/[id]" options={{ title: 'Editar gasto' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Diagnóstico' }} />
      </Stack>
    </>
  );
}
