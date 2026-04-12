// ─────────────────────────────────────────────────────────────
// services/tasksService.ts
//
// HOW TO SWITCH TO REAL API:
// 1. Cambia USE_MOCK a false
// 2. Rellena BASE_URL
// 3. Implementa getAuthToken()
// ─────────────────────────────────────────────────────────────

import type { Task } from "@/types/home";
import { MOCK_TASKS } from "@/mock/tasksData";

const USE_MOCK     = true;
const BASE_URL     = "https://api.tu-servidor.com/v1";
const DELAY_MS     = 600;

export async function fetchTasks(userId: string): Promise<Task[]> {
  if (USE_MOCK) return simulateFetch(MOCK_TASKS);

  const token = await getAuthToken();
  const res   = await fetch(`${BASE_URL}/tasks?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

function simulateFetch<T>(data: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(data)), DELAY_MS)
  );
}

async function getAuthToken(): Promise<string> {
  return "REPLACE_WITH_REAL_TOKEN";
}