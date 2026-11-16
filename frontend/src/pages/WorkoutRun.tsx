import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Pause, Play, SkipBack, SkipForward, Trophy } from 'lucide-react';
import { api, useApi, type Session, type WorkoutDetail } from '../api';
import { ErrorBox, ExerciseIcon, Header, Loading, Ring } from '../ui';
import { clock, fmtDuration } from '../util';

const SECONDS_PER_REP = 3;
type Phase = 'work' | 'rest' | 'done';

const buzz = (ms: number | number[]) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem vibração */
  }
};

export default function WorkoutRun() {
  const { id } = useParams();
  const { data, error, reload } = useApi<{ workout: WorkoutDetail }>(`/workouts/${id}`);
  if (error) return <div className="p-4"><ErrorBox message={error} onRetry={reload} /></div>;
  if (!data) return <Loading />;
  return <Runner workout={data.workout} />;
}

function Runner({ workout }: { workout: WorkoutDetail }) {
  const nav = useNavigate();
  const items = workout.items;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [tick, setTick] = useState(0); // segundos no exercício atual (ou descanso)
  const [bonusReps, setBonusReps] = useState(0); // toques manuais no contador
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Session | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const item = items[index];
  const isTime = item.exercise.mode === 'time';
  const target = isTime ? item.seconds ?? item.exercise.seconds : item.reps ?? item.exercise.reps;
  const count = isTime ? tick : Math.floor(tick / SECONDS_PER_REP) + bonusReps;

  // Mantém a tela ligada durante o treino, quando o navegador permite.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav2 = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav2.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex(i);
    setPhase('work');
    setTick(0);
    setBonusReps(0);
  }, []);

  const finishExercise = useCallback(() => {
    setDone((d) => new Set(d).add(index));
    buzz(200);
    if (index >= items.length - 1) setPhase('done');
    else if (workout.restSeconds > 0) {
      setPhase('rest');
      setTick(0);
    } else goTo(index + 1);
  }, [index, items.length, workout.restSeconds, goTo]);

  useEffect(() => {
    if (paused || phase === 'done') return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [paused, phase]);

  useEffect(() => {
    if (phase === 'work' && count >= target) finishExercise();
    if (phase === 'rest' && tick >= workout.restSeconds) {
      buzz([100, 80, 100]);
      goTo(index + 1);
    }
  }, [phase, count, target, tick, workout.restSeconds, finishExercise, goTo, index]);

  const save = useCallback(async () => {
    if (savingRef.current || done.size === 0) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const r = await api.post<{ session: Session }>('/sessions', {
        workoutId: workout.id,
        durationSec: Math.max(10, elapsed),
        exercisesDone: done.size,
      });
      setSaved(r.session);
    } catch (e) {
      setSaveError((e as Error).message);
      savingRef.current = false;
    } finally {
      setSaving(false);
    }
  }, [done.size, elapsed, workout.id]);

  useEffect(() => {
    if (phase === 'done' && !saved) save();
  }, [phase, saved, save]);

  const quit = () => {
    if (done.size === 0) {
      if (confirm('Sair sem concluir nenhum exercício? Nada será salvo.')) nav(-1);
      return;
    }
    if (confirm(`Encerrar o treino e salvar ${done.size} de ${items.length} exercícios?`)) setPhase('done');
  };

  if (phase === 'done') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-light text-brand">
          <Trophy size={44} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Treino concluído!</h1>
          <p className="mt-1 text-sm text-[#6b6780]">{workout.name}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Duração" value={fmtDuration(saved?.durationSec ?? elapsed)} />
          <Stat label="Calorias" value={saved ? `${saved.kcal} kcal` : '…'} />
          <Stat label="Exercícios" value={`${done.size}/${items.length}`} />
        </div>
        {saving && <p className="text-sm text-[#6b6780]">Salvando…</p>}
        {saveError && (
          <div className="w-full">
            <ErrorBox message={saveError} />
            <button className="btn-primary mt-3 w-full" onClick={save}>
              Tentar salvar de novo
            </button>
          </div>
        )}
        {saved && (
          <div className="w-full space-y-2">
            <p className="flex items-center justify-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 size={16} /> Salvo no seu histórico
            </p>
            <Link to="/progresso" className="btn-primary w-full">
              Ver meu progresso
            </Link>
            <Link to="/" className="btn-ghost w-full">
              Voltar ao início
            </Link>
          </div>
        )}
      </div>
    );
  }

  const resting = phase === 'rest';
  const next = items[index + 1];
  return (
    <div className="flex min-h-dvh flex-col">
      <Header title="Treino em andamento" />
      <div className="px-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ece9f5]">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(done.size / items.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-right text-[11px] text-[#8e8aa3]">
          {index + 1}/{items.length} • {clock(elapsed)}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pt-2 text-center">
        {resting ? (
          <>
            <p className="text-sm font-semibold text-brand">Descanse</p>
            <h2 className="mt-1 text-2xl font-extrabold">Próximo: {next?.exercise.name}</h2>
            <p className="text-xs text-[#8e8aa3]">Respire fundo e hidrate-se</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold">{item.exercise.name}</h2>
            <p className="text-xs text-[#8e8aa3]">{isTime ? `${target} segundos` : `${target} repetições`}</p>
          </>
        )}

        <div className="my-6">
          <ExerciseIcon icon={(resting ? next : item).exercise.icon} category={(resting ? next : item).exercise.category} size={88} />
        </div>

        <button
          className="rounded-full"
          aria-label="Contar repetição"
          disabled={resting || isTime}
          onClick={() => setBonusReps((b) => b + 1)}
        >
          <Ring value={resting ? workout.restSeconds - tick : count} max={resting ? workout.restSeconds : target} size={180} stroke={12}>
            <span className="text-5xl font-extrabold">{resting ? workout.restSeconds - tick : isTime ? target - count : count}</span>
            <span className="text-sm text-[#8e8aa3]">{resting ? 'segundos' : isTime ? 'segundos restantes' : `/ ${target}`}</span>
          </Ring>
        </button>
        {!resting && !isTime && <p className="mt-2 text-[11px] text-[#8e8aa3]">Ritmo de 1 repetição a cada {SECONDS_PER_REP}s • toque no círculo para somar</p>}
        {!resting && item.exercise.instructions && <p className="mt-3 line-clamp-3 text-xs text-[#6b6780]">{item.exercise.instructions}</p>}

        <div className="mt-6 flex items-center gap-6">
          <button
            aria-label="Anterior"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f2f9] disabled:opacity-40"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            aria-label={paused ? 'Continuar' : 'Pausar'}
            onClick={() => setPaused((p) => !p)}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_20px_rgba(108,60,233,0.45)]"
          >
            {paused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
          </button>
          <button
            aria-label={resting ? 'Pular descanso' : 'Concluir exercício'}
            onClick={() => (resting ? goTo(index + 1) : finishExercise())}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f2f9]"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>

        <button onClick={quit} className="mb-8 mt-6 text-sm font-semibold text-brand">
          Encerrar treino
        </button>
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="card p-3">
    <p className="text-[10px] text-[#8e8aa3]">{label}</p>
    <p className="text-sm font-extrabold">{value}</p>
  </div>
);
