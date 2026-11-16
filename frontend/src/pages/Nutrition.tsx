import { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplet, Pencil, Plus, Trash2, Utensils } from 'lucide-react';
import { api, useApi } from '../api';
import { Empty, ErrorBox, Header, Loading, Page, Ring, Sheet, useToast } from '../ui';
import { dayLabel, fmt, localDay, MEALS, shiftDay } from '../util';

interface Meal {
  id: string;
  day: string;
  type: string;
  name: string;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}

interface NutritionData {
  day: string;
  goal: number;
  target: { carbsPct: number; proteinPct: number; fatPct: number };
  totals: { kcal: number; carbsG: number; proteinG: number; fatG: number };
  macros: { carbsPct: number; proteinPct: number; fatPct: number };
  meals: Meal[];
  water: { ml: number; goal: number; logs: { id: string; ml: number; createdAt: string }[] };
}

// Paleta validada (CVD) para os três macronutrientes; sempre acompanhada de rótulo e valor.
const MACROS = [
  { key: 'carbs', label: 'Carboidratos', color: '#2a78d6' },
  { key: 'protein', label: 'Proteínas', color: '#eb6834' },
  { key: 'fat', label: 'Gorduras', color: '#1baf7a' },
] as const;

const TABS = [
  ['resumo', 'Resumo'],
  ['refeicoes', 'Refeições'],
  ['agua', 'Água'],
] as const;

export default function Nutrition() {
  const [tab, setTab] = useState<string>('resumo');
  const [day, setDay] = useState(localDay());
  const { data, error, loading, reload } = useApi<NutritionData>(`/nutrition?day=${day}`);
  const [meal, setMeal] = useState<Partial<Meal> | null>(null);
  const { toast, toastNode } = useToast();

  const removeMeal = async (m: Meal) => {
    if (!confirm(`Excluir "${m.name}"?`)) return;
    try {
      await api.del(`/meals/${m.id}`);
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const addWater = async (ml: number) => {
    try {
      await api.post('/water', { ml, day });
      reload();
      toast(`+${ml} ml registrados 💧`);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const removeWater = async (id: string) => {
    try {
      await api.del(`/water/${id}`);
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <>
      <Header title="Nutrição" />
      <Page>
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-on' : 'chip-off'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button aria-label="Dia anterior" onClick={() => setDay((d) => shiftDay(d, -1))} className="rounded-full p-2 active:bg-[#f4f2f9]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold">{dayLabel(day)}</span>
          <button aria-label="Próximo dia" disabled={day >= localDay()} onClick={() => setDay((d) => shiftDay(d, 1))} className="rounded-full p-2 active:bg-[#f4f2f9] disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}

        {data && tab === 'resumo' && (
          <>
            <section className="card p-4">
              <h2 className="mb-3 text-sm font-bold">Calorias do dia</h2>
              <div className="flex items-center gap-5">
                <Ring value={data.totals.kcal} max={data.goal} size={128} stroke={11} color={data.totals.kcal > data.goal ? '#d03b3b' : '#6c3ce9'}>
                  <span className="text-2xl font-extrabold">{fmt(data.totals.kcal)}</span>
                  <span className="text-[10px] text-[#8e8aa3]">/ {fmt(data.goal)} kcal</span>
                </Ring>
                <div className="flex-1 space-y-2.5">
                  {MACROS.map((m) => {
                    const pct = data.macros[`${m.key}Pct`];
                    const g = data.totals[`${m.key}G`];
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                            {m.label}
                          </span>
                          <span className="text-[#6b6780]">
                            {pct}% • {fmt(g)} g
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#ece9f5]">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[#8e8aa3]">
                {data.totals.kcal <= data.goal
                  ? `Restam ${fmt(data.goal - data.totals.kcal)} kcal da sua meta.`
                  : `Você passou ${fmt(data.totals.kcal - data.goal)} kcal da meta.`}{' '}
                Meta de macros: {data.target.carbsPct}% / {data.target.proteinPct}% / {data.target.fatPct}%.
              </p>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold">Refeições do dia</h2>
                <button onClick={() => setMeal({ type: 'cafe', day })} className="flex items-center gap-1 text-xs font-semibold text-brand">
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              <MealList meals={data.meals} onEdit={setMeal} onDelete={removeMeal} />
            </section>

            <button onClick={() => setTab('agua')} className="card flex w-full items-center gap-3 p-4 text-left">
              <Droplet className="text-[#2a78d6]" size={22} />
              <span className="flex-1 text-sm font-semibold">Água</span>
              <span className="text-xs text-[#6b6780]">
                {fmt(data.water.ml)} / {fmt(data.water.goal)} ml
              </span>
            </button>
          </>
        )}

        {data && tab === 'refeicoes' && (
          <>
            {Object.entries(MEALS).map(([type, label]) => {
              const list = data.meals.filter((m) => m.type === type);
              return (
                <section key={type}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-bold">
                      {label} <span className="font-normal text-[#8e8aa3]">• {fmt(list.reduce((s, m) => s + m.kcal, 0))} kcal</span>
                    </h2>
                    <button onClick={() => setMeal({ type, day })} className="flex items-center gap-1 text-xs font-semibold text-brand">
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  <MealList meals={list} onEdit={setMeal} onDelete={removeMeal} compact />
                </section>
              );
            })}
          </>
        )}

        {data && tab === 'agua' && (
          <>
            <section className="card flex flex-col items-center p-5">
              <Ring value={data.water.ml} max={data.water.goal} size={150} stroke={12} color="#2a78d6" track="#dbe8f8">
                <Droplet size={20} className="text-[#2a78d6]" />
                <span className="text-2xl font-extrabold">{fmt(data.water.ml)}</span>
                <span className="text-[10px] text-[#8e8aa3]">/ {fmt(data.water.goal)} ml</span>
              </Ring>
              <p className="mt-3 text-xs text-[#6b6780]">
                {data.water.ml >= data.water.goal ? 'Meta batida! 🎉' : `Faltam ${fmt(data.water.goal - data.water.ml)} ml`}
              </p>
              <div className="mt-4 grid w-full grid-cols-3 gap-2">
                {[200, 300, 500].map((ml) => (
                  <button key={ml} onClick={() => addWater(ml)} className="btn-ghost !px-2">
                    +{ml} ml
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-2 text-sm font-bold">Registros</h2>
              {!data.water.logs.length && <Empty icon={Droplet} text="Nenhum copo registrado neste dia." />}
              <div className="space-y-2">
                {[...data.water.logs].reverse().map((w) => (
                  <div key={w.id} className="card flex items-center gap-3 p-3 text-sm">
                    <Droplet size={18} className="text-[#2a78d6]" />
                    <span className="flex-1 font-semibold">{w.ml} ml</span>
                    <span className="text-xs text-[#8e8aa3]">{new Date(w.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button aria-label="Remover" onClick={() => removeWater(w.id)} className="p-1 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </Page>

      {meal && (
        <MealForm
          initial={meal}
          onClose={() => setMeal(null)}
          onSaved={() => {
            setMeal(null);
            reload();
            toast('Refeição salva');
          }}
        />
      )}
      {toastNode}
    </>
  );
}

function MealList({ meals, onEdit, onDelete, compact }: { meals: Meal[]; onEdit: (m: Meal) => void; onDelete: (m: Meal) => void; compact?: boolean }) {
  if (!meals.length) return compact ? <p className="text-xs text-[#8e8aa3]">Nada registrado.</p> : <Empty icon={Utensils} text="Nenhuma refeição registrada." />;
  return (
    <div className="space-y-2">
      {meals.map((m) => (
        <div key={m.id} className="card flex items-center gap-3 p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Utensils size={18} />
          </div>
          <button onClick={() => onEdit(m)} className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold">{compact ? m.name : MEALS[m.type]}</p>
            <p className="truncate text-[11px] text-[#8e8aa3]">
              {compact ? `C ${fmt(m.carbsG)}g • P ${fmt(m.proteinG)}g • G ${fmt(m.fatG)}g` : m.name}
            </p>
          </button>
          <span className="text-sm font-bold">{fmt(m.kcal)} kcal</span>
          <div className="flex flex-col">
            <button aria-label="Editar" onClick={() => onEdit(m)} className="p-1 text-[#8e8aa3]">
              <Pencil size={14} />
            </button>
            <button aria-label="Excluir" onClick={() => onDelete(m)} className="p-1 text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MealForm({ initial, onClose, onSaved }: { initial: Partial<Meal>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    type: initial.type || 'cafe',
    name: initial.name || '',
    kcal: initial.kcal?.toString() || '',
    carbsG: initial.carbsG?.toString() || '',
    proteinG: initial.proteinG?.toString() || '',
    fatG: initial.fatG?.toString() || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  // Sugestão de kcal a partir dos macros (4/4/9).
  const fromMacros = Math.round((Number(f.carbsG) || 0) * 4 + (Number(f.proteinG) || 0) * 4 + (Number(f.fatG) || 0) * 9);

  const save = async () => {
    setBusy(true);
    setError('');
    const body = { ...f, day: initial.day, kcal: f.kcal === '' && fromMacros ? fromMacros : f.kcal };
    try {
      if (initial.id) await api.put(`/meals/${initial.id}`, body);
      else await api.post('/meals', body);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={initial.id ? 'Editar refeição' : 'Nova refeição'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Refeição</label>
          <select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}>
            {Object.entries(MEALS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">O que você comeu</label>
          <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Aveia, ovos e banana" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Carbo (g)</label>
            <input className="input" inputMode="decimal" value={f.carbsG} onChange={(e) => set('carbsG', e.target.value)} />
          </div>
          <div>
            <label className="label">Proteína (g)</label>
            <input className="input" inputMode="decimal" value={f.proteinG} onChange={(e) => set('proteinG', e.target.value)} />
          </div>
          <div>
            <label className="label">Gordura (g)</label>
            <input className="input" inputMode="decimal" value={f.fatG} onChange={(e) => set('fatG', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Calorias (kcal)</label>
          <input className="input" inputMode="numeric" value={f.kcal} onChange={(e) => set('kcal', e.target.value)} placeholder={fromMacros ? `${fromMacros} (calculado pelos macros)` : ''} />
          {fromMacros > 0 && f.kcal === '' && <p className="mt-1 text-[11px] text-[#8e8aa3]">Deixe vazio para usar {fromMacros} kcal calculadas pelos macros.</p>}
        </div>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          Salvar
        </button>
      </div>
    </Sheet>
  );
}
