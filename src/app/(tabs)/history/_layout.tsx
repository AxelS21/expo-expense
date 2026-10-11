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
      <Stack.Screen name="index" options={{ title: 'Historial' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar gasto', headerLargeTitle: false }} />
    </Stack>
  );
}
