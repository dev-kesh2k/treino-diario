import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApi, type ProgramSummary } from '../api';
import { Empty, ErrorBox, Header, Loading, Page, ProgramCover, ProgressBar } from '../ui';
import { GOALS } from '../util';

export default function Programs() {
  const [goal, setGoal] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading, reload } = useApi<{ programs: ProgramSummary[] }>(
    `/programs?goal=${goal}&q=${encodeURIComponent(query)}`,
  );

  return (
    <>
      <Header title="Programas" back={false} />
      <Page>
        <label className="flex items-center gap-2 rounded-xl bg-[#f4f2f9] px-3">
          <Search size={16} className="text-[#8e8aa3]" />
          <input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Buscar programa…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {[['', 'Todos'], ...Object.entries(GOALS)].map(([k, label]) => (
            <button key={k} onClick={() => setGoal(k)} className={`chip ${goal === k ? 'chip-on' : 'chip-off'}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && !data.programs.length && <Empty text="Nenhum programa encontrado." />}
        <div className="space-y-3">
          {data?.programs.map((p) => (
            <Link key={p.id} to={`/programas/${p.id}`} className="card flex items-center gap-3 p-3">
              <ProgramCover color={p.color} size={72} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  {p.enrolled && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[9px] font-bold text-brand">ATIVO</span>}
                </div>
                <p className="text-[11px] text-[#8e8aa3]">
                  {p.weeks} semanas • {p.level} • {p.workoutsCount} treinos
                </p>
                {p.progress ? (
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar percent={p.progress.percent} className="flex-1" />
                    <span className="text-[11px] font-semibold text-[#6b6780]">{p.progress.percent}%</span>
                  </div>
                ) : (
                  <p className="mt-1 line-clamp-1 text-[11px] text-[#6b6780]">{p.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Page>
    </>
  );
}
