// ─────────────────────────────────────────────────────────────
// mock/tasksData.ts
//
// Mock completo de tareas para la pantalla Mis Tareas.
// Reemplaza fetchTasks() en tasksService.ts cuando tengas API.
// ─────────────────────────────────────────────────────────────

import type { Task } from "@/types/home";

export const MOCK_TASKS: Task[] = [
  {
    id: "tsk_001",
    title: "Parcial de Cálculo diferencial",
    subject: { id: "sub_001", name: "Cálculo diferencial", color: "#7C3AED" },
    priority: "alta",
    status: "en_proceso",
    dueDate: new Date(Date.now()).toISOString(),
    notes: "Capítulos 3 al 6",
  },
  {
    id: "tsk_002",
    title: "Ensayo Historia universal",
    subject: { id: "sub_002", name: "Historia universal", color: "#10B981" },
    priority: "media",
    status: "pendiente",
    dueDate: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    notes: "",
  },
  {
    id: "tsk_003",
    title: "Informe laboratorio virtual",
    subject: { id: "sub_003", name: "Química orgánica", color: "#F59E0B" },
    priority: "alta",
    status: "pendiente",
    dueDate: new Date(Date.now() + 86_400_000).toISOString(),
    notes: "Adjuntar resultados",
  },
  {
    id: "tsk_004",
    title: "Quiz de programación",
    subject: { id: "sub_004", name: "Programación avanzada", color: "#3B82F6" },
    priority: "baja",
    status: "completada",
    dueDate: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    notes: "",
  },
  {
    id: "tsk_005",
    title: "Lectura obligatoria cap. 7",
    subject: { id: "sub_002", name: "Historia universal", color: "#10B981" },
    priority: "baja",
    status: "completada",
    dueDate: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    notes: "",
  },
  {
    id: "tsk_006",
    title: "Proyecto final base de datos",
    subject: { id: "sub_004", name: "Programación avanzada", color: "#3B82F6" },
    priority: "alta",
    status: "en_proceso",
    dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    notes: "Trabajo grupal — 3 personas",
  },
];
