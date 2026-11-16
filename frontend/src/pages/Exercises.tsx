import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, useApi, type Exercise } from '../api';
import { useAuth } from '../auth';
import { Empty, ErrorBox, ExerciseIcon, Header, Loading, Page, Sheet, useToast } from '../ui';
import { CATEGORIES } from '../util';

const ICON_BY_CAT: Record<string, string> = { superior: 'dumbbell', inferior: 'footprints', core: 'shield', cardio: 'heart-pulse' };

export default function Exercises() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading, reload } = useApi<{ exercises: Exercise[] }>(`/exercises?category=${cat}&q=${encodeURIComponent(query)}`);
  const [view, setView] = useState<Exercise | null>(null);
  const [edit, setEdit] = useState<Partial<Exercise> | null>(null);
  const { toast, toastNode } = useToast();

  const remove = async (e: Exercise) => {
    if (!confirm(`Excluir o exercício "${e.name}"?`)) return;
    try {
      await api.del(`/exercises/${e.id}`);
      setView(null);
      reload();
      toast('Exercício excluído');
    } catch (err) {
      toast((err as Error).message);
    }
  };

  return (
    <>
      <Header
        title="Todos os exercícios"
        right={
          isAdmin && (
            <button aria-label="Novo exercício" onClick={() => setEdit({ mode: 'reps', category: 'superior', reps: 12, seconds: 30, kcalPerMin: 6 })} className="rounded-full bg-brand p-1.5 text-white">
              <Plus size={18} />
            </button>
          )
        }
      />
      <Page>
        <label className="flex items-center gap-2 rounded-xl bg-[#f4f2f9] px-3">
          <Search size={16} className="text-[#8e8aa3]" />
          <input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Buscar exercício ou músculo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {[['', 'Todos'], ...Object.entries(CATEGORIES)].map(([k, l]) => (
            <button key={k} onClick={() => setCat(k)} className={`chip ${cat === k ? 'chip-on' : 'chip-off'}`}>
              {l}
            </button>
          ))}
        </div>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && !data.exercises.length && <Empty text="Nenhum exercício encontrado." />}
        <div className="divide-y divide-[#f1eff6]">
          {data?.exercises.map((e) => (
            <button key={e.id} onClick={() => setView(e)} className="flex w-full items-center gap-3 py-3 text-left">
              <ExerciseIcon icon={e.icon} category={e.category} size={52} />
              <div>
                <p className="text-sm font-bold">{e.name}</p>
                <p className="text-[11px] text-[#8e8aa3]">
                  {e.muscle || CATEGORIES[e.category]} • {e.mode === 'time' ? `${e.seconds} segundos` : `${e.reps} repetições`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Page>

      {view && (
        <Sheet title={view.name} onClose={() => setView(null)}>
          <div className="mb-3 flex items-center gap-3">
            <ExerciseIcon icon={view.icon} category={view.category} size={60} />
            <div className="text-xs text-[#6b6780]">
              <p className="font-semibold text-[#1e1b2e]">{view.muscle}</p>
              <p>
                {CATEGORIES[view.category]} • {view.mode === 'time' ? `${view.seconds} s` : `${view.reps} reps`}
              </p>
              <p>≈ {view.kcalPerMin} kcal/min</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{view.instructions || 'Sem instruções cadastradas.'}</p>
          {isAdmin && (
            <div className="mt-4 flex gap-2">
              <button
                className="btn-ghost flex-1"
                onClick={() => {
                  setEdit(view);
                  setView(null);
                }}
              >
                <Pencil size={15} /> Editar
              </button>
              <button className="btn-ghost flex-1 !bg-red-50 !text-red-600" onClick={() => remove(view)}>
                <Trash2 size={15} /> Excluir
              </button>
            </div>
          )}
        </Sheet>
      )}

      {edit && (
        <ExerciseForm
          initial={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
            toast('Exercício salvo');
          }}
        />
      )}
      {toastNode}
    </>
  );
}

function ExerciseForm({ initial, onClose, onSaved }: { initial: Partial<Exercise>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Partial<Exercise>>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Exercise>(k: K, v: Exercise[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { ...f, icon: ICON_BY_CAT[f.category || 'superior'] };
      if (f.id) await api.put(`/exercises/${f.id}`, body);
      else await api.post('/exercises', body);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={f.id ? 'Editar exercício' : 'Novo exercício'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={f.category} onChange={(e) => set('category', e.target.value as Exercise['category'])}>
              {Object.entries(CATEGORIES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Músculo</label>
            <input className="input" value={f.muscle || ''} onChange={(e) => set('muscle', e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={f.mode} onChange={(e) => set('mode', e.target.value as Exercise['mode'])}>
              <option value="reps">Repetições</option>
              <option value="time">Tempo</option>
            </select>
          </div>
          {f.mode === 'time' ? (
            <div>
              <label className="label">Segundos padrão</label>
              <input className="input" type="number" value={f.seconds ?? ''} onChange={(e) => set('seconds', Number(e.target.value))} />
            </div>
          ) : (
            <div>
              <label className="label">Repetições padrão</label>
              <input className="input" type="number" value={f.reps ?? ''} onChange={(e) => set('reps', Number(e.target.value))} />
            </div>
          )}
          <div>
            <label className="label">kcal por minuto</label>
            <input className="input" type="number" step="0.5" value={f.kcalPerMin ?? ''} onChange={(e) => set('kcalPerMin', Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Como executar</label>
          <textarea className="input" rows={4} value={f.instructions || ''} onChange={(e) => set('instructions', e.target.value)} />
        </div>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          Salvar
        </button>
      </div>
    </Sheet>
  );
}
