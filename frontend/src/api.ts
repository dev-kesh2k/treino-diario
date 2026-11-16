import { useCallback, useEffect, useState } from 'react';

const BASE = `${import.meta.env.BASE_URL}api`;
const TOKEN_KEY = 'treino-diario:token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data.error || `Erro ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b: unknown = {}) => request<T>('POST', p, b),
  put: <T>(p: string, b: unknown) => request<T>('PUT', p, b),
  del: <T>(p: string, b?: unknown) => request<T>('DELETE', p, b),
};

/** Carrega um recurso da API; `reload` busca de novo sem piscar a tela. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api.get<T>(path));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

// ---------- Tipos ----------
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  gender: string;
  birthYear: number | null;
  heightCm: number | null;
  goalWeightKg: number | null;
  calorieGoal: number;
  burnGoal: number;
  waterGoalMl: number;
  stepsGoal: number;
  weeklyGoal: number;
  carbsPct: number;
  proteinPct: number;
  fatPct: number;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'superior' | 'inferior' | 'core' | 'cardio';
  muscle: string;
  mode: 'reps' | 'time';
  reps: number;
  seconds: number;
  kcalPerMin: number;
  instructions: string;
  icon: string;
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export interface ProgramSummary {
  id: string;
  name: string;
  goal: string;
  level: string;
  weeks: number;
  sessionsPerWeek: number;
  description: string;
  color: string;
  workoutsCount: number;
  enrolled: boolean;
  progress: Progress | null;
}

export interface WorkoutSummary {
  id: string;
  name: string;
  level: string;
  program?: string | null;
  mine?: boolean;
  favorite?: boolean;
  exercises: number;
  minutes: number;
  kcal: number;
}

export interface WorkoutItem {
  id: string;
  position: number;
  reps: number | null;
  seconds: number | null;
  kcal: number;
  exercise: Exercise;
}

export interface WorkoutDetail extends Omit<WorkoutSummary, 'program'> {
  description: string;
  restSeconds: number;
  programId: string | null;
  ownerId: string | null;
  program: { id: string; name: string } | null;
  editable: boolean;
  inActiveProgram: boolean;
  items: WorkoutItem[];
}

export interface Session {
  id: string;
  workoutId: string | null;
  name: string;
  day: string;
  durationSec: number;
  kcal: number;
  exercisesDone: number;
  exercisesTotal: number;
  createdAt: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  minutes: number;
}
