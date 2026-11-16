import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECONDS_PER_REP, itemKcal, itemSeconds, summarize } from '../src/workout-calc.js';

const porTempo = { mode: 'time', seconds: 30, reps: 0, kcalPerMin: 10 };
const porRep = { mode: 'reps', seconds: 0, reps: 12, kcalPerMin: 6 };

test('itemSeconds: tempo do item, do exercício ou repetições × 3 s', () => {
  assert.equal(itemSeconds({ exercise: porTempo }), 30);
  assert.equal(itemSeconds({ exercise: porTempo, seconds: 45 }), 45);
  assert.equal(itemSeconds({ exercise: porRep }), 12 * SECONDS_PER_REP);
  assert.equal(itemSeconds({ exercise: porRep, reps: 20 }), 60);
});

test('itemKcal: proporcional ao peso (referência 70 kg)', () => {
  const item = { exercise: porTempo, seconds: 60 };
  assert.equal(itemKcal(item, null), 10);
  assert.equal(itemKcal(item, 70), 10);
  assert.equal(itemKcal(item, 105), 15);
});

test('summarize: exercícios, minutos com descanso e calorias', () => {
  const treino = { restSeconds: 30, items: [{ exercise: porTempo, seconds: 60 }, { exercise: porRep, reps: 20 }] };
  assert.deepEqual(summarize(treino, 70), { exercises: 2, minutes: 3, kcal: 16 });
  assert.deepEqual(summarize({ restSeconds: 30, items: [] }, 70), { exercises: 0, minutes: 1, kcal: 0 });
});
