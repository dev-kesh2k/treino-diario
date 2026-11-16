import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Scale, Trash2 } from 'lucide-react';
import { api, useApi } from '../api';
import { LineChart } from '../charts';
import { Empty, ErrorBox, Header, Loading, Page, Sheet, useToast } from '../ui';
import { dayLabel, fmt, localDay } from '../util';

interface Measurement {
  id: string;
  day: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bodyFatPct: number | null;
}
interface BodyData {
  measurements: Measurement[];
  heightCm: number | null;
  goalWeightKg: number | null;
  weight: number | null;
  bmi: number | null;
}

const FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'bodyFatPct', label: 'Gordura corporal', unit: '%' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm' },
  { key: 'chestCm', label: 'Peito', unit: 'cm' },
  { key: 'hipCm', label: 'Quadril', unit: 'cm' },
  { key: 'armCm', label: 'Braço', unit: 'cm' },
  { key: 'thighCm', label: 'Coxa', unit: 'cm' },
];

const TABS = [
  ['peso', 'Peso'],
  ['medidas', 'Medidas'],
  ['imc', 'IMC'],
] as const;

function bmiClass(bmi: number) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-sky-600' };
  if (bmi < 25) return { label: 'Peso normal', color: 'text-emerald-600' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-amber-600' };
  return { label: 'Obesidade', color: 'text-red-600' };
}

export default function Body() {
  const [tab, setTab] = useState<string>('peso');
  const { data, error, loading, reload } = useApi<BodyData>('/body');
  const [adding, setAdding] = useState(false);
  const { toast, toastNode } = useToast();

  const remove = async (m: Measurement) => {
    if (!confirm(`Excluir a medição de ${dayLabel(m.day)}?`)) return;
    try {
      await api.del(`/body/${m.id}`);
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const weights = (data?.measurements || []).filter((m) => m.weightKg != null);
  const chrono = [...weights].reverse();
  const delta = chrono.length > 1 ? chrono[chrono.length - 1].weightKg! - chrono[0].weightKg! : null;
  const measures = (data?.measurements || []).filter((m) => FIELDS.slice(1).some((f) => m[f.key] != null));

  return (
    <>
      <Header
        title="Dados corporais"
        right={
          <button aria-label="Nova medição" onClick={() => setAdding(true)} className="rounded-full bg-brand p-1.5 text-white">
            <Plus size={18} />
          </button>
        }
      />
      <Page>
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-on' : 'chip-off'}`}>
              {l}
            </button>
          ))}
        </div>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}

        {data && tab === 'peso' && (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold">
                  {data.weight ? fmt(data.weight, 1) : '—'} <span className="text-base font-semibold">kg</span>
                </p>
                <p className="text-[11px] text-[#8e8aa3]">
                  {weights[0] ? dayLabel(weights[0].day) : 'Nenhuma pesagem'}
                  {data.goalWeightKg ? ` • meta ${fmt(data.goalWeightKg, 1)} kg` : ''}
                </p>
              </div>
              {delta !== null && delta !== 0 && (
                <span className={`flex items-center gap-0.5 text-sm font-semibold ${delta < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {delta < 0 ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
                  {fmt(Math.abs(delta), 1)} kg
                </span>
              )}
            </div>
            {chrono.length > 0 && (
              <div className="card p-3">
                <LineChart unit="kg" points={chrono.slice(-30).map((m) => ({ label: `${m.day.slice(8, 10)}/${m.day.slice(5, 7)}`, value: m.weightKg! }))} />
              </div>
            )}
            <section>
              <h2 className="mb-2 text-sm font-bold">Histórico</h2>
              {!weights.length && <Empty icon={Scale} text="Toque no + para registrar seu peso." />}
              <div className="card divide-y divide-[#f1eff6]">
                {weights.map((m) => (
                  <div key={m.id} className="flex items-center px-4 py-3 text-sm">
                    <span className="flex-1 text-[#4b4760]">{dayLabel(m.day)}</span>
                    <span className="font-bold">{fmt(m.weightKg!, 1)} kg</span>
                    <button aria-label="Excluir" onClick={() => remove(m)} className="ml-3 p-1 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {data && tab === 'medidas' && (
          <>
            {!measures.length && <Empty icon={Scale} text="Nenhuma medida registrada. Toque no + para adicionar." />}
            {measures.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold">{dayLabel(m.day)}</span>
                  <button aria-label="Excluir" onClick={() => remove(m)} className="p-1 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {FIELDS.filter((f) => m[f.key] != null).map((f) => (
                    <div key={f.key} className="rounded-xl bg-[#f8f7fc] p-2">
                      <p className="text-[10px] text-[#8e8aa3]">{f.label}</p>
                      <p className="font-bold">
                        {fmt(m[f.key] as number, 1)} {f.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {data && tab === 'imc' && (
          <div className="card p-5 text-center">
            {data.bmi ? (
              <>
                <p className="text-xs text-[#8e8aa3]">Seu IMC</p>
                <p className="text-5xl font-extrabold">{fmt(data.bmi, 1)}</p>
                <p className={`mt-1 text-sm font-semibold ${bmiClass(data.bmi).color}`}>{bmiClass(data.bmi).label}</p>
                <div className="mt-5 grid grid-cols-4 gap-1 text-[10px]">
                  {[
                    ['< 18,5', 'Abaixo', 'bg-sky-100'],
                    ['18,5–24,9', 'Normal', 'bg-emerald-100'],
                    ['25–29,9', 'Sobrepeso', 'bg-amber-100'],
                    ['≥ 30', 'Obesidade', 'bg-red-100'],
                  ].map(([r, l, c]) => (
                    <div key={l} className={`rounded-lg p-2 ${c}`}>
                      <p className="font-bold">{l}</p>
                      <p>{r}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-[#8e8aa3]">
                  Peso {fmt(data.weight!, 1)} kg • altura {fmt(data.heightCm!)} cm. O IMC é uma referência geral e não considera massa muscular.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#6b6780]">
                Para calcular o IMC, registre seu peso e informe sua altura em{' '}
                <Link to="/conta/perfil" className="font-semibold text-brand">
                  Meu perfil
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </Page>

      {adding && (
        <MeasurementForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
            toast('Medição registrada');
          }}
        />
      )}
      {toastNode}
    </>
  );
}

function MeasurementForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [day, setDay] = useState(localDay());
  const [v, setV] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/body', { day, ...v });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Nova medição" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Data</label>
          <input className="input" type="date" max={localDay()} value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">
                {f.label} ({f.unit})
              </label>
              <input className="input" inputMode="decimal" value={v[f.key] || ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#8e8aa3]">Preencha só o que mediu; os campos vazios são ignorados.</p>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          Salvar
        </button>
      </div>
    </Sheet>
  );
}
