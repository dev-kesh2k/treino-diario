import { useState } from 'react';
import { fmt } from './util';

const W = 320;
const H = 160;
const PAD = { l: 34, r: 10, t: 22, b: 24 };
const BRAND = '#6c3ce9';
const GRID = '#ece9f5';
const MUTED = '#8e8aa3';

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Rótulos do eixo X sem colisão: mostra no máximo ~7. */
const showLabel = (i: number, n: number) => n <= 7 || i % Math.ceil(n / 7) === 0 || i === n - 1;

export function LineChart({ points, unit }: { points: { label: string; value: number }[]; unit: string }) {
  const [sel, setSel] = useState<number | null>(null);
  if (!points.length) return null;
  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const s = sel ?? points.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label={`Gráfico de ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill={MUTED}>
            {fmt(t, t % 1 ? 1 : 0)}
          </text>
        </g>
      ))}
      {points.map((p, i) =>
        showLabel(i, points.length) ? (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fill={MUTED}>
            {p.label}
          </text>
        ) : null,
      )}
      <line x1={x(s)} x2={x(s)} y1={PAD.t} y2={PAD.t + ih} stroke="#c9c3e0" strokeDasharray="3 3" />
      <path d={path} fill="none" stroke={BRAND} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === s ? 5 : 3.5} fill={BRAND} stroke="#fff" strokeWidth={2} />
      ))}
      <Tip x={x(s)} y={y(points[s].value)} text={`${fmt(points[s].value, 1)} ${unit} · ${points[s].label}`} />
      {/* Alvos de toque maiores que as marcas */}
      {points.map((_, i) => {
        const half = points.length > 1 ? iw / (points.length - 1) / 2 : iw / 2;
        return (
          <rect
            key={i}
            x={x(i) - half}
            y={PAD.t}
            width={half * 2}
            height={ih}
            fill="transparent"
            onPointerEnter={() => setSel(i)}
            onPointerDown={() => setSel(i)}
          />
        );
      })}
    </svg>
  );
}

export function BarChart({ bars, unit }: { bars: { label: string; value: number; future?: boolean }[]; unit: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const ticks = niceTicks(0, max, 3);
  const yMax = ticks[ticks.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / bars.length;
  const bw = Math.max(3, Math.min(18, slot - 2));
  const y = (v: number) => PAD.t + ih - (v / yMax) * ih;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label={`Gráfico de ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill={MUTED}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {bars.map((b, i) => {
        const cx = PAD.l + slot * i + slot / 2;
        const h = Math.max(0, PAD.t + ih - y(b.value));
        const r = Math.min(4, bw / 2, h);
        const top = PAD.t + ih - h;
        return (
          <g key={i}>
            {h > 0 && (
              <path
                d={`M${cx - bw / 2},${PAD.t + ih} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${PAD.t + ih} Z`}
                fill={BRAND}
                opacity={sel === null || sel === i ? 1 : 0.45}
              />
            )}
            {showLabel(i, bars.length) && (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize={9} fill={b.future ? '#c9c3e0' : MUTED}>
                {b.label}
              </text>
            )}
            <rect
              x={cx - slot / 2}
              y={PAD.t}
              width={slot}
              height={ih}
              fill="transparent"
              onPointerEnter={() => setSel(i)}
              onPointerDown={() => setSel(i)}
              onPointerLeave={() => setSel(null)}
            />
          </g>
        );
      })}
      {sel !== null && (
        <Tip x={PAD.l + slot * sel + slot / 2} y={y(bars[sel].value)} text={`${fmt(bars[sel].value)} ${unit} · ${bars[sel].label}`} />
      )}
    </svg>
  );
}

function Tip({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 5.4 + 12;
  const tx = Math.min(W - w - 2, Math.max(2, x - w / 2));
  const ty = Math.max(1, y - 24);
  return (
    <g pointerEvents="none">
      <rect x={tx} y={ty} width={w} height={17} rx={6} fill="#1e1b2e" />
      <text x={tx + w / 2} y={ty + 12} textAnchor="middle" fontSize={9.5} fill="#fff" fontWeight={600}>
        {text}
      </text>
    </g>
  );
}
