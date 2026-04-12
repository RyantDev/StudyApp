import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, Text } from "react-native";

export default function CalendarioScreen() {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.emoji}>📅</Text>
      <ThemedText type="title">Calendario</ThemedText>
      <ThemedText>Próximamente: vista mensual y semanal</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emoji: { fontSize: 48 },
});
