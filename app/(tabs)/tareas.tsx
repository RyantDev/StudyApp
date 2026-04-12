// app/(tabs)/tareas.tsx
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTasks } from "@/services/tasksService";
import type { Priority, Task, TaskStatus } from "@/types/home";

const CURRENT_USER_ID = "usr_001";

function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}
function dueDateLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return `${Math.abs(d)}d atrasada`;
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  return `${d}d`;
}
function dueDateColor(iso: string): string {
  const d = daysUntil(iso);
  if (d <= 0) return "#DC2626";
  if (d <= 3) return "#D97706";
  return "#7C3AED";
}

const PRI: Record<Priority, { bg: string; color: string; label: string }> = {
  alta: { bg: "#FEE2E2", color: "#DC2626", label: "Alta" },
  media: { bg: "#FEF3C7", color: "#D97706", label: "Media" },
  baja: { bg: "#D1FAE5", color: "#059669", label: "Baja" },
};
const ST_LABEL: Record<TaskStatus, string> = {
  pendiente: "○ Pendiente",
  en_proceso: "◑ En proceso",
  completada: "● Completada",
};
const STATUS_FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pendiente", label: "Pendiente" },
  { id: "en_proceso", label: "En proceso" },
  { id: "completada", label: "Completadas" },
];

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function TaskCard({
  task,
  onToggle,
  onPress,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onPress: (t: Task) => void;
}) {
  const pri = PRI[task.priority];
  const done = task.status === "completada";
  const inProgress = task.status === "en_proceso";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(task)}
      style={[s.card, { borderLeftColor: task.subject.color }]}
    >
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, done && s.strike]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={s.pills}>
          <Badge
            label={task.subject.name}
            bg={task.subject.color + "20"}
            color={task.subject.color}
          />
          <Badge label={pri.label} bg={pri.bg} color={pri.color} />
          <Text style={s.stLabel}>{ST_LABEL[task.status]}</Text>
        </View>
        {!!task.notes && (
          <Text style={s.notes} numberOfLines={1}>
            {task.notes}
          </Text>
        )}
      </View>

      <View style={s.cardRight}>
        <TouchableOpacity
          onPress={() => onToggle(task.id)}
          style={[
            s.toggleBtn,
            { borderColor: task.subject.color },
            done && { backgroundColor: task.subject.color },
          ]}
        >
          {done && <MaterialIcons name="check" size={14} color="#fff" />}
          {inProgress && (
            <View
              style={[s.halfFill, { backgroundColor: task.subject.color }]}
            />
          )}
        </TouchableOpacity>
        <Text style={[s.dueLabel, { color: dueDateColor(task.dueDate) }]}>
          {dueDateLabel(task.dueDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TareasScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFStatus] = useState("todas");
  const [fSubject, setFSubject] = useState("todas");
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setTasks(await fetchTasks(CURRENT_USER_ID));
    } finally {
      setLoading(false);
    }
  }

  function toggleStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const order: TaskStatus[] = ["pendiente", "en_proceso", "completada"];
        return { ...t, status: order[(order.indexOf(t.status) + 1) % 3] };
      }),
    );
  }

  const subjects = Array.from(
    new Map(tasks.map((t) => [t.subject.id, t.subject])).values(),
  );

  const filtered = tasks.filter(
    (t) =>
      (fStatus === "todas" || t.status === fStatus) &&
      (fSubject === "todas" || t.subject.id === fSubject),
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Mis tareas</Text>
        <TouchableOpacity onPress={() => setShowNew(true)} style={s.headerAdd}>
          <MaterialIcons name="add" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* filtros estado */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFStatus(f.id)}
            style={[s.filterPill, fStatus === f.id && s.filterPillOn]}
          >
            <Text style={[s.filterText, fStatus === f.id && s.filterTextOn]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* filtros materia */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.subjectRow}
      >
        <TouchableOpacity
          onPress={() => setFSubject("todas")}
          style={[s.subChip, fSubject === "todas" && s.subChipOn]}
        >
          <Text
            style={[s.subChipText, fSubject === "todas" && s.subChipTextOn]}
          >
            Todas las materias
          </Text>
        </TouchableOpacity>
        {subjects.map((sub) => (
          <TouchableOpacity
            key={sub.id}
            onPress={() => setFSubject(sub.id)}
            style={[
              s.subChip,
              fSubject === sub.id && {
                backgroundColor: sub.color + "20",
                borderColor: sub.color,
              },
            ]}
          >
            <View style={[s.subDot, { backgroundColor: sub.color }]} />
            <Text
              style={[
                s.subChipText,
                fSubject === sub.id && { color: sub.color, fontWeight: "600" },
              ]}
            >
              {sub.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>📭</Text>
          <Text style={s.emptyText}>Sin tareas aquí</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={toggleStatus}
              onPress={setModalTask}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setShowNew(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* modal detalle */}
      <Modal
        visible={!!modalTask}
        transparent
        animationType="slide"
        onRequestClose={() => setModalTask(null)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalTask(null)}
        />
        {modalTask && (
          <View style={s.sheet}>
            <View
              style={[s.sheetBar, { backgroundColor: modalTask.subject.color }]}
            />
            <Text style={s.sheetTitle}>{modalTask.title}</Text>
            <Text style={s.sheetSub}>{modalTask.subject.name}</Text>
            <View style={s.sheetRow}>
              <Badge
                label={PRI[modalTask.priority].label}
                bg={PRI[modalTask.priority].bg}
                color={PRI[modalTask.priority].color}
              />
              <Badge
                label={ST_LABEL[modalTask.status].replace(/^[○◑●] /, "")}
                bg="#F3F4F6"
                color="#374151"
              />
              <Text
                style={[s.sheetDue, { color: dueDateColor(modalTask.dueDate) }]}
              >
                {dueDateLabel(modalTask.dueDate)}
              </Text>
            </View>
            {!!modalTask.notes && (
              <Text style={s.sheetNotes}>{modalTask.notes}</Text>
            )}
            <TouchableOpacity
              style={s.sheetBtn}
              onPress={() => {
                toggleStatus(modalTask.id);
                setModalTask(null);
              }}
            >
              <Text style={s.sheetBtnText}>
                {modalTask.status === "completada"
                  ? "Marcar como pendiente"
                  : modalTask.status === "en_proceso"
                    ? "Marcar como completada"
                    : "Marcar como en proceso"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalTask(null)}
              style={s.sheetClose}
            >
              <Text style={s.sheetCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* modal nueva tarea */}
      <Modal
        visible={showNew}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNew(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setShowNew(false)}
        />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Nueva tarea</Text>
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            Próximamente: formulario completo para crear tareas.
          </Text>
          <TouchableOpacity
            style={s.sheetBtn}
            onPress={() => setShowNew(false)}
          >
            <Text style={s.sheetBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#1e1b4b" },
  headerAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  filterPillOn: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },
  filterTextOn: { color: "#fff", fontWeight: "700" },

  subjectRow: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  subChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  subChipOn: { backgroundColor: "#EDE9FE", borderColor: "#7C3AED" },
  subDot: { width: 7, height: 7, borderRadius: 4 },
  subChipText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  subChipTextOn: { color: "#7C3AED", fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontSize: 15, color: "#9CA3AF", fontWeight: "500" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 10,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardBody: { flex: 1, minWidth: 0, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1e1b4b" },
  strike: { textDecorationLine: "line-through", color: "#9CA3AF" },
  pills: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    alignItems: "center",
  },
  notes: { fontSize: 12, color: "#9CA3AF" },
  stLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },

  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },

  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minWidth: 54,
  },
  toggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  halfFill: { width: 12, height: 12, borderRadius: 6 },
  dueLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1e1b4b",
    marginBottom: 4,
  },
  sheetSub: { fontSize: 14, color: "#6B7280", marginBottom: 14 },
  sheetRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  sheetDue: { fontSize: 14, fontWeight: "700", marginLeft: "auto" },
  sheetNotes: {
    fontSize: 14,
    color: "#6B7280",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  sheetBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  sheetBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sheetClose: { alignItems: "center", padding: 10 },
  sheetCloseText: { color: "#9CA3AF", fontWeight: "600", fontSize: 14 },
});
