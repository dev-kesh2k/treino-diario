// Limite de tentativas de login (memória do processo). Sem banco: testável com relógio falso.
// - por IP + e-mail: `maxFails` erros seguidos bloqueiam por `lockMs` (comportamento de antes);
// - por IP: `ipMax` erros em `windowMs` bloqueiam o IP (impede testar senhas em vários e-mails);
// - `sweep()` apaga o que já venceu (antes o mapa só crescia).
import { HttpError } from './errors.js';

export function createLoginLimiter({ maxFails = 5, lockMs = 5 * 60_000, ipMax = 30, windowMs = 15 * 60_000, now = () => Date.now() } = {}) {
  const byKey = new Map(); // ip|email -> { n, until, last }
  const byIp = new Map(); // ip -> { fails: number[], until }
  const keyOf = (ip, email) => `${ip}|${email}`;

  return {
    /** Lança 429 se o IP ou o par IP+e-mail estiver bloqueado. */
    check(ip, email) {
      const t = now();
      if ((byIp.get(ip)?.until || 0) > t || (byKey.get(keyOf(ip, email))?.until || 0) > t) {
        throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
      }
    },
    fail(ip, email) {
      const t = now();
      const k = keyOf(ip, email);
      const a = byKey.get(k) || { n: 0, until: 0, last: 0 };
      a.n += 1;
      a.last = t;
      if (a.n >= maxFails) Object.assign(a, { n: 0, until: t + lockMs });
      byKey.set(k, a);
      const b = byIp.get(ip) || { fails: [], until: 0 };
      b.fails = b.fails.filter((x) => t - x < windowMs);
      b.fails.push(t);
      if (b.fails.length >= ipMax) Object.assign(b, { fails: [], until: t + lockMs });
      byIp.set(ip, b);
    },
    success(ip, email) {
      byKey.delete(keyOf(ip, email));
    },
    sweep() {
      const t = now();
      // Sem bloqueio ativo e sem erro recente: some (erros antigos também param de contar).
      for (const [k, a] of byKey) if (a.until <= t && t - a.last >= windowMs) byKey.delete(k);
      for (const [ip, b] of byIp) {
        b.fails = b.fails.filter((x) => t - x < windowMs);
        if (!b.fails.length && b.until <= t) byIp.delete(ip);
      }
    },
    size: () => byKey.size + byIp.size,
  };
}
