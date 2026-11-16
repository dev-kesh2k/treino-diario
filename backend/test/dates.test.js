import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addMonths, dayKey, daysBetween, isDay, streaks, weekday } from '../src/dates.js';

test('dayKey e isDay', () => {
  assert.equal(dayKey(new Date('2026-11-16T02:00:00Z')), '2026-11-15');
  assert.equal(isDay('2026-02-28'), true);
  assert.equal(isDay('28/02/2026'), false);
});

test('addDays, weekday e addMonths', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(weekday('2026-11-16'), 1);
  assert.equal(addMonths('2026-11-16', 1), '2026-12-01');
  assert.equal(addMonths('2026-12-10', 1), '2027-01-01');
  assert.equal(addMonths('2026-01-31', -1), '2025-12-01');
});

test('daysBetween: inclui as pontas', () => {
  assert.deepEqual(daysBetween('2026-11-29', '2026-12-02'), ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02']);
  assert.deepEqual(daysBetween('2026-11-02', '2026-11-01'), []);
});

test('streaks: sequência atual (vale ter treinado ontem) e a maior', () => {
  const dias = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10', '2026-11-14', '2026-11-15']);
  assert.deepEqual(streaks(dias, '2026-11-16'), { current: 2, longest: 3 });
  assert.deepEqual(streaks(dias, '2026-11-15'), { current: 2, longest: 3 });
  assert.deepEqual(streaks(dias, '2026-11-18'), { current: 0, longest: 3 });
  assert.deepEqual(streaks(new Set(), '2026-11-18'), { current: 0, longest: 0 });
});
