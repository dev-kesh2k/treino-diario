import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, HttpError, dayKey, isDay, streaks } from './db.js';
import { publicUser, requireAdmin, requireAuth, signToken } from './auth.js';
import {
  CATEGORIES,
  GOALS,
  LEVELS,
  MEAL_TYPES,
  achievements,
  itemInclude,
  itemKcal,
  latestWeight,
  programProgress,
  progressReport,
  summarize,
  trainingDays,
} from './fitness.js';

export const api = Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Número validado; `optional` aceita vazio (null). */
function num(v, label, min, max, { optional = false, int = false } = {}) {
  if (v === undefined || v === null || v === '') {
    if (optional) return null;
    throw new HttpError(400, `Informe ${label}`);
  }
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `${label} deve estar entre ${min} e ${max}`);
  return int ? Math.round(n) : Math.round(n * 10) / 10;
}

function pick(value, list, label) {
  if (!list.includes(value)) throw new HttpError(400, `${label} inválido`);
  return value;
}

const dayParam = (v) => {
  if (v === undefined || v === '') return dayKey();
  if (!isDay(v)) throw new HttpError(400, 'Data inválida');
  return v;
};

api.get('/health', wrap(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: true });
}));

// ---------- Autenticação ----------
const attempts = new Map();
function checkRate(key) {
  const a = attempts.get(key) || { n: 0, until: 0 };
  if (a.until > Date.now()) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
  return a;
}

api.post('/auth/register', wrap(async (req, res) => {
  const name = str(req.body?.name, 80);
  const email = str(req.body?.email, 160).toLowerCase();
  const password = String(req.body?.password ?? '');
  if (name.length < 2) throw new HttpError(400, 'Informe seu nome');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail inválido');
  if (password.length < 8) throw new HttpError(400, 'A senha precisa ter pelo menos 8 caracteres');
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'Este e-mail já está cadastrado');
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

api.post('/auth/login', wrap(async (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase();
  const password = String(req.body?.password ?? '');
  const key = `${req.ip}|${email}`;
  const a = checkRate(key);
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    a.n += 1;
    if (a.n >= 5) Object.assign(a, { n: 0, until: Date.now() + 5 * 60000 });
    attempts.set(key, a);
    throw new HttpError(401, 'E-mail ou senha incorretos');
  }
  attempts.delete(key);
  res.json({ token: signToken(user), user: publicUser(user) });
}));

api.use(requireAuth);

// ---------- Conta ----------
api.get('/me', (req, res) => res.json({ user: publicUser(req.user) }));

api.put('/me', wrap(async (req, res) => {
  const b = req.body || {};
  const data = {};
  if (b.name !== undefined) {
    data.name = str(b.name, 80);
    if (data.name.length < 2) throw new HttpError(400, 'Informe seu nome');
  }
  if (b.email !== undefined) {
    data.email = str(b.email, 160).toLowerCase();
    if (!EMAIL_RE.test(data.email)) throw new HttpError(400, 'E-mail inválido');
    const other = await prisma.user.findUnique({ where: { email: data.email } });
    if (other && other.id !== req.user.id) throw new HttpError(409, 'Este e-mail já está em uso');
  }
  if (b.gender !== undefined) data.gender = ['', 'M', 'F', 'O'].includes(b.gender) ? b.gender : '';
  if (b.birthYear !== undefined) data.birthYear = num(b.birthYear, 'o ano de nascimento', 1900, new Date().getFullYear(), { optional: true, int: true });
  if (b.heightCm !== undefined) data.heightCm = num(b.heightCm, 'a altura (cm)', 80, 250, { optional: true });
  if (b.goalWeightKg !== undefined) data.goalWeightKg = num(b.goalWeightKg, 'o peso meta', 25, 350, { optional: true });
  if (b.calorieGoal !== undefined) data.calorieGoal = num(b.calorieGoal, 'a meta de calorias', 800, 6000, { int: true });
  if (b.burnGoal !== undefined) data.burnGoal = num(b.burnGoal, 'a meta de queima', 50, 3000, { int: true });
  if (b.waterGoalMl !== undefined) data.waterGoalMl = num(b.waterGoalMl, 'a meta de água', 500, 8000, { int: true });
  if (b.stepsGoal !== undefined) data.stepsGoal = num(b.stepsGoal, 'a meta de passos', 1000, 50000, { int: true });
  if (b.weeklyGoal !== undefined) data.weeklyGoal = num(b.weeklyGoal, 'a meta semanal', 1, 14, { int: true });
  if (b.carbsPct !== undefined || b.proteinPct !== undefined || b.fatPct !== undefined) {
    const c = num(b.carbsPct ?? req.user.carbsPct, 'carboidratos (%)', 0, 100, { int: true });
    const p = num(b.proteinPct ?? req.user.proteinPct, 'proteínas (%)', 0, 100, { int: true });
    const f = num(b.fatPct ?? req.user.fatPct, 'gorduras (%)', 0, 100, { int: true });
    if (c + p + f !== 100) throw new HttpError(400, 'A soma dos macronutrientes deve ser 100%');
    Object.assign(data, { carbsPct: c, proteinPct: p, fatPct: f });
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: publicUser(user) });
}));

api.put('/me/password', wrap(async (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const next = String(req.body?.newPassword ?? '');
  if (!(await bcrypt.compare(current, req.user.passwordHash))) throw new HttpError(400, 'Senha atual incorreta');
  if (next.length < 8) throw new HttpError(400, 'A nova senha precisa ter pelo menos 8 caracteres');
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  res.json({ ok: true });
}));

api.delete('/me', wrap(async (req, res) => {
  if (!(await bcrypt.compare(String(req.body?.password ?? ''), req.user.passwordHash))) throw new HttpError(400, 'Senha incorreta');
  if (req.user.role === 'admin' && (await prisma.user.count({ where: { role: 'admin' } })) <= 1) {
    throw new HttpError(400, 'Você é o único administrador; a conta não pode ser excluída');
  }
  await prisma.user.delete({ where: { id: req.user.id } });
  res.json({ ok: true });
}));

// ---------- Início ----------
api.get('/dashboard', wrap(async (req, res) => {
  const user = req.user;
  const today = dayKey();
  const [todaySessions, log, enrollment, lastSession, articles, days, weight] = await Promise.all([
    prisma.workoutSession.findMany({ where: { userId: user.id, day: today } }),
    prisma.dailyLog.findUnique({ where: { userId_day: { userId: user.id, day: today } } }),
    prisma.enrollment.findFirst({
      where: { userId: user.id, active: true },
      orderBy: { startedAt: 'desc' },
      include: { program: { include: { workouts: { orderBy: { sort: 'asc' }, include: itemInclude } } } },
    }),
    prisma.workoutSession.findFirst({ where: { userId: user.id, workoutId: { not: null } }, orderBy: { createdAt: 'desc' } }),
    prisma.article.findMany({ orderBy: { createdAt: 'asc' }, take: 3 }),
    trainingDays(user.id),
    latestWeight(user.id),
  ]);

  let activeProgram = null;
  let next = null;
  if (enrollment) {
    const p = enrollment.program;
    const progress = (await programProgress(user.id, [p])).get(p.id);
    activeProgram = { id: p.id, name: p.name, weeks: p.weeks, level: p.level, color: p.color, progress };
    // Próximo treino do programa: gira pela lista conforme as sessões feitas.
    if (p.workouts.length) next = p.workouts[progress.done % p.workouts.length];
  }
  if (!next && lastSession) {
    next = await prisma.workout.findUnique({ where: { id: lastSession.workoutId }, include: itemInclude });
  }
  if (!next) next = await prisma.workout.findFirst({ where: { ownerId: null }, orderBy: { sort: 'asc' }, include: itemInclude });

  const weekStart = (() => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  })();
  const weekCount = await prisma.workoutSession.count({ where: { userId: user.id, day: { gte: weekStart } } });

  res.json({
    today: {
      day: today,
      burned: todaySessions.reduce((s, x) => s + x.kcal, 0),
      burnGoal: user.burnGoal,
      steps: log?.steps || 0,
      stepsGoal: user.stepsGoal,
      activeMinutes: Math.round(todaySessions.reduce((s, x) => s + x.durationSec, 0) / 60),
      sessions: todaySessions.length,
    },
    week: { done: weekCount, goal: user.weeklyGoal },
    streak: streaks(days, today).current,
    activeProgram,
    next: next ? { id: next.id, name: next.name, ...summarize(next, weight) } : null,
    articles: articles.map(({ body, ...a }) => a),
  });
}));

api.put('/days/:day/steps', wrap(async (req, res) => {
  const day = dayParam(req.params.day);
  const steps = num(req.body?.steps, 'os passos', 0, 200000, { int: true });
  const log = await prisma.dailyLog.upsert({
    where: { userId_day: { userId: req.user.id, day } },
    update: { steps },
    create: { userId: req.user.id, day, steps },
  });
  res.json({ day: log.day, steps: log.steps });
}));

// ---------- Programas ----------
api.get('/programs', wrap(async (req, res) => {
  const goal = str(req.query.goal);
  const q = str(req.query.q);
  const programs = await prisma.program.findMany({
    where: {
      ...(GOALS.includes(goal) ? { goal } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { sort: 'asc' },
    include: { _count: { select: { workouts: true } }, enrollments: { where: { userId: req.user.id } } },
  });
  const progress = await programProgress(req.user.id, programs);
  res.json({
    programs: programs.map(({ enrollments, _count, ...p }) => ({
      ...p,
      workoutsCount: _count.workouts,
      enrolled: !!enrollments[0]?.active,
      progress: enrollments[0] ? progress.get(p.id) : null,
    })),
  });
}));

api.get('/programs/:id', wrap(async (req, res) => {
  const p = await prisma.program.findUnique({
    where: { id: req.params.id },
    include: {
      workouts: { orderBy: { sort: 'asc' }, include: itemInclude },
      enrollments: { where: { userId: req.user.id } },
    },
  });
  if (!p) throw new HttpError(404, 'Programa não encontrado');
  const weight = await latestWeight(req.user.id);
  const { enrollments, workouts, ...rest } = p;
  res.json({
    program: {
      ...rest,
      enrolled: !!enrollments[0]?.active,
      progress: enrollments[0] ? (await programProgress(req.user.id, [p])).get(p.id) : null,
      workouts: workouts.map((w) => ({ id: w.id, name: w.name, level: w.level, ...summarize(w, weight) })),
    },
  });
}));

api.post('/programs/:id/enroll', wrap(async (req, res) => {
  const program = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!program) throw new HttpError(404, 'Programa não encontrado');
  // Um programa ativo por vez.
  await prisma.enrollment.updateMany({ where: { userId: req.user.id, programId: { not: program.id } }, data: { active: false } });
  await prisma.enrollment.upsert({
    where: { userId_programId: { userId: req.user.id, programId: program.id } },
    update: { active: true },
    create: { userId: req.user.id, programId: program.id },
  });
  res.json({ ok: true });
}));

api.delete('/programs/:id/enroll', wrap(async (req, res) => {
  await prisma.enrollment.updateMany({ where: { userId: req.user.id, programId: req.params.id }, data: { active: false } });
  res.json({ ok: true });
}));

// ---------- Exercícios ----------
api.get('/exercises', wrap(async (req, res) => {
  const category = str(req.query.category);
  const q = str(req.query.q);
  const exercises = await prisma.exercise.findMany({
    where: {
      ...(CATEGORIES.includes(category) ? { category } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { muscle: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    orderBy: { name: 'asc' },
  });
  res.json({ exercises });
}));

function exerciseData(b) {
  const mode = pick(b.mode, ['reps', 'time'], 'Tipo');
  return {
    name: (() => {
      const n = str(b.name, 80);
      if (n.length < 2) throw new HttpError(400, 'Informe o nome do exercício');
      return n;
    })(),
    category: pick(b.category, CATEGORIES, 'Categoria'),
    muscle: str(b.muscle, 80),
    mode,
    reps: num(b.reps ?? 12, 'as repetições', 1, 200, { int: true }),
    seconds: num(b.seconds ?? 30, 'os segundos', 5, 1800, { int: true }),
    kcalPerMin: num(b.kcalPerMin ?? 6, 'kcal por minuto', 1, 25),
    instructions: str(b.instructions, 2000),
    icon: str(b.icon, 30) || 'dumbbell',
  };
}

api.post('/exercises', requireAdmin, wrap(async (req, res) => {
  res.status(201).json({ exercise: await prisma.exercise.create({ data: exerciseData(req.body || {}) }) });
}));

api.put('/exercises/:id', requireAdmin, wrap(async (req, res) => {
  res.json({ exercise: await prisma.exercise.update({ where: { id: req.params.id }, data: exerciseData(req.body || {}) }) });
}));

api.delete('/exercises/:id', requireAdmin, wrap(async (req, res) => {
  const used = await prisma.workoutItem.count({ where: { exerciseId: req.params.id } });
  if (used) throw new HttpError(409, `Exercício usado em ${used} treino(s); remova-o dos treinos antes`);
  await prisma.exercise.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ---------- Treinos ----------
const canSee = (w, user) => !w.ownerId || w.ownerId === user.id;
const canEdit = (w, user) => (w.ownerId ? w.ownerId === user.id : user.role === 'admin');

api.get('/workouts', wrap(async (req, res) => {
  const scope = str(req.query.scope) || 'all';
  const q = str(req.query.q);
  const where = {
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    ...(scope === 'mine'
      ? { ownerId: req.user.id }
      : scope === 'favorites'
        ? { favorites: { some: { userId: req.user.id } }, OR: [{ ownerId: null }, { ownerId: req.user.id }] }
        : { OR: [{ ownerId: null }, { ownerId: req.user.id }] }),
  };
  const [workouts, favs, weight] = await Promise.all([
    prisma.workout.findMany({ where, orderBy: [{ ownerId: 'desc' }, { sort: 'asc' }, { name: 'asc' }], include: { ...itemInclude, program: true } }),
    prisma.favorite.findMany({ where: { userId: req.user.id } }),
    latestWeight(req.user.id),
  ]);
  const favSet = new Set(favs.map((f) => f.workoutId));
  res.json({
    workouts: workouts.map((w) => ({
      id: w.id,
      name: w.name,
      level: w.level,
      program: w.program?.name || null,
      mine: w.ownerId === req.user.id,
      favorite: favSet.has(w.id),
      ...summarize(w, weight),
    })),
  });
}));

api.get('/workouts/:id', wrap(async (req, res) => {
  const w = await prisma.workout.findUnique({ where: { id: req.params.id }, include: { ...itemInclude, program: true } });
  if (!w || !canSee(w, req.user)) throw new HttpError(404, 'Treino não encontrado');
  const [fav, weight, enrolled] = await Promise.all([
    prisma.favorite.findUnique({ where: { userId_workoutId: { userId: req.user.id, workoutId: w.id } } }),
    latestWeight(req.user.id),
    w.programId ? prisma.enrollment.findFirst({ where: { userId: req.user.id, programId: w.programId, active: true } }) : null,
  ]);
  res.json({
    workout: {
      ...w,
      favorite: !!fav,
      mine: w.ownerId === req.user.id,
      editable: canEdit(w, req.user),
      inActiveProgram: !!enrolled,
      ...summarize(w, weight),
      items: w.items.map((i) => ({ ...i, kcal: Math.round(itemKcal(i, weight) * 10) / 10 })),
    },
  });
}));

async function workoutData(b, user) {
  const name = str(b.name, 80);
  if (name.length < 2) throw new HttpError(400, 'Informe o nome do treino');
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) throw new HttpError(400, 'Adicione pelo menos um exercício');
  if (items.length > 40) throw new HttpError(400, 'Máximo de 40 exercícios por treino');
  const ids = [...new Set(items.map((i) => String(i.exerciseId)))];
  const found = await prisma.exercise.findMany({ where: { id: { in: ids } } });
  if (found.length !== ids.length) throw new HttpError(400, 'Exercício inválido na lista');
  const byId = new Map(found.map((e) => [e.id, e]));
  let programId = null;
  if (user.role === 'admin' && b.global && b.programId) {
    if (!(await prisma.program.findUnique({ where: { id: String(b.programId) } }))) throw new HttpError(400, 'Programa inválido');
    programId = String(b.programId);
  }
  return {
    base: {
      name,
      description: str(b.description, 600),
      level: LEVELS.includes(b.level) ? b.level : 'Intermediário',
      restSeconds: num(b.restSeconds ?? 20, 'o descanso', 0, 300, { int: true }),
      programId,
    },
    items: items.map((i, position) => {
      const ex = byId.get(String(i.exerciseId));
      return {
        exerciseId: ex.id,
        position,
        reps: ex.mode === 'reps' ? num(i.reps ?? ex.reps, 'as repetições', 1, 200, { int: true }) : null,
        seconds: ex.mode === 'time' ? num(i.seconds ?? ex.seconds, 'os segundos', 5, 1800, { int: true }) : null,
      };
    }),
  };
}

api.post('/workouts', wrap(async (req, res) => {
  const { base, items } = await workoutData(req.body || {}, req.user);
  const global = req.user.role === 'admin' && !!req.body?.global;
  const w = await prisma.workout.create({
    data: { ...base, ownerId: global ? null : req.user.id, items: { create: items } },
  });
  res.status(201).json({ workout: { id: w.id } });
}));

api.put('/workouts/:id', wrap(async (req, res) => {
  const w = await prisma.workout.findUnique({ where: { id: req.params.id } });
  if (!w || !canSee(w, req.user)) throw new HttpError(404, 'Treino não encontrado');
  if (!canEdit(w, req.user)) throw new HttpError(403, 'Você não pode editar este treino');
  const { base, items } = await workoutData({ ...req.body, global: !w.ownerId }, req.user);
  if (w.ownerId) base.programId = null;
  await prisma.$transaction([
    prisma.workoutItem.deleteMany({ where: { workoutId: w.id } }),
    prisma.workout.update({ where: { id: w.id }, data: { ...base, items: { create: items } } }),
  ]);
  res.json({ workout: { id: w.id } });
}));

api.delete('/workouts/:id', wrap(async (req, res) => {
  const w = await prisma.workout.findUnique({ where: { id: req.params.id } });
  if (!w || !canSee(w, req.user)) throw new HttpError(404, 'Treino não encontrado');
  if (!canEdit(w, req.user)) throw new HttpError(403, 'Você não pode excluir este treino');
  await prisma.workout.delete({ where: { id: w.id } });
  res.json({ ok: true });
}));

api.post('/workouts/:id/favorite', wrap(async (req, res) => {
  const w = await prisma.workout.findUnique({ where: { id: req.params.id } });
  if (!w || !canSee(w, req.user)) throw new HttpError(404, 'Treino não encontrado');
  await prisma.favorite.upsert({
    where: { userId_workoutId: { userId: req.user.id, workoutId: w.id } },
    update: {},
    create: { userId: req.user.id, workoutId: w.id },
  });
  res.json({ favorite: true });
}));

api.delete('/workouts/:id/favorite', wrap(async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, workoutId: req.params.id } });
  res.json({ favorite: false });
}));

// ---------- Sessões de treino ----------
api.post('/sessions', wrap(async (req, res) => {
  const w = await prisma.workout.findUnique({ where: { id: String(req.body?.workoutId || '') }, include: itemInclude });
  if (!w || !canSee(w, req.user)) throw new HttpError(404, 'Treino não encontrado');
  const durationSec = num(req.body?.durationSec, 'a duração', 10, 6 * 3600, { int: true });
  const done = num(req.body?.exercisesDone, 'os exercícios concluídos', 1, w.items.length, { int: true });
  const weight = await latestWeight(req.user.id);
  const kcal = Math.round(w.items.slice(0, done).reduce((s, i) => s + itemKcal(i, weight), 0));
  let programId = null;
  if (w.programId) {
    const e = await prisma.enrollment.findFirst({ where: { userId: req.user.id, programId: w.programId, active: true } });
    if (e) programId = w.programId;
  }
  const session = await prisma.workoutSession.create({
    data: {
      userId: req.user.id,
      workoutId: w.id,
      programId,
      name: w.name,
      day: dayKey(),
      durationSec,
      kcal,
      exercisesDone: done,
      exercisesTotal: w.items.length,
    },
  });
  res.status(201).json({ session });
}));

api.get('/sessions', wrap(async (req, res) => {
  const take = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take,
  });
  res.json({ sessions });
}));

api.delete('/sessions/:id', wrap(async (req, res) => {
  const r = await prisma.workoutSession.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!r.count) throw new HttpError(404, 'Sessão não encontrada');
  res.json({ ok: true });
}));

// ---------- Progresso e conquistas ----------
api.get('/progress', wrap(async (req, res) => {
  const range = ['week', 'month', 'year'].includes(req.query.range) ? req.query.range : 'week';
  const offset = Math.max(-520, Math.min(0, Math.round(Number(req.query.offset) || 0)));
  res.json(await progressReport(req.user, range, offset));
}));

api.get('/achievements', wrap(async (req, res) => res.json(await achievements(req.user))));

// ---------- Nutrição ----------
api.get('/nutrition', wrap(async (req, res) => {
  const day = dayParam(req.query.day);
  const user = req.user;
  const [meals, water] = await Promise.all([
    prisma.meal.findMany({ where: { userId: user.id, day }, orderBy: { createdAt: 'asc' } }),
    prisma.waterLog.findMany({ where: { userId: user.id, day }, orderBy: { createdAt: 'asc' } }),
  ]);
  const sum = (k) => Math.round(meals.reduce((s, m) => s + m[k], 0) * 10) / 10;
  const totals = { kcal: sum('kcal'), carbsG: sum('carbsG'), proteinG: sum('proteinG'), fatG: sum('fatG') };
  const macroKcal = totals.carbsG * 4 + totals.proteinG * 4 + totals.fatG * 9;
  const pct = (g, f) => (macroKcal ? Math.round(((g * f) / macroKcal) * 100) : 0);
  res.json({
    day,
    goal: user.calorieGoal,
    target: { carbsPct: user.carbsPct, proteinPct: user.proteinPct, fatPct: user.fatPct },
    totals,
    macros: { carbsPct: pct(totals.carbsG, 4), proteinPct: pct(totals.proteinG, 4), fatPct: pct(totals.fatG, 9) },
    meals,
    water: { ml: water.reduce((s, w) => s + w.ml, 0), goal: user.waterGoalMl, logs: water },
  });
}));

function mealData(b) {
  const name = str(b.name, 200);
  if (name.length < 2) throw new HttpError(400, 'Descreva o que você comeu');
  return {
    day: dayParam(b.day),
    type: pick(b.type, MEAL_TYPES, 'Refeição'),
    name,
    kcal: num(b.kcal, 'as calorias', 0, 10000, { int: true }),
    carbsG: num(b.carbsG ?? 0, 'carboidratos (g)', 0, 2000) ?? 0,
    proteinG: num(b.proteinG ?? 0, 'proteínas (g)', 0, 2000) ?? 0,
    fatG: num(b.fatG ?? 0, 'gorduras (g)', 0, 2000) ?? 0,
  };
}

api.post('/meals', wrap(async (req, res) => {
  const meal = await prisma.meal.create({ data: { ...mealData(req.body || {}), userId: req.user.id } });
  res.status(201).json({ meal });
}));

api.put('/meals/:id', wrap(async (req, res) => {
  const r = await prisma.meal.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: mealData(req.body || {}) });
  if (!r.count) throw new HttpError(404, 'Refeição não encontrada');
  res.json({ ok: true });
}));

api.delete('/meals/:id', wrap(async (req, res) => {
  const r = await prisma.meal.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!r.count) throw new HttpError(404, 'Refeição não encontrada');
  res.json({ ok: true });
}));

api.post('/water', wrap(async (req, res) => {
  const log = await prisma.waterLog.create({
    data: { userId: req.user.id, day: dayParam(req.body?.day), ml: num(req.body?.ml, 'a quantidade (ml)', 10, 3000, { int: true }) },
  });
  res.status(201).json({ log });
}));

api.delete('/water/:id', wrap(async (req, res) => {
  const r = await prisma.waterLog.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!r.count) throw new HttpError(404, 'Registro não encontrado');
  res.json({ ok: true });
}));

// ---------- Dados corporais ----------
api.get('/body', wrap(async (req, res) => {
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: req.user.id },
    orderBy: [{ day: 'desc' }, { createdAt: 'desc' }],
    take: 365,
  });
  const weight = measurements.find((m) => m.weightKg != null)?.weightKg ?? null;
  const h = req.user.heightCm ? req.user.heightCm / 100 : null;
  const bmi = weight && h ? Math.round((weight / (h * h)) * 10) / 10 : null;
  res.json({ measurements, heightCm: req.user.heightCm, goalWeightKg: req.user.goalWeightKg, weight, bmi });
}));

api.post('/body', wrap(async (req, res) => {
  const b = req.body || {};
  const data = {
    day: dayParam(b.day),
    weightKg: num(b.weightKg, 'o peso (kg)', 20, 400, { optional: true }),
    waistCm: num(b.waistCm, 'a cintura (cm)', 30, 250, { optional: true }),
    chestCm: num(b.chestCm, 'o peito (cm)', 30, 250, { optional: true }),
    hipCm: num(b.hipCm, 'o quadril (cm)', 30, 250, { optional: true }),
    armCm: num(b.armCm, 'o braço (cm)', 10, 100, { optional: true }),
    thighCm: num(b.thighCm, 'a coxa (cm)', 20, 150, { optional: true }),
    bodyFatPct: num(b.bodyFatPct, 'o % de gordura', 2, 70, { optional: true }),
  };
  if (data.day > dayKey()) throw new HttpError(400, 'A data não pode ser no futuro');
  if (Object.entries(data).every(([k, v]) => k === 'day' || v == null)) throw new HttpError(400, 'Preencha pelo menos uma medida');
  const m = await prisma.bodyMeasurement.create({ data: { ...data, userId: req.user.id } });
  res.status(201).json({ measurement: m });
}));

api.delete('/body/:id', wrap(async (req, res) => {
  const r = await prisma.bodyMeasurement.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!r.count) throw new HttpError(404, 'Medição não encontrada');
  res.json({ ok: true });
}));

// ---------- Lembretes ----------
function reminderData(b) {
  const label = str(b.label, 80);
  if (!label) throw new HttpError(400, 'Informe o nome do lembrete');
  const time = str(b.time, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, 'Horário inválido');
  const days = [...new Set(String(b.days ?? '').split(''))].filter((d) => /^[0-6]$/.test(d)).sort().join('');
  if (!days) throw new HttpError(400, 'Escolha pelo menos um dia');
  return { label, time, days, enabled: b.enabled !== false };
}

api.get('/reminders', wrap(async (req, res) => {
  res.json({ reminders: await prisma.reminder.findMany({ where: { userId: req.user.id }, orderBy: { time: 'asc' } }) });
}));

api.post('/reminders', wrap(async (req, res) => {
  const reminder = await prisma.reminder.create({ data: { ...reminderData(req.body || {}), userId: req.user.id } });
  res.status(201).json({ reminder });
}));

api.put('/reminders/:id', wrap(async (req, res) => {
  const r = await prisma.reminder.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: reminderData(req.body || {}) });
  if (!r.count) throw new HttpError(404, 'Lembrete não encontrado');
  res.json({ ok: true });
}));

api.delete('/reminders/:id', wrap(async (req, res) => {
  const r = await prisma.reminder.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!r.count) throw new HttpError(404, 'Lembrete não encontrado');
  res.json({ ok: true });
}));

// ---------- Artigos ----------
api.get('/articles', wrap(async (_req, res) => {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ articles: articles.map(({ body, ...a }) => a) });
}));

api.get('/articles/:slug', wrap(async (req, res) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) throw new HttpError(404, 'Artigo não encontrado');
  res.json({ article });
}));

// ---------- Administração ----------
api.get('/admin/users', requireAdmin, wrap(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { sessions: true } } },
  });
  res.json({ users: users.map(({ passwordHash, _count, ...u }) => ({ ...u, sessions: _count.sessions })) });
}));

api.put('/admin/users/:id/role', requireAdmin, wrap(async (req, res) => {
  const role = pick(req.body?.role, ['admin', 'member'], 'Papel');
  if (req.params.id === req.user.id && role !== 'admin') throw new HttpError(400, 'Você não pode remover seu próprio acesso de admin');
  await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ ok: true });
}));
