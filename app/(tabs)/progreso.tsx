import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Text } from 'react-native';

export default function ProgresoScreen() {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.emoji}>📊</Text>
      <ThemedText type="title">Progreso</ThemedText>
      <ThemedText>Próximamente: estadísticas y rendimiento académico.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emoji:     { fontSize: 48 },
});
