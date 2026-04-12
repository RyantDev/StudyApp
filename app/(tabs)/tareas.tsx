import { StyleSheet, View, Text } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function TareasScreen() {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <ThemedText type="title">Tareas</ThemedText>
      <ThemedText>Próximamente: lista completa de tareas.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emoji:     { fontSize: 48 },
});
