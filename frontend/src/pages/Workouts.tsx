import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell, Heart, ListChecks, Plus, Search } from 'lucide-react';
import { useApi, type WorkoutSummary } from '../api';
import { Empty, ErrorBox, Header, Loading, Page } from '../ui';

const SCOPES = [
  ['all', 'Todos'],
  ['favorites', 'Favoritos'],
  ['mine', 'Meus treinos'],
] as const;

export default function Workouts() {
  const [scope, setScope] = useState<string>('all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading, reload } = useApi<{ workouts: WorkoutSummary[] }>(`/workouts?scope=${scope}&q=${encodeURIComponent(query)}`);

  return (
    <>
      <Header
        title="Treinos"
        back={false}
        right={
          <Link to="/treinos/novo" aria-label="Novo treino" className="rounded-full bg-brand p-1.5 text-white">
            <Plus size={18} />
          </Link>
        }
      />
      <Page>
        <Link to="/exercicios" className="card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <ListChecks size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Todos os exercícios</p>
            <p className="text-[11px] text-[#8e8aa3]">Biblioteca com instruções de execução</p>
          </div>
          <ChevronRight size={18} className="text-[#8e8aa3]" />
        </Link>

        <label className="flex items-center gap-2 rounded-xl bg-[#f4f2f9] px-3">
          <Search size={16} className="text-[#8e8aa3]" />
          <input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Buscar treino…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="flex gap-2">
          {SCOPES.map(([k, label]) => (
            <button key={k} onClick={() => setScope(k)} className={`chip ${scope === k ? 'chip-on' : 'chip-off'}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && !data.workouts.length && (
          <Empty
            icon={scope === 'favorites' ? Heart : Dumbbell}
            text={
              scope === 'favorites'
                ? 'Toque no coração de um treino para favoritá-lo.'
                : scope === 'mine'
                  ? 'Você ainda não montou treinos. Toque no + para criar.'
                  : 'Nenhum treino encontrado.'
            }
          />
        )}
        <div className="space-y-2">
          {data?.workouts.map((w) => (
            <Link key={w.id} to={`/treinos/${w.id}`} className="card flex items-center gap-3 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Dumbbell size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{w.name}</p>
                <p className="text-[11px] text-[#8e8aa3]">
                  {w.minutes} min • {w.kcal} kcal • {w.level}
                </p>
                <p className="truncate text-[10px] text-brand">{w.mine ? 'Criado por você' : w.program || 'Treino avulso'}</p>
              </div>
              {w.favorite && <Heart size={16} className="text-rose-500" fill="currentColor" />}
            </Link>
          ))}
        </div>
      </Page>
    </>
  );
}
