// app/(tabs)/calendario.tsx
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import {
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
import type { Priority, Task } from "@/types/home";

const CURRENT_USER_ID = "usr_001";

// ── Helpers de fecha ───────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Lunes=0 ... Domingo=6
function getWeekdayMon(date: Date) {
  return (date.getDay() + 6) % 7;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function formatDayHeader(date: Date) {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTaskDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// ── Estilos de prioridad ───────────────────────────────
const PRI: Record<Priority, { bg: string; color: string; label: string }> = {
  alta:  { bg: "#FEE2E2", color: "#DC2626", label: "Alta"  },
  media: { bg: "#FEF3C7", color: "#D97706", label: "Media" },
  baja:  { bg: "#D1FAE5", color: "#059669", label: "Baja"  },
};

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

// ══════════════════════════════════════════════════════
// Sub-componentes
// ══════════════════════════════════════════════════════

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DayDots({ tasks }: { tasks: Task[] }) {
  const colors = Array.from(new Set(tasks.map((t) => t.subject.color))).slice(0, 3);
  return (
    <View style={s.dotsRow}>
      {colors.map((c) => (
        <View key={c} style={[s.dot, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

function DayCell({
  day,
  isToday,
  isSelected,
  isCurrentMonth,
  tasks,
  onPress,
}: {
  day: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  tasks: Task[];
  onPress: () => void;
}) {
  const hasUrgent = tasks.some(
    (t) => t.priority === "alta" && t.status !== "completada",
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.dayCell, isSelected && s.dayCellSelected]}
    >
      <Text
        style={[
          s.dayText,
          !isCurrentMonth && s.dayTextFaded,
          isToday && !isSelected && s.dayTextToday,
          isSelected && s.dayTextSelected,
        ]}
      >
        {day.getDate()}
      </Text>

      {hasUrgent && !isSelected && <View style={s.urgentDot} />}

      {tasks.length > 0 && <DayDots tasks={tasks} />}
    </TouchableOpacity>
  );
}

function TaskDayCard({ task }: { task: Task }) {
  const pri = PRI[task.priority];
  const done = task.status === "completada";

  return (
    <View style={[s.taskCard, { borderLeftColor: task.subject.color }]}>
      <View style={s.taskCardBody}>
        <Text style={[s.taskCardTitle, done && s.strike]}>{task.title}</Text>
        <View style={s.taskCardPills}>
          <Badge
            label={task.subject.name}
            bg={task.subject.color + "20"}
            color={task.subject.color}
          />
          <Badge label={pri.label} bg={pri.bg} color={pri.color} />
        </View>
        {!!task.notes && (
          <Text style={s.taskCardNotes} numberOfLines={2}>{task.notes}</Text>
        )}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════
// Pantalla principal
// ══════════════════════════════════════════════════════
export default function CalendarioScreen() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTasks(CURRENT_USER_ID).then(setTasks).catch(console.error);
  }, []);

  const tasksThisMonth = tasks
    .filter((t) => isSameMonth(new Date(t.dueDate), viewDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const tasksSelectedDay = selectedDay
    ? tasks.filter((t) => isSameDay(new Date(t.dueDate), selectedDay))
    : [];

  function handleDayPress(day: Date) {
    setSelectedDay(day);
    const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
    if (dayTasks.length > 0) setModalVisible(true);
  }

  function buildCalendarRows() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstWeekday = getWeekdayMon(new Date(year, month, 1));

    const cells: Date[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push(new Date(year, month - 1, prevMonthDays - i));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let d = 1; d <= 7 - remainder; d++) {
        cells.push(new Date(year, month + 1, d));
      }
    }
    const rows: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }

  const rows = buildCalendarRows();
  const monthLabel = formatMonthYear(viewDate).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <Text style={s.screenTitle}>Calendario</Text>

        {/* Navegación de mes */}
        <View style={s.monthHeader}>
          <TouchableOpacity
            onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            style={s.navBtn}
          >
            <MaterialIcons name="chevron-left" size={20} color="#7C3AED" />
          </TouchableOpacity>
          <Text style={s.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            style={s.navBtn}
          >
            <MaterialIcons name="chevron-right" size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Grid del calendario */}
        <View style={s.calendarBox}>
          <View style={s.weekdayRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={s.weekdayLabel}>{d}</Text>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={s.weekRow}>
              {row.map((day, di) => {
                const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
                return (
                  <DayCell
                    key={di}
                    day={day}
                    isToday={isSameDay(day, today)}
                    isSelected={!!selectedDay && isSameDay(day, selectedDay)}
                    isCurrentMonth={isSameMonth(day, viewDate)}
                    tasks={dayTasks}
                    onPress={() => handleDayPress(day)}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Lista del mes */}
        <Text style={s.sectionTitle}>Este mes</Text>

        {tasksThisMonth.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Sin tareas este mes</Text>
          </View>
        ) : (
          <View style={s.monthList}>
            {tasksThisMonth.map((task) => {
              const done = task.status === "completada";
              return (
                <TouchableOpacity
                  key={task.id}
                  style={s.listRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDay(new Date(task.dueDate));
                    setModalVisible(true);
                  }}
                >
                  <View style={[s.listDot, { backgroundColor: task.subject.color }]} />
                  <Text style={[s.listTitle, done && s.strike]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={s.listDate}>{formatTaskDate(task.dueDate)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal día */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetDate}>
              {selectedDay
                ? formatDayHeader(selectedDay).replace(/^\w/, (c) => c.toUpperCase())
                : ""}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={s.closeBtn}>
              <MaterialIcons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {tasksSelectedDay.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>Sin tareas este día</Text>
              </View>
            ) : (
              tasksSelectedDay.map((task) => (
                <TaskDayCard key={task.id} task={task} />
              ))
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════
// Estilos
// ══════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1e1b4b", marginBottom: 20 },

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthLabel: { fontSize: 17, fontWeight: "700", color: "#1e1b4b" },
  navBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center",
  },

  calendarBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    marginBottom: 28,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  weekdayRow: { flexDirection: "row", marginBottom: 2 },
  weekdayLabel: {
    flex: 1, textAlign: "center",
    fontSize: 12, fontWeight: "600", color: "#9CA3AF", paddingVertical: 6,
  },
  weekRow: { flexDirection: "row" },

  dayCell: {
    flex: 1, alignItems: "center", paddingVertical: 6,
    borderRadius: 12, minHeight: 52, position: "relative",
  },
  dayCellSelected: { backgroundColor: "#7C3AED", borderRadius: 14 },
  dayText:         { fontSize: 14, fontWeight: "500", color: "#1e1b4b" },
  dayTextFaded:    { color: "#D1D5DB" },
  dayTextToday:    { color: "#7C3AED", fontWeight: "700" },
  dayTextSelected: { color: "#fff", fontWeight: "700" },

  urgentDot: {
    position: "absolute", top: 3, right: 6,
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#DC2626",
  },
  dotsRow: { flexDirection: "row", gap: 3, marginTop: 3, justifyContent: "center" },
  dot:     { width: 5, height: 5, borderRadius: 3 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e1b4b", marginBottom: 14 },
  monthList: { gap: 0 },
  listRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 10,
  },
  listDot:   { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  listTitle: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e1b4b" },
  listDate:  { fontSize: 13, color: "#9CA3AF", fontWeight: "500", flexShrink: 0 },
  strike:    { textDecorationLine: "line-through", color: "#D1D5DB" },

  emptyBox:   { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText:  { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "55%",
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: "#E5E7EB",
    borderRadius: 2, alignSelf: "center", marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 18,
  },
  sheetDate: { fontSize: 20, fontWeight: "700", color: "#1e1b4b" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },

  taskCard: {
    borderLeftWidth: 3, borderRadius: 14,
    backgroundColor: "#FAFAFA", padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#F3F4F6",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  taskCardBody:  { gap: 6 },
  taskCardTitle: { fontSize: 15, fontWeight: "600", color: "#1e1b4b" },
  taskCardPills: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  taskCardNotes: { fontSize: 12, color: "#9CA3AF" },

  badge:     { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
});