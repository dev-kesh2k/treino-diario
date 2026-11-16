// Constantes e cálculos do treino (duração e calorias), sem banco: testáveis.

export const SECONDS_PER_REP = 3;
export const CATEGORIES = ['superior', 'inferior', 'core', 'cardio'];
export const MEAL_TYPES = ['cafe', 'almoco', 'lanche', 'jantar'];
export const GOALS = ['perder-peso', 'ganhar-massa', 'definicao', 'iniciante'];
export const LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];

/** Duração (s) de um item do treino. */
export function itemSeconds(item) {
  const ex = item.exercise;
  if (ex.mode === 'time') return item.seconds ?? ex.seconds;
  return (item.reps ?? ex.reps) * SECONDS_PER_REP;
}

/** kcal do item, ajustada pelo peso (referência 70 kg). */
export function itemKcal(item, weightKg) {
  const factor = weightKg ? weightKg / 70 : 1;
  return (item.exercise.kcalPerMin * itemSeconds(item) * factor) / 60;
}

export function summarize(workout, weightKg) {
  const items = workout.items || [];
  const work = items.reduce((s, i) => s + itemSeconds(i), 0);
  const rest = Math.max(0, items.length - 1) * workout.restSeconds;
  return {
    exercises: items.length,
    minutes: Math.max(1, Math.round((work + rest) / 60)),
    kcal: Math.round(items.reduce((s, i) => s + itemKcal(i, weightKg), 0)),
  };
}
