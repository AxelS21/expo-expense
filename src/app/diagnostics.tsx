import { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';

import { type ThemeColors, useTheme, spacing } from '@/constants/theme';
import { getWidgetDiagnostics } from '@/widgets/register';

// Widget diagnostics: App Group access, registration errors, and stored timeline.
export default function DiagnosticsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [diagnostics, setDiagnostics] = useState(getWidgetDiagnostics);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Diagnóstico del widget</Text>
      <Text style={styles.body} selectable>
        {JSON.stringify(diagnostics, null, 2)}
      </Text>
      <Button title="Actualizar" onPress={() => setDiagnostics(getWidgetDiagnostics())} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
    title: { fontWeight: 'bold', color: colors.label },
    body: { color: colors.label },
  });
}
