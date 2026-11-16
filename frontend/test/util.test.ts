import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clock, dayLabel, firstName, fmt, fmtDuration, itemTarget, localDay, shiftDay } from '../src/util.ts';

test('fmt: número em português', () => {
  assert.equal(fmt(1234.5, 1), '1.234,5');
  assert.equal(fmt(2.6), '3');
});

test('fmtDuration e clock', () => {
  assert.equal(fmtDuration(90), '1:30 min');
  assert.equal(fmtDuration(600), '10 min');
  assert.equal(fmtDuration(605), '10 min');
  assert.equal(fmtDuration(3900), '1 h 5 min');
  assert.equal(clock(65), '1:05');
  assert.equal(clock(0), '0:00');
});

test('localDay, shiftDay e dayLabel', () => {
  assert.equal(localDay(new Date(2026, 10, 16, 23, 30)), '2026-11-16');
  assert.equal(shiftDay('2026-11-30', 1), '2026-12-01');
  const hoje = localDay();
  assert.equal(dayLabel(hoje), 'Hoje');
  assert.equal(dayLabel(shiftDay(hoje, -1)), 'Ontem');
  assert.match(dayLabel('2020-03-05'), /05.*mar.*2020/);
});

test('itemTarget e firstName', () => {
  assert.equal(itemTarget('time', null, 30), '30 segundos');
  assert.equal(itemTarget('reps', 12, null), '12 repetições');
  assert.equal(firstName('Ana Souza'), 'Ana');
});
