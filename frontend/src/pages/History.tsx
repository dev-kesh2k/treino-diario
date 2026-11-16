import { Link } from 'react-router-dom';
import { Dumbbell, Trash2 } from 'lucide-react';
import { api, useApi, type Session } from '../api';
import { Empty, ErrorBox, Header, Loading, Page, useToast } from '../ui';
import { dayLabel, fmtDuration } from '../util';

export default function History() {
  const { data, error, loading, reload } = useApi<{ sessions: Session[] }>('/sessions?limit=200');
  const { toast, toastNode } = useToast();

  const remove = async (s: Session) => {
    if (!confirm(`Excluir o registro de "${s.name}" (${dayLabel(s.day)})?`)) return;
    try {
      await api.del(`/sessions/${s.id}`);
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <>
      <Header title="Histórico de treinos" />
      <Page>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && !data.sessions.length && <Empty text="Você ainda não concluiu nenhum treino." />}
        <div className="space-y-2">
          {data?.sessions.map((s) => (
            <div key={s.id} className="card flex items-center gap-3 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Dumbbell size={20} />
              </div>
              {s.workoutId ? (
                <Link to={`/treinos/${s.workoutId}`} className="min-w-0 flex-1">
                  <Info s={s} />
                </Link>
              ) : (
                <div className="min-w-0 flex-1">
                  <Info s={s} />
                </div>
              )}
              <button aria-label="Excluir" onClick={() => remove(s)} className="p-1.5 text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Page>
      {toastNode}
    </>
  );
}

const Info = ({ s }: { s: Session }) => (
  <>
    <p className="truncate text-sm font-bold">{s.name}</p>
    <p className="text-[11px] text-[#8e8aa3]">
      {dayLabel(s.day)} • {fmtDuration(s.durationSec)} • {s.kcal} kcal • {s.exercisesDone}/{s.exercisesTotal} exercícios
    </p>
  </>
);
