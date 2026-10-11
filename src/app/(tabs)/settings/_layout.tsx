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
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ajustes' }} />
    </Stack>
  );
}
