import { Stack } from 'expo-router';

import { useTheme } from '@/constants/theme';

export default function Layout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.label },
        headerLargeTitleStyle: { color: colors.label },
        headerTintColor: colors.tint,
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="categories/index" options={{ title: 'Categorías' }} />
      <Stack.Screen name="categories/[id]" options={{ title: 'Categoría', headerLargeTitle: false }} />
      <Stack.Screen name="diagnostics"options={{ title: 'Diagnóstico', headerLargeTitle: false }} />
      <Stack.Screen name="quick-log" options={{ title: 'Accesos rápidos', headerLargeTitle: false }} />
    </Stack>
  );
}
