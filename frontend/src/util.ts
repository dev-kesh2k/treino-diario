export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m >= 60) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return s && m < 10 ? `${m}:${String(s).padStart(2, '0')} min` : `${m} min`;
}

export const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/** Dia local (YYYY-MM-DD). */
export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shiftDay(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

export function dayLabel(day: string) {
  const today = localDay();
  if (day === today) return 'Hoje';
  if (day === shiftDay(today, -1)) return 'Ontem';
  return new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const GOALS: Record<string, string> = {
  'perder-peso': 'Perder peso',
  'ganhar-massa': 'Ganhar massa',
  definicao: 'Definição',
  iniciante: 'Iniciante',
};

export const CATEGORIES: Record<string, string> = {
  superior: 'Superior',
  inferior: 'Inferior',
  core: 'Core',
  cardio: 'Cardio',
};

export const MEALS: Record<string, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
};

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export const firstName = (name: string) => name.split(' ')[0];

export const itemTarget = (mode: string, reps: number | null, seconds: number | null) =>
  mode === 'time' ? `${seconds} segundos` : `${reps} repetições`;
