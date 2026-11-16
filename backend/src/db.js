import { PrismaClient } from '@prisma/client';

// O Postgres do Hub é compartilhado (max_connections baixo): limita o pool deste app.
function dbUrl() {
  const raw = process.env.DATABASE_URL || '';
  try {
    const u = new URL(raw);
    // O Hub injeta connection_limit=10; com vários apps isso estoura o max_connections. Usa o menor.
    const max = Number(process.env.DB_POOL_SIZE) || 3;
    const current = Number(u.searchParams.get('connection_limit')) || Infinity;
    u.searchParams.set('connection_limit', String(Math.min(current, max)));
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma = new PrismaClient({ datasources: { db: { url: dbUrl() } } });

export const TZ = process.env.TZ || 'America/Sao_Paulo';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Dia (YYYY-MM-DD) no fuso do app. */
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

// Aritmética de datas sobre a chave do dia (sempre em UTC, sem efeito de fuso).
const toUtc = (day) => new Date(`${day}T00:00:00Z`);
const fromUtc = (d) => d.toISOString().slice(0, 10);
export const addDays = (day, n) => fromUtc(new Date(toUtc(day).getTime() + n * 86400000));
export const weekday = (day) => toUtc(day).getUTCDay(); // 0 = domingo

export function addMonths(day, n) {
  const d = toUtc(day);
  return fromUtc(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)));
}

export function daysBetween(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Sequência de dias consecutivos com treino (atual e a maior). */
export function streaks(daysSet, today = dayKey()) {
  const sorted = [...daysSet].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let current = 0;
  let cursor = daysSet.has(today) ? today : addDays(today, -1);
  while (daysSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}
