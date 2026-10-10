import { useState } from 'react';
import { Button, ScrollView, Text } from 'react-native';

import { getWidgetDiagnostics } from '@/widgets/register';

// Widget diagnostics: App Group access, registration errors, and stored timeline.
export default function DiagnosticsScreen() {
  const [diagnostics, setDiagnostics] = useState(getWidgetDiagnostics);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: 'bold' }}>Diagnóstico del widget</Text>
      <Text selectable>{JSON.stringify(diagnostics, null, 2)}</Text>
      <Button title="Actualizar" onPress={() => setDiagnostics(getWidgetDiagnostics())} />
    </ScrollView>
  );
}
