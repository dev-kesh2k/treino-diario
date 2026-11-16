// Validação dos campos recebidos (sem banco: testável).
import { HttpError } from './errors.js';
import { dayKey, isDay } from './dates.js';

export const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Número validado; `optional` aceita vazio (null). */
export function num(v, label, min, max, { optional = false, int = false } = {}) {
  if (v === undefined || v === null || v === '') {
    if (optional) return null;
    throw new HttpError(400, `Informe ${label}`);
  }
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `${label} deve estar entre ${min} e ${max}`);
  return int ? Math.round(n) : Math.round(n * 10) / 10;
}

export function pick(value, list, label) {
  if (!list.includes(value)) throw new HttpError(400, `${label} inválido`);
  return value;
}

export const dayParam = (v) => {
  if (v === undefined || v === '') return dayKey();
  if (!isDay(v)) throw new HttpError(400, 'Data inválida');
  return v;
};
