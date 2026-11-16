import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';
import { api, useApi, type Exercise, type ProgramSummary, type WorkoutDetail } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, ExerciseIcon, Header, Loading, Page, Sheet } from '../ui';
import { CATEGORIES } from '../util';

interface Row {
  key: string;
  exercise: Exercise;
  value: number;
}

const LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];

export default function WorkoutEdit() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const existing = useApi<{ workout: WorkoutDetail }>(editing ? `/workouts/${id}` : null);
  const programs = useApi<{ programs: ProgramSummary[] }>(isAdmin ? '/programs' : null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Intermediário');
  const [rest, setRest] = useState(20);
  const [rows, setRows] = useState<Row[]>([]);
  const [global, setGlobal] = useState(false);
  const [programId, setProgramId] = useState('');
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const w = existing.data?.workout;
    if (!w) return;
    setName(w.name);
    setDescription(w.description);
    setLevel(w.level);
    setRest(w.restSeconds);
    setGlobal(!w.ownerId);
    setProgramId(w.programId || '');
    setRows(
      w.items.map((i) => ({
        key: i.id,
        exercise: i.exercise,
        value: i.exercise.mode === 'time' ? i.seconds ?? i.exercise.seconds : i.reps ?? i.exercise.reps,
      })),
    );
  }, [existing.data]);

  const move = (i: number, d: number) =>
    setRows((r) => {
      const n = [...r];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  const save = async () => {
    setError('');
    setBusy(true);
    const body = {
      name,
      description,
      level,
      restSeconds: rest,
      global,
      programId: global ? programId || null : null,
      items: rows.map((r) => ({
        exerciseId: r.exercise.id,
        reps: r.exercise.mode === 'reps' ? r.value : undefined,
        seconds: r.exercise.mode === 'time' ? r.value : undefined,
      })),
    };
    try {
      const r = editing ? await api.put<{ workout: { id: string } }>(`/workouts/${id}`, body) : await api.post<{ workout: { id: string } }>('/workouts', body);
      nav(`/treinos/${r.workout.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (editing && existing.error) return <div className="p-4"><ErrorBox message={existing.error} /></div>;
  if (editing && !existing.data) return <Loading />;

  return (
    <>
      <Header title={editing ? 'Editar treino' : 'Novo treino'} />
      <Page className="pb-28">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Treino de terça" maxLength={80} />
        </div>
        <div>
          <label className="label">Descrição (opcional)</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nível</label>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descanso entre exercícios (s)</label>
            <input className="input" type="number" min={0} max={300} value={rest} onChange={(e) => setRest(Number(e.target.value))} />
          </div>
        </div>

        {isAdmin && (
          <div className="card space-y-3 p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={global} disabled={editing} onChange={(e) => setGlobal(e.target.checked)} />
              Treino público (aparece para todos os usuários)
            </label>
            {global && (
              <div>
                <label className="label">Programa (opcional)</label>
                <select className="input" value={programId} onChange={(e) => setProgramId(e.target.value)}>
                  <option value="">Treino avulso</option>
                  {programs.data?.programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Exercícios ({rows.length})</h2>
            <button onClick={() => setPicker(true)} className="flex items-center gap-1 text-xs font-semibold text-brand">
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {!rows.length && <p className="rounded-2xl bg-[#f4f2f9] p-4 text-center text-xs text-[#8e8aa3]">Adicione exercícios ao treino.</p>}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.key} className="card flex items-center gap-2 p-2.5">
                <ExerciseIcon icon={r.exercise.icon} category={r.exercise.category} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.exercise.name}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6b6780]">
                    <input
                      type="number"
                      className="w-16 rounded-lg border border-[#e6e3ef] px-2 py-1 text-xs"
                      min={1}
                      value={r.value}
                      onChange={(e) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, value: Number(e.target.value) } : x)))}
                    />
                    {r.exercise.mode === 'time' ? 'segundos' : 'repetições'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <button aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button aria-label="Descer" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                </div>
                <button aria-label="Remover" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="p-1.5 text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar treino'}
        </button>
      </Page>

      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onPick={(ex) => {
            setRows((r) => [...r, { key: `${ex.id}-${Date.now()}`, exercise: ex, value: ex.mode === 'time' ? ex.seconds : ex.reps }]);
            setPicker(false);
          }}
        />
      )}
    </>
  );
}

function ExercisePicker({ onClose, onPick }: { onClose: () => void; onPick: (e: Exercise) => void }) {
  const { data, error } = useApi<{ exercises: Exercise[] }>('/exercises');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const list = useMemo(
    () =>
      (data?.exercises || []).filter(
        (e) => (!cat || e.category === cat) && (!q || e.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, cat],
  );
  return (
    <Sheet title="Escolher exercício" onClose={onClose}>
      <label className="mb-3 flex items-center gap-2 rounded-xl bg-[#f4f2f9] px-3">
        <Search size={16} className="text-[#8e8aa3]" />
        <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {[['', 'Todos'], ...Object.entries(CATEGORIES)].map(([k, l]) => (
          <button key={k} onClick={() => setCat(k)} className={`chip ${cat === k ? 'chip-on' : 'chip-off'}`}>
            {l}
          </button>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}
      <div className="space-y-1">
        {list.map((e) => (
          <button key={e.id} onClick={() => onPick(e)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left active:bg-[#f4f2f9]">
            <ExerciseIcon icon={e.icon} category={e.category} size={40} />
            <div>
              <p className="text-sm font-semibold">{e.name}</p>
              <p className="text-[11px] text-[#8e8aa3]">
                {CATEGORIES[e.category]} • {e.muscle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
