import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Apple, Bell, ChevronRight, Dumbbell, Flame, Footprints, Play, Trophy } from 'lucide-react';
import { api, useApi, type ArticleSummary } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, Loading, Page, ProgramCover, ProgressBar, Ring, SectionTitle, Sheet } from '../ui';
import { firstName, fmt, greeting } from '../util';

interface Dashboard {
  today: { day: string; burned: number; burnGoal: number; steps: number; stepsGoal: number; activeMinutes: number; sessions: number };
  week: { done: number; goal: number };
  streak: number;
  activeProgram: { id: string; name: string; weeks: number; level: string; color: string; progress: { percent: number; done: number; total: number } } | null;
  next: { id: string; name: string; minutes: number; kcal: number; exercises: number } | null;
  articles: ArticleSummary[];
}

export default function Home() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<Dashboard>('/dashboard');
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <Page className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold">
            {greeting()}, {firstName(user!.name)}! 👋
          </h1>
          <p className="mt-1 text-xs text-[#6b6780]">Bora! Mantenha a constância para ter os melhores resultados.</p>
        </div>
        <Link to="/conta/lembretes" aria-label="Lembretes" className="rounded-full p-2 active:bg-[#f4f2f9]">
          <Bell size={22} />
        </Link>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c4dff] to-[#5427d1] p-5 text-white shadow-[0_10px_24px_rgba(108,60,233,0.35)]">
            <p className="mb-3 text-sm font-semibold">Calorias queimadas hoje</p>
            <div className="flex items-center gap-4">
              <Ring value={data.today.burned} max={data.today.burnGoal} size={112} stroke={9} color="#ffffff" track="rgba(255,255,255,0.25)">
                <span className="text-2xl font-extrabold">{fmt(data.today.burned)}</span>
                <span className="text-[10px] text-white/80">/ {fmt(data.today.burnGoal)} kcal</span>
              </Ring>
              <div className="flex-1 space-y-2.5">
                <button onClick={() => setStepsOpen(true)} className="flex w-full items-center gap-2.5 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                    <Footprints size={16} />
                  </span>
                  <span>
                    <span className="block text-[10px] text-white/75">Passos (toque p/ editar)</span>
                    <span className="text-sm font-bold">{fmt(data.today.steps)}</span>
                  </span>
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                    <Activity size={16} />
                  </span>
                  <span>
                    <span className="block text-[10px] text-white/75">Atividade</span>
                    <span className="text-sm font-bold">{data.today.activeMinutes} min</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                    <Flame size={16} />
                  </span>
                  <span>
                    <span className="block text-[10px] text-white/75">Treinos</span>
                    <span className="text-sm font-bold">
                      {data.today.sessions} {data.today.sessions === 1 ? 'sessão' : 'sessões'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link to="/progresso" className="card p-3">
              <p className="text-[10px] text-[#8e8aa3]">Semana</p>
              <p className="text-lg font-extrabold">
                {data.week.done}
                <span className="text-xs font-semibold text-[#8e8aa3]">/{data.week.goal}</span>
              </p>
              <p className="text-[10px] text-[#8e8aa3]">treinos</p>
            </Link>
            <Link to="/conquistas" className="card p-3">
              <p className="text-[10px] text-[#8e8aa3]">Sequência</p>
              <p className="text-lg font-extrabold">{data.streak}</p>
              <p className="text-[10px] text-[#8e8aa3]">{data.streak === 1 ? 'dia' : 'dias'}</p>
            </Link>
            <Link to="/nutricao" className="card flex flex-col items-start p-3">
              <Apple size={18} className="text-emerald-600" />
              <p className="mt-1 text-xs font-bold">Nutrição</p>
              <p className="text-[10px] text-[#8e8aa3]">refeições e água</p>
            </Link>
          </div>

          <section>
            <SectionTitle title="Programa ativo" action={<Link to="/programas">Ver todos</Link>} />
            {data.activeProgram ? (
              <Link to={`/programas/${data.activeProgram.id}`} className="card flex items-center gap-3 p-3">
                <ProgramCover color={data.activeProgram.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{data.activeProgram.name}</p>
                  <p className="text-[11px] text-[#8e8aa3]">
                    {data.activeProgram.weeks} semanas • {data.activeProgram.level}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar percent={data.activeProgram.progress.percent} className="flex-1" />
                    <span className="text-[11px] font-semibold text-[#6b6780]">{data.activeProgram.progress.percent}%</span>
                  </div>
                </div>
              </Link>
            ) : (
              <Link to="/programas" className="card flex items-center gap-3 p-4 text-sm">
                <Trophy className="text-brand" size={22} />
                <span className="flex-1">Escolha um programa para acompanhar seu progresso.</span>
                <ChevronRight size={18} className="text-[#8e8aa3]" />
              </Link>
            )}
          </section>

          {data.next && (
            <section>
              <SectionTitle title={data.activeProgram ? 'Próximo treino' : 'Continuar treino'} />
              <div className="card flex items-center gap-3 p-3">
                <Link to={`/treinos/${data.next.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Dumbbell size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{data.next.name}</p>
                    <p className="text-[11px] text-[#8e8aa3]">
                      {data.next.minutes} min • {data.next.kcal} kcal • {data.next.exercises} exercícios
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/treinos/${data.next.id}/executar`}
                  aria-label="Iniciar treino"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_14px_rgba(108,60,233,0.4)]"
                >
                  <Play size={18} fill="currentColor" />
                </Link>
              </div>
            </section>
          )}

          <section>
            <SectionTitle title="Artigos e dicas" action={<Link to="/artigos">Ver todos</Link>} />
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {data.articles.map((a) => (
                <Link key={a.id} to={`/artigos/${a.slug}`} className="card w-[min(15rem,75vw)] shrink-0 p-4">
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand">{a.category}</span>
                  <p className="mt-2 text-sm font-bold leading-snug">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[#8e8aa3]">{a.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {stepsOpen && data && (
        <StepsSheet
          day={data.today.day}
          initial={data.today.steps}
          onClose={() => setStepsOpen(false)}
          onSaved={() => {
            setStepsOpen(false);
            reload();
          }}
        />
      )}
    </Page>
  );
}

function StepsSheet({ day, initial, onClose, onSaved }: { day: string; initial: number; onClose: () => void; onSaved: () => void }) {
  const [steps, setSteps] = useState(String(initial || ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/days/${day}/steps`, { steps: Number(steps) || 0 });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Passos de hoje" onClose={onClose}>
      <p className="mb-3 text-xs text-[#6b6780]">Informe o total de passos que aparece no seu celular ou relógio.</p>
      <input className="input mb-3" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value.replace(/\D/g, ''))} autoFocus />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" onClick={save} disabled={busy}>
        Salvar
      </button>
    </Sheet>
  );
}
