// ─────────────────────────────────────────────────────────────
// types/home.ts
//
// Contratos de datos compartidos entre el mock, el service
// y los componentes de la pantalla de inicio.
// ─────────────────────────────────────────────────────────────

export type Priority = "alta" | "media" | "baja";
export type TaskStatus = "pendiente" | "en_proceso" | "completada";

export interface Subject {
  id: string;
  name: string;
  color: string; // hex, ej. "#7C3AED"
}

export interface Task {
  id: string;
  title: string;
  subject: Subject;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // ISO 8601
}

export interface SubjectProgress {
  subjectId: string;
  name: string;
  color: string;
  progressPct: number; // 0–100
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  semester: string;
  university: string;
}

export interface HomeStats {
  totalSubjects: number;
  pendingTasks: number;
  completedTasks: number;
  weeklyProgressPct: number; // 0–100
}

/** Estructura completa que devuelve el endpoint GET /home */
export interface HomeData {
  user: UserProfile;
  stats: HomeStats;
  urgentTask: Task | null;
  upcomingTasks: Task[];
  subjectProgress: SubjectProgress[];
}
