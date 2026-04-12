// app/(tabs)/materias.tsx
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTasks } from "@/services/tasksService";
import type { Subject, Task } from "@/types/home";

const CURRENT_USER_ID = "usr_001";

// Paleta de colores disponibles para nueva materia
const PALETTE = [
  "#7C3AED",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#EF4444",
  "#14B8A6",
  "#F97316",
];

// ── Helpers ────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Fondo pastel muy suave a partir del color de la materia */
function bgFromColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.10)`;
}

// ── Tipos internos ─────────────────────────────────────
interface SubjectCard {
  subject: Subject;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  progressPct: number;
  tasks: Task[];
}

// ── Círculo de progreso SVG inline (sin librería extra) ─
function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const SIZE = 56;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const filled = (pct / 100) * CIRC;

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Track */}
      <View
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: "rgba(0,0,0,0.08)",
        }}
      />
      {/* Fill — usando border con rotación */}
      {pct > 0 && (
        <View
          style={{
            position: "absolute",
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: STROKE,
            borderColor: "transparent",
            borderTopColor: color,
            borderRightColor: pct >= 25 ? color : "transparent",
            borderBottomColor: pct >= 50 ? color : "transparent",
            borderLeftColor: pct >= 75 ? color : "transparent",
            transform: [{ rotate: "-90deg" }],
          }}
        />
      )}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: pct > 0 ? color : "#9CA3AF",
        }}
      >
        {pct}%
      </Text>
    </View>
  );
}

// ── Tarjeta de materia ─────────────────────────────────
function SubjectCardView({
  card,
  onPress,
}: {
  card: SubjectCard;
  onPress: () => void;
}) {
  const bg = bgFromColor(card.subject.color);
  const color = card.subject.color;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[s.card, { backgroundColor: bg }]}
    >
      <View style={s.cardTop}>
        <View style={s.cardInfo}>
          <Text style={[s.cardTitle, { color }]}>{card.subject.name}</Text>
          <Text style={[s.cardSub, { color }]}>
            {card.totalTasks} tarea{card.totalTasks !== 1 ? "s" : ""} ·{" "}
            {card.pendingTasks} pendiente{card.pendingTasks !== 1 ? "s" : ""}
          </Text>
        </View>
        <CircleProgress pct={card.progressPct} color={color} />
      </View>

      {/* Barra de progreso */}
      <View style={s.barTrack}>
        <View
          style={[
            s.barFill,
            {
              width: `${card.progressPct}%` as any,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── Modal editar materia ───────────────────────────────
function SubjectEditModal({
  card,
  visible,
  onClose,
  onSave,
  onDelete,
}: {
  card: SubjectCard | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  // Sincronizar campos cuando cambia la materia seleccionada
  useEffect(() => {
    if (card) {
      setName(card.subject.name);
      setColor(card.subject.color);
    }
  }, [card]);

  if (!card) return null;
  const previewBg = bgFromColor(color);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />

        {/* Header */}
        <View style={s.editHeader}>
          <Text style={s.editTitle}>Editar materia</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <MaterialIcons name="close" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Campo nombre */}
        <Text style={s.fieldLabel}>NOMBRE DE LA MATERIA</Text>
        <TextInput
          style={s.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Cálculo diferencial"
          placeholderTextColor="#9CA3AF"
        />

        {/* Selector de color */}
        <Text style={[s.fieldLabel, { marginTop: 20 }]}>COLOR</Text>
        <View style={s.paletteRow}>
          {PALETTE.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={[
                s.colorCircle,
                { backgroundColor: c },
                color === c && s.colorCircleSelected,
              ]}
            />
          ))}
        </View>

        {/* Preview */}
        <View style={[s.previewBox, { backgroundColor: previewBg }]}>
          <Text style={[s.previewName, { color }]}>
            {name || "Nombre de materia"}
          </Text>
          <Text style={[s.previewSub, { color }]}>Materia activa</Text>
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={s.saveBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (name.trim()) onSave(card.subject.id, name.trim(), color);
          }}
        >
          <Text style={s.saveBtnText}>Guardar materia</Text>
        </TouchableOpacity>

        {/* Botón eliminar */}
        <TouchableOpacity
          style={s.deleteBtn}
          activeOpacity={0.85}
          onPress={() => onDelete(card.subject.id)}
        >
          <Text style={s.deleteBtnText}>Eliminar materia</Text>
        </TouchableOpacity>

        <View style={{ height: 12 }} />
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════
// Pantalla principal
// ══════════════════════════════════════════════════════
export default function MateriasScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<SubjectCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [overrides, setOverrides] = useState<
    Record<string, { name: string; color: string }>
  >({});
  const [deleted, setDeleted] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  useEffect(() => {
    if (showNewModal) {
      setNewName("");
      setNewColor(PALETTE[0]);
    }
  }, [showNewModal]);

  useEffect(() => {
    fetchTasks(CURRENT_USER_ID).then(setTasks).catch(console.error);
  }, []);

  function handleAddSubject(name: string, color: string) {
    const id = `sub_new_${Date.now()}`;
    setTasks((prev) => [
      ...prev,
      {
        id: `tsk_placeholder_${id}`,
        title: "__placeholder__",
        subject: { id, name, color },
        priority: "baja",
        status: "completada",
        dueDate: new Date().toISOString(),
      } as any,
    ]);
    setShowNewModal(false);
  }

  function handleSave(id: string, name: string, color: string) {
    setOverrides((prev) => ({ ...prev, [id]: { name, color } }));
    setModalVisible(false);
  }

  function handleDelete(id: string) {
    setDeleted((prev) => [...prev, id]);
    setModalVisible(false);
  }

  // Construir cards agrupadas por materia (aplicando overrides y eliminaciones)
  const subjectCards: SubjectCard[] = useMemo(() => {
    const map = new Map<string, SubjectCard>();
    tasks
      .filter((t) => t.title !== "__placeholder__")
      .forEach((t) => {
        const ov = overrides[t.subject.id];
        const id = t.subject.id;
        const name = ov?.name ?? t.subject.name;
        const color = ov?.color ?? t.subject.color;
        if (!map.has(id)) {
          map.set(id, {
            subject: { id, name, color },
            totalTasks: 0,
            pendingTasks: 0,
            completedTasks: 0,
            progressPct: 0,
            tasks: [],
          });
        }
        const card = map.get(id)!;
        card.tasks.push(t);
        card.totalTasks += 1;
        if (t.status === "completada") card.completedTasks += 1;
        else card.pendingTasks += 1;
      });

    // Incluir materias nuevas (creadas localmente, sin tareas reales aún)
    tasks
      .filter((t) => t.title === "__placeholder__")
      .forEach((t) => {
        const { id, name, color } = t.subject;
        if (!map.has(id)) {
          map.set(id, {
            subject: { id, name, color },
            totalTasks: 0,
            pendingTasks: 0,
            completedTasks: 0,
            progressPct: 0,
            tasks: [],
          });
        }
      });

    // Calcular porcentaje
    map.forEach((card) => {
      card.progressPct =
        card.totalTasks > 0
          ? Math.round((card.completedTasks / card.totalTasks) * 100)
          : 0;
    });

    return Array.from(map.values()).filter(
      (c) => !deleted.includes(c.subject.id),
    );
  }, [tasks, overrides, deleted]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Text style={s.screenTitle}>Materias</Text>

        {subjectCards.map((card) => (
          <SubjectCardView
            key={card.subject.id}
            card={card}
            onPress={() => {
              setSelected(card);
              setModalVisible(true);
            }}
          />
        ))}

        {/* Botón nueva materia */}
        <TouchableOpacity
          style={s.newBtn}
          activeOpacity={0.7}
          onPress={() => setShowNewModal(true)}
        >
          <Text style={s.newBtnText}>+ Nueva materia</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => setShowNewModal(true)}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal editar materia */}
      <SubjectEditModal
        card={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Modal nueva materia — placeholder */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewModal(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setShowNewModal(false)}
        />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />

          {/* Header */}
          <View style={s.editHeader}>
            <Text style={s.editTitle}>Nueva materia</Text>
            <TouchableOpacity
              onPress={() => setShowNewModal(false)}
              style={s.closeBtn}
            >
              <MaterialIcons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Campo nombre */}
          <Text style={s.fieldLabel}>NOMBRE DE LA MATERIA</Text>
          <TextInput
            style={s.textInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Ej: Cálculo diferencial"
            placeholderTextColor="#9CA3AF"
          />

          {/* Selector de color */}
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>COLOR</Text>
          <View style={s.paletteRow}>
            {PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setNewColor(c)}
                style={[
                  s.colorCircle,
                  { backgroundColor: c },
                  newColor === c && s.colorCircleSelected,
                ]}
              />
            ))}
          </View>

          {/* Preview */}
          <View
            style={[s.previewBox, { backgroundColor: bgFromColor(newColor) }]}
          >
            <Text style={[s.previewName, { color: newColor }]}>
              {newName || "Nombre de materia"}
            </Text>
            <Text style={[s.previewSub, { color: newColor }]}>
              Materia activa
            </Text>
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[s.saveBtn, !newName.trim() && { opacity: 0.45 }]}
            activeOpacity={0.85}
            onPress={() => {
              if (!newName.trim()) return;
              handleAddSubject(newName.trim(), newColor);
            }}
          >
            <Text style={s.saveBtnText}>Guardar materia</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════
// Estilos
// ══════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F7FF" },
  scroll: { paddingHorizontal: 18, paddingTop: 12 },

  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e1b4b",
    marginBottom: 20,
  },

  // Card de materia
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    gap: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  cardSub: { fontSize: 13, fontWeight: "500", opacity: 0.75 },

  barTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 10 },

  // Botón nueva materia
  newBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    padding: 18,
    alignItems: "center",
    marginTop: 4,
  },
  newBtnText: { color: "#7C3AED", fontWeight: "600", fontSize: 15 },

  // FAB
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
    elevation: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Modal editar
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  editTitle: { fontSize: 20, fontWeight: "700", color: "#1e1b4b" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e1b4b",
    backgroundColor: "#fff",
  },

  paletteRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: "#1e1b4b",
    transform: [{ scale: 1.1 }],
  },

  previewBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 4,
  },
  previewName: { fontSize: 17, fontWeight: "700" },
  previewSub: { fontSize: 13, fontWeight: "500", opacity: 0.75 },

  saveBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  deleteBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  deleteBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 16 },

  // Misc
  strike: { textDecorationLine: "line-through", color: "#D1D5DB" },
  emptyBox: { alignItems: "center", paddingVertical: 28 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
