import { CalendarCheck, Clock, Dumbbell, Flame, Lock, Star } from 'lucide-react';
import { useApi } from '../api';
import { ErrorBox, Header, iconFor, Loading, Page } from '../ui';
import { fmt } from '../util';

interface Badge {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  value: number;
  target: number;
  earned: boolean;
}
interface Data {
  badges: Badge[];
  stats: { totalWorkouts: number; totalKcal: number; totalMinutes: number; currentStreak: number; longestStreak: number };
}

const BADGE_BG: Record<string, string> = {
  violet: 'from-violet-400 to-violet-600',
  amber: 'from-amber-300 to-amber-500',
  orange: 'from-orange-400 to-orange-600',
  rose: 'from-rose-400 to-rose-600',
  sky: 'from-sky-400 to-sky-600',
  yellow: 'from-yellow-300 to-yellow-500',
  emerald: 'from-emerald-400 to-emerald-600',
  cyan: 'from-cyan-400 to-cyan-600',
  teal: 'from-teal-400 to-teal-600',
  fuchsia: 'from-fuchsia-400 to-fuchsia-600',
};

export default function Achievements() {
  const { data, error, loading, reload } = useApi<Data>('/achievements');
  const earned = data?.badges.filter((b) => b.earned).length ?? 0;

  return (
    <>
      <Header title="Conquistas" />
      <Page>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c4dff] to-[#4c1fc4] p-5 text-white">
              <Star className="absolute right-4 top-4 text-yellow-300" size={56} fill="currentColor" />
              <p className="text-lg font-extrabold">{earned ? 'Continue assim!' : 'Comece hoje!'}</p>
              <p className="text-xs text-white/80">
                {earned} de {data.badges.length} medalhas conquistadas
              </p>
            </div>

            <section>
              <h2 className="mb-3 text-sm font-bold">Medalhas</h2>
              <div className="grid grid-cols-3 gap-3">
                {data.badges.map((b) => {
                  const Icon = iconFor(b.icon);
                  return (
                    <div key={b.key} className="flex flex-col items-center text-center" title={b.description}>
                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow ${
                          b.earned ? BADGE_BG[b.color] || BADGE_BG.violet : 'from-[#e6e3ef] to-[#d5d1e2]'
                        }`}
                      >
                        <Icon size={28} />
                        {!b.earned && <Lock size={14} className="absolute bottom-1 right-1 text-[#8e8aa3]" />}
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold leading-tight">{b.title}</p>
                      <p className="text-[10px] text-[#8e8aa3]">{b.earned ? 'Conquistada' : `${fmt(b.value)}/${fmt(b.target)}`}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-bold">Estatísticas</h2>
              <div className="card divide-y divide-[#f1eff6]">
                <Row icon={Dumbbell} label="Total de treinos" value={`${fmt(data.stats.totalWorkouts)} sessões`} />
                <Row icon={Flame} label="Total de calorias" value={`${fmt(data.stats.totalKcal)} kcal`} />
                <Row icon={Clock} label="Tempo total" value={data.stats.totalMinutes >= 60 ? `${fmt(data.stats.totalMinutes / 60, 1)} h` : `${data.stats.totalMinutes} min`} />
                <Row icon={CalendarCheck} label="Sequência atual" value={`${data.stats.currentStreak} dias`} />
                <Row icon={Star} label="Maior sequência" value={`${data.stats.longestStreak} dias`} />
              </div>
            </section>
          </>
        )}
      </Page>
    </>
  );
}

const Row = ({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 text-sm">
    <Icon size={18} className="text-[#6b6780]" />
    <span className="flex-1">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
