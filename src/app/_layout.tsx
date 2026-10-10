import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { registerWidgets } from '@/widgets/register';

export default function RootLayout() {
  useEffect(() => {
    registerWidgets();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Expense' }} />
        <Stack.Screen
          name="expense/new"
          options={{ title: 'Nuevo gasto', presentation: 'modal' }}
        />
        <Stack.Screen name="expense/[id]" options={{ title: 'Editar gasto' }} />
        <Stack.Screen name="history" options={{ title: 'Historial' }} />
        <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Diagnóstico' }} />
      </Stack>
    </>
  );
}
