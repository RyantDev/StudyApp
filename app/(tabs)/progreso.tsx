// app/(tabs)/progreso.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTasks } from "@/services/tasksService";
import type { Task } from "@/types/home";

const CURRENT_USER_ID = "usr_001";

// ── Círculo de progreso grande ─────────────────────────
function BigCircle({ pct }: { pct: number }) {
  const SIZE = 140;
  const STROKE = 10;
  // Simulamos el arco con capas de border rotadas
  const segments = [
    { threshold: 25,  rotation: "0deg"   },
    { threshold: 50,  rotation: "90deg"  },
    { threshold: 75,  rotation: "180deg" },
    { threshold: 100, rotation: "270deg" },
  ];

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      {/* Track */}
      <View style={{
        position: "absolute", width: SIZE, height: SIZE,
        borderRadius: SIZE / 2, borderWidth: STROKE,
        borderColor: "rgba(255,255,255,0.25)",
      }} />
      {/* Fill por cuadrantes */}
      {pct >= 25 && (
        <View style={{
          position: "absolute", width: SIZE, height: SIZE,
          borderRadius: SIZE / 2, borderWidth: STROKE,
          borderColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.9)",
          borderRightColor: pct >= 25 ? "rgba(255,255,255,0.9)" : "transparent",
          transform: [{ rotate: "-90deg" }],
        }} />
      )}
      {pct > 0 && pct < 25 && (
        <View style={{
          position: "absolute", width: SIZE, height: SIZE,
          borderRadius: SIZE / 2, borderWidth: STROKE,
          borderColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.9)",
          transform: [{ rotate: "-90deg" }],
        }} />
      )}
      {pct >= 50 && (
        <View style={{
          position: "absolute", width: SIZE, height: SIZE,
          borderRadius: SIZE / 2, borderWidth: STROKE,
          borderColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.9)",
          borderRightColor: "rgba(255,255,255,0.9)",
          borderBottomColor: "rgba(255,255,255,0.9)",
          transform: [{ rotate: "-90deg" }],
        }} />
      )}
      {pct >= 75 && (
        <View style={{
          position: "absolute", width: SIZE, height: SIZE,
          borderRadius: SIZE / 2, borderWidth: STROKE,
          borderColor: "rgba(255,255,255,0.9)",
          borderLeftColor: pct >= 100 ? "rgba(255,255,255,0.9)" : "transparent",
          transform: [{ rotate: "-90deg" }],
        }} />
      )}
      {/* Texto */}
      <Text style={s.circleNum}>{pct}%</Text>
      <Text style={s.circleLabel}>general</Text>
    </View>
  );
}

// ── Barra de progreso ──────────────────────────────────
function ProgressBar({ pct, color, trackColor }: { pct: number; color: string; trackColor: string }) {
  return (
    <View style={[s.barTrack, { backgroundColor: trackColor }]}>
      <View style={[s.barFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ══════════════════════════════════════════════════════
// Pantalla principal
// ══════════════════════════════════════════════════════
export default function ProgresoScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks(CURRENT_USER_ID).then(setTasks).catch(console.error);
  }, []);

  // ── Estadísticas globales ──────────────────────────
  const stats = useMemo(() => {
    const completed   = tasks.filter((t) => t.status === "completada").length;
    const inProgress  = tasks.filter((t) => t.status === "en_proceso").length;
    const pending     = tasks.filter((t) => t.status === "pendiente").length;
    const highPrio    = tasks.filter((t) => t.priority === "alta").length;
    const total       = tasks.length;
    const generalPct  = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, inProgress, pending, highPrio, total, generalPct };
  }, [tasks]);

  // ── Progreso por materia ───────────────────────────
  const bySubject = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number; done: number }>();
    tasks.forEach((t) => {
      const { id, name, color } = t.subject;
      if (!map.has(id)) map.set(id, { name, color, total: 0, done: 0 });
      const s = map.get(id)!;
      s.total += 1;
      if (t.status === "completada") s.done += 1;
    });
    return Array.from(map.values()).map((s) => ({
      ...s,
      pct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    }));
  }, [tasks]);

  // ── Progreso por prioridad ─────────────────────────
  const byPriority = useMemo(() => {
    const priorities = [
      { key: "alta",  label: "Alta",  bg: "#FEE2E2", color: "#EF4444", textColor: "#DC2626" },
      { key: "media", label: "Media", bg: "#FEF3C7", color: "#F59E0B", textColor: "#D97706" },
      { key: "baja",  label: "Baja",  bg: "#D1FAE5", color: "#10B981", textColor: "#059669" },
    ] as const;

    return priorities.map((p) => {
      const group = tasks.filter((t) => t.priority === p.key);
      const done  = group.filter((t) => t.status === "completada").length;
      const total = group.length;
      const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...p, done, total, pct };
    });
  }, [tasks]);

  // ── Stats cards ────────────────────────────────────
  const statCards = [
    { label: "Completadas",    value: stats.completed,  bg: "#D1FAE5", color: "#059669" },
    { label: "En proceso",     value: stats.inProgress, bg: "#FEF3C7", color: "#D97706" },
    { label: "Pendientes",     value: stats.pending,    bg: "#FEE2E2", color: "#DC2626" },
    { label: "Alta prioridad", value: stats.highPrio,   bg: "#EDE9FE", color: "#7C3AED" },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <Text style={s.screenTitle}>Mi progreso</Text>

        {/* Hero card morada */}
        <View style={s.heroCard}>
          <BigCircle pct={stats.generalPct} />
          <Text style={s.heroSub}>
            {stats.completed} de {stats.total} tareas completadas
          </Text>
        </View>

        {/* Grid 2x2 stats */}
        <View style={s.statsGrid}>
          {statCards.map((c) => (
            <View key={c.label} style={[s.statCard, { backgroundColor: c.bg }]}>
              <Text style={[s.statValue, { color: c.color }]}>{c.value}</Text>
              <Text style={[s.statLabel, { color: c.color }]}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Por materia */}
        <Text style={s.sectionTitle}>Por materia</Text>
        <View style={s.subjectList}>
          {bySubject.map((sub) => (
            <View key={sub.name} style={s.subjectRow}>
              <View style={s.subjectHeader}>
                <View style={s.subjectLeft}>
                  <View style={[s.dot, { backgroundColor: sub.color }]} />
                  <Text style={s.subjectName}>{sub.name}</Text>
                </View>
                <Text style={[s.subjectPct, { color: sub.color }]}>{sub.pct}%</Text>
              </View>
              <ProgressBar
                pct={sub.pct}
                color={sub.color}
                trackColor={sub.color + "22"}
              />
              <Text style={s.subjectTasks}>{sub.done}/{sub.total} tareas</Text>
            </View>
          ))}
        </View>

        {/* Por prioridad */}
        <Text style={s.sectionTitle}>Por prioridad</Text>
        <View style={s.priorityList}>
          {byPriority.map((p) => (
            <View key={p.key} style={s.priorityRow}>
              <View style={[s.priChip, { backgroundColor: p.bg }]}>
                <Text style={[s.priChipText, { color: p.textColor }]}>{p.label}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <ProgressBar
                  pct={p.pct}
                  color={p.color}
                  trackColor={p.color + "22"}
                />
              </View>
              <Text style={s.priCount}>{p.done}/{p.total}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════
// Estilos
// ══════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#F8F7FF" },
  scroll: { paddingHorizontal: 18, paddingTop: 12 },

  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1e1b4b", marginBottom: 18 },

  // Hero
  heroCard: {
    backgroundColor: "#7C3AED",
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  circleNum:   { fontSize: 32, fontWeight: "800", color: "#fff" },
  circleLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginTop: -4 },
  heroSub:     { fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: "500" },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: "47%",
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  statValue: { fontSize: 36, fontWeight: "800" },
  statLabel: { fontSize: 14, fontWeight: "600" },

  // Por materia
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1e1b4b", marginBottom: 16 },
  subjectList:  { gap: 20, marginBottom: 28 },
  subjectRow:   { gap: 6 },
  subjectHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  subjectName:  { fontSize: 15, fontWeight: "600", color: "#1e1b4b" },
  subjectPct:   { fontSize: 15, fontWeight: "700" },
  subjectTasks: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },

  // Por prioridad
  priorityList: { gap: 14, marginBottom: 8 },
  priorityRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  priChip: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    minWidth: 58, alignItems: "center",
  },
  priChipText: { fontSize: 12, fontWeight: "700" },
  priCount:    { fontSize: 13, color: "#9CA3AF", fontWeight: "600", minWidth: 28, textAlign: "right" },

  // Barra
  barTrack: { height: 8, borderRadius: 10, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: 10 },
});