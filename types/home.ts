// types/home.ts

export type Priority   = "alta" | "media" | "baja";
export type TaskStatus = "pendiente" | "en_proceso" | "completada";

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  subject: Subject;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;   // ISO 8601
  notes?: string;
}

export interface SubjectProgress {
  subjectId: string;
  name: string;
  color: string;
  progressPct: number;
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
  weeklyProgressPct: number;
}

export interface HomeData {
  user: UserProfile;
  stats: HomeStats;
  urgentTask: Task | null;
  upcomingTasks: Task[];
  subjectProgress: SubjectProgress[];
}