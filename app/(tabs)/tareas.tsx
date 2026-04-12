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
  TextInput,
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

// ── Constantes de formulario ───────────────────────────
const PRIORITIES: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: "alta",  label: "Alta",  color: "#DC2626", bg: "#FEE2E2" },
  { key: "media", label: "Media", color: "#D97706", bg: "#FEF3C7" },
  { key: "baja",  label: "Baja",  color: "#059669", bg: "#D1FAE5" },
];
const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "pendiente",  label: "Pendiente"  },
  { key: "en_proceso", label: "En proceso" },
  { key: "completada", label: "Completada" },
];

// ── Modal Nueva Tarea ──────────────────────────────────
function NewTaskModal({
  visible,
  subjects,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  subjects: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSubmit: (title: string, subjectId: string, priority: Priority, status: TaskStatus, dueDate: string, notes: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [title,      setTitle]      = useState("");
  const [subjectId,  setSubjectId]  = useState(subjects[0]?.id ?? "");
  const [priority,   setPriority]   = useState<Priority>("media");
  const [status,     setStatus]     = useState<TaskStatus>("pendiente");
  const [dueDate,    setDueDate]    = useState(today);
  const [notes,      setNotes]      = useState("");
  const [showSubMenu, setShowSubMenu] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (visible) {
      setTitle(""); setSubjectId(subjects[0]?.id ?? "");
      setPriority("media"); setStatus("pendiente");
      setDueDate(today); setNotes(""); setShowSubMenu(false);
    }
  }, [visible]);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  function formatDisplayDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function handleDateChange(text: string) {
    // Acepta texto tipo DD/MM/YYYY y convierte a ISO
    const clean = text.replace(/\D/g, "").slice(0, 8);
    if (clean.length === 8) {
      const d = clean.slice(0, 2), m = clean.slice(2, 4), y = clean.slice(4, 8);
      setDueDate(`${y}-${m}-${d}`);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ns.overlay} activeOpacity={1} onPress={onClose} />
      <View style={ns.sheet}>
        <View style={ns.sheetHandle} />

        {/* Header */}
        <View style={ns.header}>
          <Text style={ns.title}>Nueva tarea</Text>
          <TouchableOpacity onPress={onClose} style={ns.closeBtn}>
            <MaterialIcons name="close" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Nombre */}
          <Text style={ns.label}>NOMBRE</Text>
          <TextInput
            style={ns.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Parcial de Cálculo"
            placeholderTextColor="#9CA3AF"
          />

          {/* Materia */}
          <Text style={[ns.label, { marginTop: 18 }]}>MATERIA</Text>
          <TouchableOpacity
            style={ns.select}
            onPress={() => setShowSubMenu((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {selectedSubject && (
                <View style={[ns.selectDot, { backgroundColor: selectedSubject.color }]} />
              )}
              <Text style={ns.selectText}>{selectedSubject?.name ?? "Seleccionar"}</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={22} color="#6B7280" />
          </TouchableOpacity>
          {showSubMenu && (
            <View style={ns.dropdown}>
              {subjects.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[ns.dropdownItem, subjectId === sub.id && ns.dropdownItemOn]}
                  onPress={() => { setSubjectId(sub.id); setShowSubMenu(false); }}
                >
                  <View style={[ns.selectDot, { backgroundColor: sub.color }]} />
                  <Text style={[ns.dropdownText, subjectId === sub.id && { color: "#7C3AED", fontWeight: "700" }]}>
                    {sub.name}
                  </Text>
                  {subjectId === sub.id && <MaterialIcons name="check" size={16} color="#7C3AED" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Prioridad */}
          <Text style={[ns.label, { marginTop: 18 }]}>PRIORIDAD</Text>
          <View style={ns.segRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  ns.segBtn,
                  priority === p.key && { backgroundColor: p.bg, borderColor: p.color },
                ]}
                onPress={() => setPriority(p.key)}
              >
                <Text style={[ns.segText, priority === p.key && { color: p.color, fontWeight: "700" }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estado */}
          <Text style={[ns.label, { marginTop: 18 }]}>ESTADO</Text>
          <View style={ns.segRow}>
            {STATUSES.map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[
                  ns.segBtn,
                  status === st.key && { backgroundColor: "#EDE9FE", borderColor: "#7C3AED" },
                ]}
                onPress={() => setStatus(st.key)}
              >
                <Text style={[ns.segText, status === st.key && { color: "#7C3AED", fontWeight: "700" }]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fecha */}
          <Text style={[ns.label, { marginTop: 18 }]}>FECHA DE ENTREGA</Text>
          <View style={ns.dateRow}>
            <TextInput
              style={[ns.input, { flex: 1 }]}
              value={formatDisplayDate(dueDate)}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#9CA3AF"
            />
            <View style={ns.dateIcon}>
              <MaterialIcons name="calendar-today" size={20} color="#7C3AED" />
            </View>
          </View>

          {/* Notas */}
          <Text style={[ns.label, { marginTop: 18 }]}>NOTAS</Text>
          <TextInput
            style={[ns.input, ns.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas adicionales..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Botón crear */}
          <TouchableOpacity
            style={[ns.createBtn, !title.trim() && ns.createBtnDisabled]}
            onPress={() => {
              if (!title.trim()) return;
              onSubmit(title.trim(), subjectId, priority, status, dueDate, notes.trim());
            }}
            activeOpacity={0.85}
          >
            <Text style={ns.createBtnText}>Crear tarea</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Estilos del modal nueva tarea ──────────────────────
const ns = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: "#E5E7EB",
    borderRadius: 2, alignSelf: "center", marginBottom: 16,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title:  { fontSize: 22, fontWeight: "700", color: "#1e1b4b" },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", letterSpacing: 0.8, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#1e1b4b", backgroundColor: "#FAFAFA",
  },
  textarea: { minHeight: 80, paddingTop: 12 },

  select: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FAFAFA",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  selectDot:  { width: 10, height: 10, borderRadius: 5 },
  selectText: { fontSize: 15, color: "#1e1b4b" },
  dropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14,
    backgroundColor: "#fff", marginTop: 4, overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  dropdownItemOn: { backgroundColor: "#F5F3FF" },
  dropdownText:   { flex: 1, fontSize: 14, color: "#374151" },

  segRow: { flexDirection: "row", gap: 8 },
  segBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingVertical: 12, alignItems: "center", backgroundColor: "#fff",
  },
  segText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },

  dateRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  dateIcon: {
    width: 50, height: 50, borderRadius: 14, borderWidth: 1,
    borderColor: "#E5E7EB", backgroundColor: "#FAFAFA",
    alignItems: "center", justifyContent: "center",
  },

  createBtn: {
    backgroundColor: "#7C3AED", borderRadius: 16,
    padding: 17, alignItems: "center", marginTop: 20,
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

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

  function addTask(title: string, subjectId: string, priority: Priority, status: TaskStatus, dueDate: string, notes: string) {
    const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
    if (!subject) return;
    const newTask: Task = {
      id: `tsk_${Date.now()}`,
      title,
      subject,
      priority,
      status,
      dueDate,
      notes,
    };
    setTasks((prev) => [newTask, ...prev]);
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
      <NewTaskModal
        visible={showNew}
        subjects={subjects}
        onClose={() => setShowNew(false)}
        onSubmit={(title, subjectId, priority, status, dueDate, notes) => {
          addTask(title, subjectId, priority, status, dueDate, notes);
          setShowNew(false);
        }}
      />
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

  filterRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, paddingEnd: 20 },
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

  subjectRow: { paddingHorizontal: 20, paddingBottom: 10, gap: 8, paddingEnd: 20 },
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