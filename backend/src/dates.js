// Datas no fuso do app (sem banco: testáveis isoladamente).
export const TZ = process.env.TZ || 'America/Sao_Paulo';


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
