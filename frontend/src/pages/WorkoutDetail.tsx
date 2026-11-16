import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, Flame, Gauge, Heart, Pencil, Play, Trash2 } from 'lucide-react';
import { api, useApi, type WorkoutDetail as WD, type WorkoutItem } from '../api';
import { ErrorBox, ExerciseIcon, Header, Loading, Page, SectionTitle, Sheet, useToast } from '../ui';
import { itemTarget } from '../util';

export default function WorkoutDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error, loading, reload, setData } = useApi<{ workout: WD }>(`/workouts/${id}`);
  const [info, setInfo] = useState<WorkoutItem | null>(null);
  const { toast, toastNode } = useToast();

  const w = data?.workout;

  const toggleFav = async () => {
    if (!w) return;
    try {
      if (w.favorite) await api.del(`/workouts/${w.id}/favorite`);
      else await api.post(`/workouts/${w.id}/favorite`);
      setData({ workout: { ...w, favorite: !w.favorite } });
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const remove = async () => {
    if (!w || !confirm(`Excluir o treino "${w.name}"?`)) return;
    try {
      await api.del(`/workouts/${w.id}`);
      nav('/treinos', { replace: true });
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <>
      <Header
        title="Detalhe do treino"
        right={
          w && (
            <button aria-label="Favoritar" onClick={toggleFav} className="rounded-full p-2 active:bg-[#f4f2f9]">
              <Heart size={21} className={w.favorite ? 'text-rose-500' : ''} fill={w.favorite ? 'currentColor' : 'none'} />
            </button>
          )
        }
      />
      <Page>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {w && (
          <>
            <div className="flex h-36 items-center justify-center rounded-3xl bg-gradient-to-br from-[#efe9fd] to-[#dcd0fb]">
              <div className="flex gap-3">
                {w.items.slice(0, 4).map((i) => (
                  <ExerciseIcon key={i.id} icon={i.exercise.icon} category={i.exercise.category} size={52} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{w.name}</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#6b6780]">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {w.minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={14} /> {w.kcal} kcal
                </span>
                <span className="flex items-center gap-1">
                  <Gauge size={14} /> {w.level}
                </span>
              </div>
              {w.description && <p className="mt-3 text-xs leading-relaxed text-[#6b6780]">{w.description}</p>}
              {w.program && (
                <Link to={`/programas/${w.program.id}`} className="mt-2 inline-block text-xs font-semibold text-brand">
                  Programa: {w.program.name}
                  {w.inActiveProgram ? ' (ativo — conta no seu progresso)' : ''}
                </Link>
              )}
            </div>

            <section>
              <SectionTitle title="Exercícios" action={<span className="text-[#8e8aa3]">{w.items.length} movimentos • descanso {w.restSeconds}s</span>} />
              <div className="space-y-2">
                {w.items.map((i) => (
                  <button key={i.id} onClick={() => setInfo(i)} className="card flex w-full items-center gap-3 p-3 text-left">
                    <ExerciseIcon icon={i.exercise.icon} category={i.exercise.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{i.exercise.name}</p>
                      <p className="text-[11px] text-[#8e8aa3]">{itemTarget(i.exercise.mode, i.reps, i.seconds)}</p>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
                      <Play size={12} fill="currentColor" />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {w.editable && (
              <div className="flex gap-2">
                <Link to={`/treinos/${w.id}/editar`} className="btn-ghost flex-1">
                  <Pencil size={16} /> Editar
                </Link>
                <button onClick={remove} className="btn-ghost flex-1 !bg-red-50 !text-red-600">
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            )}

            <div className="sticky bottom-24 z-10">
              <Link to={`/treinos/${w.id}/executar`} className="btn-primary w-full">
                <Play size={16} fill="currentColor" /> Iniciar treino
              </Link>
            </div>
          </>
        )}
      </Page>

      {info && (
        <Sheet title={info.exercise.name} onClose={() => setInfo(null)}>
          <div className="mb-3 flex items-center gap-3">
            <ExerciseIcon icon={info.exercise.icon} category={info.exercise.category} size={56} />
            <div className="text-xs text-[#6b6780]">
              <p className="font-semibold text-[#1e1b2e]">{info.exercise.muscle}</p>
              <p>{itemTarget(info.exercise.mode, info.reps, info.seconds)}</p>
              <p>≈ {info.kcal} kcal</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{info.exercise.instructions || 'Sem instruções cadastradas.'}</p>
        </Sheet>
      )}
      {toastNode}
    </>
  );
}
