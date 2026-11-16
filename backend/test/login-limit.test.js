import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoginLimiter } from '../src/login-limit.js';

const relogio = () => {
  let t = 1_000_000;
  return { now: () => t, passa: (ms) => (t += ms) };
};
const bloqueado = (lim, ip, email) => {
  try {
    lim.check(ip, email);
    return false;
  } catch (e) {
    assert.equal(e.status, 429);
    return true;
  }
};

test('5 erros no mesmo e-mail bloqueiam por 5 min', () => {
  const r = relogio();
  const lim = createLoginLimiter({ now: r.now });
  for (let i = 0; i < 4; i++) lim.fail('1.1.1.1', 'a@x');
  assert.equal(bloqueado(lim, '1.1.1.1', 'a@x'), false);
  lim.fail('1.1.1.1', 'a@x');
  assert.equal(bloqueado(lim, '1.1.1.1', 'a@x'), true);
  assert.equal(bloqueado(lim, '2.2.2.2', 'a@x'), false, 'outro IP não é afetado');
  r.passa(5 * 60_000);
  assert.equal(bloqueado(lim, '1.1.1.1', 'a@x'), false);
});

test('acertar a senha zera os erros do e-mail', () => {
  const lim = createLoginLimiter();
  for (let i = 0; i < 4; i++) lim.fail('ip', 'a@x');
  lim.success('ip', 'a@x');
  for (let i = 0; i < 4; i++) lim.fail('ip', 'a@x');
  assert.equal(bloqueado(lim, 'ip', 'a@x'), false);
});

test('muitos erros do mesmo IP em e-mails diferentes bloqueiam o IP', () => {
  const r = relogio();
  const lim = createLoginLimiter({ now: r.now, ipMax: 10 });
  for (let i = 0; i < 9; i++) lim.fail('9.9.9.9', `u${i}@x`);
  assert.equal(bloqueado(lim, '9.9.9.9', 'novo@x'), false);
  lim.fail('9.9.9.9', 'u9@x');
  assert.equal(bloqueado(lim, '9.9.9.9', 'novo@x'), true);
});

test('erros espalhados no tempo não somam no limite do IP', () => {
  const r = relogio();
  const lim = createLoginLimiter({ now: r.now, ipMax: 3, windowMs: 60_000 });
  lim.fail('ip', 'a');
  lim.fail('ip', 'b');
  r.passa(61_000);
  lim.fail('ip', 'c');
  assert.equal(bloqueado(lim, 'ip', 'd'), false);
});

test('sweep apaga o que venceu e mantém bloqueio ativo', () => {
  const r = relogio();
  const lim = createLoginLimiter({ now: r.now, windowMs: 60_000 });
  lim.fail('a', 'x');
  for (let i = 0; i < 5; i++) lim.fail('b', 'y');
  r.passa(61_000);
  lim.sweep();
  assert.equal(bloqueado(lim, 'b', 'y'), true);
  r.passa(5 * 60_000);
  lim.sweep();
  assert.equal(lim.size(), 0);
});
