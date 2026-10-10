import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Link href="/diagnostics" style={styles.link}>
        Diagnóstico del widget
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  link: {
    paddingVertical: 12,
    fontSize: 17,
  },
});
