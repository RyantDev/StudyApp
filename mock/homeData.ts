// ─────────────────────────────────────────────────────────────
// mock/homeData.ts
//
// Datos de ejemplo que imitan exactamente la forma que devolverá
// tu API real. Cuando conectes el servidor, este archivo deja de
// usarse: solo cambia homeService.ts para apuntar al endpoint.
// ─────────────────────────────────────────────────────────────

import type { HomeData } from "@/types/home";

export const MOCK_HOME_DATA: HomeData = {
  user: {
    id: "usr_001",
    name: "Ana García",
    avatarUrl: null,
    semester: "2026-1",
    university: "Universidad Virtual",
  },

  stats: {
    totalSubjects: 4,
    pendingTasks: 3,
    completedTasks: 2,
    weeklyProgressPct: 62,
  },

  urgentTask: {
    id: "tsk_001",
    title: "Parcial de Cálculo diferencial",
    subject: {
      id: "sub_001",
      name: "Cálculo",
      color: "#7C3AED",
    },
    priority: "alta",
    status: "en_proceso",
    dueDate: new Date(Date.now()).toISOString(), // hoy
  },

  upcomingTasks: [
    {
      id: "tsk_001",
      title: "Parcial de Cálculo diferencial",
      subject: { id: "sub_001", name: "Cálculo", color: "#7C3AED" },
      priority: "alta",
      status: "en_proceso",
      dueDate: new Date(Date.now()).toISOString(),
    },
    {
      id: "tsk_002",
      title: "Ensayo Historia universal",
      subject: { id: "sub_002", name: "Historia", color: "#10B981" },
      priority: "media",
      status: "pendiente",
      dueDate: new Date(Date.now() + 86_400_000).toISOString(), // mañana
    },
    {
      id: "tsk_003",
      title: "Informe laboratorio virtual",
      subject: { id: "sub_003", name: "Química", color: "#F59E0B" },
      priority: "alta",
      status: "pendiente",
      dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    },
    {
      id: "tsk_004",
      title: "Proyecto final base de datos",
      subject: { id: "sub_004", name: "Programación", color: "#3B82F6" },
      priority: "alta",
      status: "en_proceso",
      dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  ],

  subjectProgress: [
    { subjectId: "sub_001", name: "Cálculo diferencial",   color: "#7C3AED", progressPct: 45 },
    { subjectId: "sub_002", name: "Historia universal",    color: "#10B981", progressPct: 75 },
    { subjectId: "sub_003", name: "Química orgánica",      color: "#F59E0B", progressPct: 30 },
    { subjectId: "sub_004", name: "Programación avanzada", color: "#3B82F6", progressPct: 60 },
  ],
};
