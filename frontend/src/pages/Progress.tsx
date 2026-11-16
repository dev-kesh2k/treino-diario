import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, History, Trophy } from 'lucide-react';
import { useApi } from '../api';
import { BarChart, LineChart } from '../charts';
import { ErrorBox, Header, Loading, Page } from '../ui';
import { fmt } from '../util';

interface Report {
  label: string;
  summary: { workouts: number; kcal: number; minutes: number };
  series: { key: string; label: string; kcal: number; workouts: number; future?: boolean }[];
  weightSeries: { day: string; label: string; weightKg: number }[];
  weightDelta: number | null;
  currentWeight: number | null;
}

const RANGES = [
  ['week', 'Semanal'],
  ['month', 'Mensal'],
  ['year', 'Anual'],
] as const;

export default function ProgressPage() {
  const [range, setRange] = useState<string>('week');
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useApi<Report>(`/progress?range=${range}&offset=${offset}`);

  return (
    <>
      <Header
        title="Progresso"
        back={false}
        right={
          <Link to="/conta/historico" aria-label="Histórico" className="rounded-full p-2 active:bg-[#f4f2f9]">
            <History size={20} />
          </Link>
        }
      />
      <Page>
        <div className="grid grid-cols-3 gap-2">
          {RANGES.map(([k, l]) => (
            <button
              key={k}
              onClick={() => {
                setRange(k);
                setOffset(0);
              }}
              className={`chip ${range === k ? 'chip-on' : 'chip-off'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button aria-label="Período anterior" onClick={() => setOffset((o) => o - 1)} className="rounded-full p-2 active:bg-[#f4f2f9]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold">{data?.label || '…'}</span>
          <button aria-label="Próximo período" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} className="rounded-full p-2 active:bg-[#f4f2f9] disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (
          <>
            <section>
              <h2 className="mb-2 text-sm font-bold">Resumo</h2>
              <div className="grid grid-cols-3 gap-2">
                <Tile label="Treinos" value={fmt(data.summary.workouts)} unit="sessões" />
                <Tile label="Calorias" value={fmt(data.summary.kcal)} unit="kcal" />
                <Tile label="Duração" value={fmt(data.summary.minutes)} unit="minutos" />
              </div>
            </section>

            <section className="card p-4">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-bold">Peso corporal</h2>
                {data.weightDelta !== null && data.weightDelta !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${data.weightDelta < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {data.weightDelta < 0 ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                    {fmt(Math.abs(data.weightDelta), 1)} kg
                  </span>
                )}
              </div>
              <p className="text-xl font-extrabold">{data.currentWeight ? `${fmt(data.currentWeight, 1)} kg` : '—'}</p>
              {data.weightSeries.length ? (
                <LineChart unit="kg" points={data.weightSeries.map((w) => ({ label: w.label, value: w.weightKg }))} />
              ) : (
                <p className="py-6 text-center text-xs text-[#8e8aa3]">
                  Sem pesagens neste período.{' '}
                  <Link to="/conta/corpo" className="font-semibold text-brand">
                    Registrar peso
                  </Link>
                </p>
              )}
            </section>

            <section className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold">Calorias queimadas</h2>
                <span className="text-xs text-[#8e8aa3]">{fmt(data.summary.kcal)} kcal</span>
              </div>
              {data.summary.kcal > 0 ? (
                <BarChart unit="kcal" bars={data.series.map((s) => ({ label: s.label, value: s.kcal, future: s.future }))} />
              ) : (
                <p className="py-6 text-center text-xs text-[#8e8aa3]">Nenhum treino neste período.</p>
              )}
            </section>

            <Link to="/conquistas" className="card flex items-center gap-3 p-4">
              <Trophy className="text-amber-500" size={22} />
              <span className="flex-1 text-sm font-semibold">Conquistas e estatísticas</span>
              <ChevronRight size={18} className="text-[#8e8aa3]" />
            </Link>
          </>
        )}
      </Page>
    </>
  );
}

const Tile = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="card p-3">
    <p className="text-[10px] text-[#8e8aa3]">{label}</p>
    <p className="text-xl font-extrabold">{value}</p>
    <p className="text-[10px] text-[#8e8aa3]">{unit}</p>
  </div>
);
