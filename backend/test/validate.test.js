import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL_RE, dayParam, num, pick, str } from '../src/validate.js';
import { HttpError } from '../src/errors.js';

const erro = (re) => (e) => e instanceof HttpError && e.status === 400 && re.test(e.message);

test('str: texto cortado no tamanho e sem espaços nas pontas', () => {
  assert.equal(str('  Supino  '), 'Supino');
  assert.equal(str(null), '');
  assert.equal(str('abcdef', 3), 'abc');
});

test('num: vírgula decimal, faixa, opcional e inteiro', () => {
  assert.equal(num('72,46', 'peso', 20, 400), 72.5);
  assert.equal(num('3.7', 'séries', 1, 20, { int: true }), 4);
  assert.equal(num('', 'peso', 20, 400, { optional: true }), null);
  assert.throws(() => num('', 'o peso', 20, 400), erro(/Informe o peso/));
  assert.throws(() => num('500', 'peso', 20, 400), erro(/entre 20 e 400/));
  assert.throws(() => num('abc', 'peso', 20, 400), erro(/entre/));
});

test('pick: só valores da lista', () => {
  assert.equal(pick('cardio', ['core', 'cardio'], 'Categoria'), 'cardio');
  assert.throws(() => pick('yoga', ['core'], 'Categoria'), erro(/Categoria inválido/));
});

test('dayParam: hoje quando vazio, data válida ou 400', () => {
  assert.match(dayParam(undefined), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(dayParam('2026-11-16'), '2026-11-16');
  assert.throws(() => dayParam('16/11/2026'), erro(/Data inválida/));
});

test('EMAIL_RE', () => {
  assert.ok(EMAIL_RE.test('a@b.com'));
  assert.ok(!EMAIL_RE.test('a b@c.com'));
});
