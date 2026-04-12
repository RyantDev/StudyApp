// app/(tabs)/index.tsx
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { fetchHomeData } from "@/services/homeService";
import type { HomeData, Task, Priority } from "@/types/home";

// ── ID del usuario autenticado ─────────────────────────
// Reemplaza con tu contexto/hook de auth cuando lo tengas.
const CURRENT_USER_ID = "usr_001";

// ── helpers de fecha ───────────────────────────────────
function daysUntil(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(isoDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

function dueDateLabel(isoDate: string): string {
  const d = daysUntil(isoDate);
  if (d < 0)   return `${Math.abs(d)}d atrasada`;
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  return `En ${d} días`;
}

function dueDateColor(isoDate: string): string {
  const d = daysUntil(isoDate);
  if (d <= 0) return "#DC2626";
  if (d <= 3) return "#D97706";
  return "#7C3AED";
}

// ── estilos de prioridad ───────────────────────────────
const PRIORITY_STYLE: Record<Priority, { bg: string; color: string; label: string }> = {
  alta:  { bg: "#FEE2E2", color: "#DC2626", label: "Alta"  },
  media: { bg: "#FEF3C7", color: "#D97706", label: "Media" },
  baja:  { bg: "#D1FAE5", color: "#059669", label: "Baja"  },
};

// ══════════════════════════════════════════════════════
// Sub-componentes
// ══════════════════════════════════════════════════════

function Badge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(100, pct)}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function UrgentBanner({ task }: { task: Task }) {
  return (
    <View style={styles.urgentBanner}>
      <Text style={styles.urgentEyebrow}>
        🔥  Vence {dueDateLabel(task.dueDate).toLowerCase()}
      </Text>
      <Text style={styles.urgentTitle}>{task.title}</Text>
      <Text style={styles.urgentSub}>{task.subject.name}</Text>
    </View>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskDot, { backgroundColor: task.subject.color }]} />

      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View
            style={[
              styles.subjectPill,
              { backgroundColor: task.subject.color + "22" },
            ]}
          >
            <Text style={[styles.subjectPillText, { color: task.subject.color }]}>
              {task.subject.name}
            </Text>
          </View>
          <Badge priority={task.priority} />
        </View>
      </View>

      <Text style={[styles.taskDue, { color: dueDateColor(task.dueDate) }]}>
        {dueDateLabel(task.dueDate)}
      </Text>
    </View>
  );
}

// ── skeleton mientras carga ────────────────────────────
function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={styles.skeletonText}>Cargando tu agenda…</Text>
    </View>
  );
}

// ── estado de error ────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.skeletonWrap}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
      <Text style={styles.skeletonText}>No se pudieron cargar los datos.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════
// Pantalla principal
// ══════════════════════════════════════════════════════
export default function HomeScreen() {
  const [data, setData]       = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchHomeData(CURRENT_USER_ID);
      setData(result);
    } catch (e) {
      console.error("[HomeScreen] fetchHomeData failed:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // fecha localizada
  const today = new Date();
  const dateStr = today.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#5B21B6", dark: "#3B0764" }}
      headerImage={
        <View style={styles.headerContent}>
          <Text style={styles.headerDate}>{capitalizedDate}</Text>
          <Text style={styles.headerTitle}>
            ¡Hola, {data?.user.name.split(" ")[0] ?? "estudiante"}! 👋
          </Text>
          <Text style={styles.headerSub}>
            {data
              ? `${data.stats.pendingTasks} tarea${data.stats.pendingTasks !== 1 ? "s" : ""} pendiente${data.stats.pendingTasks !== 1 ? "s" : ""} esta semana`
              : "Cargando…"}
          </Text>

          <View style={styles.headerProgressBox}>
            <View style={styles.headerProgressRow}>
              <Text style={styles.headerProgressLabel}>Progreso general</Text>
              <Text style={styles.headerProgressPct}>
                {data?.stats.weeklyProgressPct ?? 0}%
              </Text>
            </View>
            <View style={styles.headerTrack}>
              <View
                style={[
                  styles.headerFill,
                  { width: `${data?.stats.weeklyProgressPct ?? 0}%` as any },
                ]}
              />
            </View>
            <View style={styles.headerProgressRow}>
              <Text style={styles.headerProgressSub}>
                {data?.stats.completedTasks ?? 0} completadas
              </Text>
              <Text style={styles.headerProgressSub}>
                {data?.stats.pendingTasks ?? 0} pendientes
              </Text>
            </View>
          </View>
        </View>
      }
    >
      {loading && <LoadingSkeleton />}

      {!loading && error && <ErrorState onRetry={loadData} />}

      {!loading && !error && data && (
        <>
          {data.urgentTask && <UrgentBanner task={data.urgentTask} />}

          {/* próximas entregas */}
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Próximas entregas</ThemedText>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.taskList}>
              {data.upcomingTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </View>
          </ThemedView>

          {/* estadísticas rápidas */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Resumen</ThemedText>
            <View style={styles.statsRow}>
              {[
                { label: "Materias",   value: data.stats.totalSubjects,  bg: "#EDE9FE", color: "#7C3AED" },
                { label: "Pendientes", value: data.stats.pendingTasks,   bg: "#FEF3C7", color: "#D97706" },
                { label: "Listas",     value: data.stats.completedTasks, bg: "#D1FAE5", color: "#059669" },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* progreso por materia */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Progreso por materia</ThemedText>
            {data.subjectProgress.map((m) => (
              <View key={m.subjectId} style={styles.subjectProgress}>
                <View style={styles.subjectProgressHeader}>
                  <View style={styles.subjectProgressLeft}>
                    <View style={[styles.subjectDot, { backgroundColor: m.color }]} />
                    <Text style={styles.subjectName}>{m.name}</Text>
                  </View>
                  <Text style={[styles.subjectPct, { color: m.color }]}>{m.progressPct}%</Text>
                </View>
                <ProgressBar pct={m.progressPct} color={m.color} />
              </View>
            ))}
          </ThemedView>

          {/* acción rápida */}
          <ThemedView style={[styles.section, { paddingBottom: 32 }]}>
            <TouchableOpacity style={styles.fab}>
              <Text style={styles.fabText}>+ Nueva tarea</Text>
            </TouchableOpacity>
          </ThemedView>
        </>
      )}
    </ParallaxScrollView>
  );
}

// ══════════════════════════════════════════════════════
// Estilos
// ══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  headerContent:       { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 24 },
  headerDate:          { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500", marginBottom: 4 },
  headerTitle:         { fontSize: 26, fontWeight: "700", color: "#fff", marginBottom: 4 },
  headerSub:           { fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 18 },
  headerProgressBox:   { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 14 },
  headerProgressRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  headerProgressLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  headerProgressPct:   { fontSize: 15, color: "#fff", fontWeight: "700" },
  headerTrack:         { height: 7, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, overflow: "hidden", marginBottom: 6 },
  headerFill:          { height: "100%", backgroundColor: "#A78BFA", borderRadius: 10 },
  headerProgressSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)" },

  skeletonWrap:  { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  skeletonText:  { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  retryBtn:      { marginTop: 8, backgroundColor: "#EDE9FE", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText:     { color: "#7C3AED", fontWeight: "700", fontSize: 14 },

  urgentBanner:  { backgroundColor: "#FEE2E2", borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: "#FECACA" },
  urgentEyebrow: { fontSize: 12, color: "#DC2626", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  urgentTitle:   { fontSize: 15, fontWeight: "700", color: "#991B1B", marginBottom: 2 },
  urgentSub:     { fontSize: 12, color: "#DC2626" },

  section:       { gap: 12, marginBottom: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll:        { fontSize: 13, color: "#7C3AED", fontWeight: "600" },

  taskList: { gap: 8 },
  taskRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFA",
    borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: "#F3F4F6",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  taskDot:        { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskInfo:       { flex: 1, minWidth: 0, gap: 5 },
  taskTitle:      { fontSize: 14, fontWeight: "600", color: "#1e1b4b" },
  taskMeta:       { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  taskDue:        { fontSize: 13, fontWeight: "700", flexShrink: 0 },

  subjectPill:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  subjectPillText: { fontSize: 11, fontWeight: "600" },

  badge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "700" },
  statLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  subjectProgress:       { gap: 6 },
  subjectProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectProgressLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  subjectDot:            { width: 10, height: 10, borderRadius: 5 },
  subjectName:           { fontSize: 14, fontWeight: "600", color: "#1e1b4b" },
  subjectPct:            { fontSize: 14, fontWeight: "700" },
  progressTrack:         { height: 9, backgroundColor: "#F3F4F6", borderRadius: 10, overflow: "hidden" },
  progressFill:          { height: "100%", borderRadius: 10 },

  fab: {
    backgroundColor: "#7C3AED", borderRadius: 16, padding: 16, alignItems: "center",
    ...Platform.select({
      ios:     { shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});