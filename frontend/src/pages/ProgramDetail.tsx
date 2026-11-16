import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, Dumbbell, Gauge, Repeat } from 'lucide-react';
import { api, useApi, type Progress, type WorkoutSummary } from '../api';
import { ErrorBox, Header, Loading, Page, PROGRAM_GRADIENT, ProgressBar, SectionTitle, useToast } from '../ui';
import { GOALS } from '../util';

interface ProgramFull {
  id: string;
  name: string;
  goal: string;
  level: string;
  weeks: number;
  sessionsPerWeek: number;
  description: string;
  color: string;
  enrolled: boolean;
  progress: Progress | null;
  workouts: WorkoutSummary[];
}

export default function ProgramDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi<{ program: ProgramFull }>(`/programs/${id}`);
  const [busy, setBusy] = useState(false);
  const { toast, toastNode } = useToast();

  const toggle = async () => {
    if (!data) return;
    setBusy(true);
    try {
      if (data.program.enrolled) await api.del(`/programs/${id}/enroll`);
      else await api.post(`/programs/${id}/enroll`);
      toast(data.program.enrolled ? 'Programa pausado' : 'Programa iniciado! Bons treinos 💪');
      await reload();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const p = data?.program;
  return (
    <>
      <Header title="Programa" />
      <Page>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {p && (
          <>
            <div className={`rounded-3xl bg-gradient-to-br p-5 text-white ${PROGRAM_GRADIENT[p.color] || PROGRAM_GRADIENT.violet}`}>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold">{GOALS[p.goal] || p.goal}</span>
              <h2 className="mt-3 text-2xl font-extrabold">{p.name}</h2>
              <p className="mt-1 text-xs text-white/85">{p.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} /> {p.weeks} semanas
                </span>
                <span className="flex items-center gap-1">
                  <Repeat size={14} /> {p.sessionsPerWeek}x por semana
                </span>
                <span className="flex items-center gap-1">
                  <Gauge size={14} /> {p.level}
                </span>
              </div>
            </div>

            {p.progress && (
              <div className="card p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-semibold">Seu progresso</span>
                  <span className="text-[#6b6780]">
                    {p.progress.done}/{p.progress.total} sessões • {p.progress.percent}%
                  </span>
                </div>
                <ProgressBar percent={p.progress.percent} />
              </div>
            )}

            <button className={p.enrolled ? 'btn-ghost w-full' : 'btn-primary w-full'} onClick={toggle} disabled={busy}>
              {p.enrolled ? 'Pausar programa' : 'Começar este programa'}
            </button>

            <section>
              <SectionTitle title="Treinos do programa" action={<span className="text-[#8e8aa3]">{p.workouts.length} treinos</span>} />
              <p className="mb-3 text-[11px] text-[#8e8aa3]">Faça os treinos em sequência; depois do último, volte ao primeiro.</p>
              <div className="space-y-2">
                {p.workouts.map((w, i) => (
                  <Link key={w.id} to={`/treinos/${w.id}`} className="card flex items-center gap-3 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Dumbbell size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {i + 1}. {w.name}
                      </p>
                      <p className="text-[11px] text-[#8e8aa3]">
                        {w.minutes} min • {w.kcal} kcal • {w.exercises} exercícios
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-[#8e8aa3]" />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </Page>
      {toastNode}
    </>
  );
}
