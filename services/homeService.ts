// ─────────────────────────────────────────────────────────────
// services/homeService.ts
//
// Capa de datos de la pantalla de inicio.
//
// HOW TO SWITCH TO REAL API
// ─────────────────────────
// 1. Cambia USE_MOCK a false  (o usa una variable de entorno).
// 2. Rellena BASE_URL con la URL de tu servidor.
// 3. Si tu token vive en AsyncStorage / SecureStore, impórtalo
//    aquí y añádelo al header Authorization.
// 4. Borra (o deja) el import de MOCK_HOME_DATA — ya no se usa.
// ─────────────────────────────────────────────────────────────

import { MOCK_HOME_DATA } from "@/mock/homeData";
import type { HomeData } from "@/types/home";

// ── configuración ─────────────────────────────────────
const USE_MOCK = true; // ← cambia a false cuando tengas API
const BASE_URL = "https://api.tu-servidor.com/v1"; // ← tu URL
const SIMULATED_DELAY_MS = 800; // simula latencia de red en mock

// ── función principal ──────────────────────────────────

/**
 * Obtiene todos los datos necesarios para renderizar la pantalla
 * de inicio: perfil de usuario, estadísticas, tareas urgentes,
 * próximas entregas y progreso por materia.
 *
 * @param userId  ID del usuario autenticado (se ignora en mock).
 * @returns       Promesa con HomeData.
 */
export async function fetchHomeData(userId: string): Promise<HomeData> {
  if (USE_MOCK) {
    return simulateFetch(MOCK_HOME_DATA);
  }

  // ── REAL API ─────────────────────────────────────────
  const token = await getAuthToken(); // implementa según tu auth

  const res = await fetch(`${BASE_URL}/home?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return (await res.json()) as HomeData;
}

// ── helpers internos ───────────────────────────────────

/** Devuelve datos mock tras un delay que simula la red. */
function simulateFetch<T>(data: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(data)), SIMULATED_DELAY_MS),
  );
}

/**
 * Recupera el token de autenticación.
 * Reemplaza el cuerpo con tu implementación real:
 *   - AsyncStorage.getItem("token")
 *   - SecureStore.getItemAsync("token")
 *   - tu contexto de Auth
 */
async function getAuthToken(): Promise<string> {
  // TODO: implementar con tu solución de auth
  return "REPLACE_WITH_REAL_TOKEN";
}

/** Error tipado para respuestas HTTP no exitosas. */
class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`API error ${status}: ${message}`);
    this.name = "ApiError";
  }
}
