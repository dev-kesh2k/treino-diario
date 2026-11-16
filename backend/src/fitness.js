import { prisma, dayKey, addDays, addMonths, daysBetween, weekday, streaks } from './db.js';

export { SECONDS_PER_REP, CATEGORIES, MEAL_TYPES, GOALS, LEVELS, itemSeconds, itemKcal, summarize } from './workout-calc.js';

export const itemInclude = { items: { orderBy: { position: 'asc' }, include: { exercise: true } } };

export async function latestWeight(userId) {
  const m = await prisma.bodyMeasurement.findFirst({
    where: { userId, weightKg: { not: null } },
    orderBy: [{ day: 'desc' }, { createdAt: 'desc' }],
  });
  return m?.weightKg ?? null;
}

/** Progresso (%) de cada inscrição ativa: sessões do programa / (semanas × sessões por semana). */
export async function programProgress(userId, programs) {
  if (!programs.length) return new Map();
  const counts = await prisma.workoutSession.groupBy({
    by: ['programId'],
    where: { userId, programId: { in: programs.map((p) => p.id) } },
    _count: { _all: true },
  });
  const byId = new Map(counts.map((c) => [c.programId, c._count._all]));
  return new Map(
    programs.map((p) => {
      const done = byId.get(p.id) || 0;
      const total = p.weeks * p.sessionsPerWeek;
      return [p.id, { done, total, percent: Math.min(100, Math.round((done / total) * 100)) }];
    }),
  );
}

export async function trainingDays(userId) {
  const rows = await prisma.workoutSession.findMany({ where: { userId }, select: { day: true }, distinct: ['day'] });
  return new Set(rows.map((r) => r.day));
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Janela do relatório: semana (seg–dom), mês ou ano, deslocada por offset. */
export function rangeWindow(range, offset, today = dayKey()) {
  if (range === 'month') {
    const start = addMonths(today.slice(0, 7) + '-01', offset);
    const end = addDays(addMonths(start, 1), -1);
    return { start, end, label: `${MONTHS[Number(start.slice(5, 7)) - 1]} ${start.slice(0, 4)}` };
  }
  if (range === 'year') {
    const year = Number(today.slice(0, 4)) + offset;
    return { start: `${year}-01-01`, end: `${year}-12-31`, label: String(year) };
  }
  const monday = addDays(today, -((weekday(today) + 6) % 7) + offset * 7);
  const end = addDays(monday, 6);
  return { start: monday, end, label: `${fmt(monday)} – ${fmt(end)}/${end.slice(0, 4)}` };
}

export async function progressReport(user, range, offset) {
  const today = dayKey();
  const { start, end, label } = rangeWindow(range, offset, today);
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id, day: { gte: start, lte: end } },
    select: { day: true, kcal: true, durationSec: true },
  });
  const summary = {
    workouts: sessions.length,
    kcal: sessions.reduce((s, x) => s + x.kcal, 0),
    minutes: Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60),
  };

  let series;
  if (range === 'year') {
    series = MONTHS.map((m, i) => {
      const prefix = `${start.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`;
      const list = sessions.filter((s) => s.day.startsWith(prefix));
      return { key: prefix, label: m, kcal: list.reduce((s, x) => s + x.kcal, 0), workouts: list.length };
    });
  } else {
    series = daysBetween(start, end).map((d) => {
      const list = sessions.filter((s) => s.day === d);
      return {
        key: d,
        label: range === 'week' ? fmt(d) : String(Number(d.slice(8, 10))),
        kcal: list.reduce((s, x) => s + x.kcal, 0),
        workouts: list.length,
        future: d > today,
      };
    });
  }

  const weights = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id, day: { gte: start, lte: end }, weightKg: { not: null } },
    orderBy: [{ day: 'asc' }, { createdAt: 'asc' }],
    select: { day: true, weightKg: true },
  });
  // Um ponto por dia (a última pesagem do dia).
  const perDay = new Map();
  for (const w of weights) perDay.set(w.day, w.weightKg);
  const weightSeries = [...perDay].map(([day, weightKg]) => ({ day, label: fmt(day), weightKg }));
  const weightDelta = weightSeries.length > 1 ? +(weightSeries.at(-1).weightKg - weightSeries[0].weightKg).toFixed(1) : null;

  return { range, offset, label, start, end, summary, series, weightSeries, weightDelta, currentWeight: await latestWeight(user.id) };
}

export async function achievements(user) {
  const [agg, days, waterDays, weighIns, enrollments] = await Promise.all([
    prisma.workoutSession.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { kcal: true, durationSec: true },
    }),
    trainingDays(user.id),
    prisma.waterLog.groupBy({ by: ['day'], where: { userId: user.id }, _sum: { ml: true } }),
    prisma.bodyMeasurement.count({ where: { userId: user.id } }),
    prisma.enrollment.findMany({ where: { userId: user.id }, include: { program: true } }),
  ]);
  const total = agg._count._all;
  const kcal = agg._sum.kcal || 0;
  const minutes = Math.round((agg._sum.durationSec || 0) / 60);
  const { current, longest } = streaks(days);
  const waterHit = waterDays.filter((d) => (d._sum.ml || 0) >= user.waterGoalMl).length;
  const progress = await programProgress(user.id, enrollments.map((e) => e.program));
  const programsDone = [...progress.values()].filter((p) => p.percent >= 100).length;

  const badge = (key, title, description, value, target, icon, color) => ({
    key,
    title,
    description,
    icon,
    color,
    value: Math.min(value, target),
    target,
    earned: value >= target,
  });
  const badges = [
    badge('first', 'Primeiro Treino', 'Conclua seu primeiro treino', total, 1, 'dumbbell', 'violet'),
    badge('streak3', '3 Dias Seguidos', 'Treine 3 dias seguidos', longest, 3, 'flame', 'amber'),
    badge('streak7', '7 Dias Seguidos', 'Treine 7 dias seguidos', longest, 7, 'flame', 'orange'),
    badge('kcal1000', '1000 Calorias', 'Queime 1.000 kcal treinando', kcal, 1000, 'zap', 'rose'),
    badge('w10', '10 Treinos', 'Conclua 10 treinos', total, 10, 'medal', 'sky'),
    badge('w50', '50 Treinos', 'Conclua 50 treinos', total, 50, 'trophy', 'yellow'),
    badge('h10', '10 Horas', 'Acumule 10 horas de treino', minutes, 600, 'timer', 'emerald'),
    badge('water', 'Hidratado', 'Bata a meta de água em 5 dias', waterHit, 5, 'droplet', 'cyan'),
    badge('weigh', 'De Olho no Corpo', 'Registre 5 medições corporais', weighIns, 5, 'scale', 'teal'),
    badge('program', 'Programa Concluído', 'Complete um programa inteiro', programsDone, 1, 'award', 'fuchsia'),
  ];
  return {
    badges,
    stats: { totalWorkouts: total, totalKcal: kcal, totalMinutes: minutes, currentStreak: current, longestStreak: longest },
  };
}
