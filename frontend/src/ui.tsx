import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  ChevronLeft,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  House,
  LoaderCircle,
  Medal,
  ChartColumn,
  Scale,
  Shield,
  Timer,
  Trophy,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { api } from './api';

const TABS = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/programas', label: 'Programas', icon: CalendarDays },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell },
  { to: '/progresso', label: 'Progresso', icon: ChartColumn },
  { to: '/conta', label: 'Conta', icon: User },
];

export function TabLayout() {
  const reminder = useReminders();
  return (
    <div className="min-h-dvh pb-24">
      <Outlet />
      {reminder}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md md:max-w-2xl xl:max-w-3xl border-t border-[#efedf5] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-brand' : 'text-[#8e8aa3]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 1.8} fill={isActive ? 'rgba(108,60,233,0.15)' : 'none'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Header({ title, back = true, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white/95 px-4 backdrop-blur">
      <div className="w-10">
        {back && (
          <button aria-label="Voltar" onClick={() => nav(-1)} className="-ml-2 rounded-full p-2 active:bg-[#f4f2f9]">
            <ChevronLeft size={22} />
          </button>
        )}
      </div>
      <h1 className="truncate text-base font-bold">{title}</h1>
      <div className="flex w-10 justify-end">{right}</div>
    </header>
  );
}

export const Page = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`space-y-5 px-4 py-4 ${className}`}>{children}</div>
);

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-brand">
      <LoaderCircle className="animate-spin" size={28} />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-semibold underline">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export const Empty = ({ icon: Icon = Dumbbell, text }: { icon?: LucideIcon; text: string }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[#8e8aa3]">
    <Icon size={32} className="text-[#c9c3e0]" />
    {text}
  </div>
);

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-bold">{title}</h2>
      {action && <div className="text-xs font-semibold text-brand">{action}</div>}
    </div>
  );
}

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-[#ece9f5] ${className}`}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

/** Anel de progresso. */
export function Ring({
  value,
  max,
  size = 120,
  stroke = 10,
  color = '#6c3ce9',
  track = '#ece9f5',
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1.5 active:bg-[#f4f2f9]">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  footprints: Footprints,
  shield: Shield,
  'heart-pulse': HeartPulse,
  flame: Flame,
  zap: Zap,
  medal: Medal,
  trophy: Trophy,
  timer: Timer,
  droplet: Droplet,
  scale: Scale,
  award: Award,
};
export const iconFor = (name: string) => ICONS[name] || Dumbbell;

export const CATEGORY_STYLE: Record<string, string> = {
  superior: 'bg-violet-100 text-violet-700',
  inferior: 'bg-sky-100 text-sky-700',
  core: 'bg-amber-100 text-amber-700',
  cardio: 'bg-rose-100 text-rose-700',
};

export function ExerciseIcon({ icon, category, size = 48 }: { icon: string; category: string; size?: number }) {
  const Icon = iconFor(icon);
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl ${CATEGORY_STYLE[category] || 'bg-brand-light text-brand'}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.45} />
    </div>
  );
}

export const PROGRAM_GRADIENT: Record<string, string> = {
  violet: 'from-[#7c4dff] to-[#4c1fc4]',
  orange: 'from-[#ff8a3d] to-[#e6502a]',
  sky: 'from-[#38bdf8] to-[#2563eb]',
  emerald: 'from-[#34d399] to-[#059669]',
  rose: 'from-[#fb7185] to-[#be185d]',
};

export function ProgramCover({ color, size = 64, icon: Icon = Dumbbell }: { color: string; size?: number; icon?: LucideIcon }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${PROGRAM_GRADIENT[color] || PROGRAM_GRADIENT.violet}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.42} />
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-[#1e1b2e] px-4 py-2.5 text-center text-sm text-white shadow-lg">
      {msg}
    </div>
  ) : null;
  return { toast: setMsg, toastNode: node };
}

interface Reminder {
  id: string;
  label: string;
  time: string;
  days: string;
  enabled: boolean;
}

/** Dispara os lembretes enquanto o app estiver aberto (notificação do navegador ou aviso na tela). */
function useReminders() {
  const [active, setActive] = useState<Reminder | null>(null);
  useEffect(() => {
    let reminders: Reminder[] = [];
    let stop = false;
    const load = () =>
      api
        .get<{ reminders: Reminder[] }>('/reminders')
        .then((r) => (reminders = r.reminders))
        .catch(() => {});
    const tick = () => {
      if (stop) return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const r of reminders) {
        if (!r.enabled || r.time !== hhmm || !r.days.includes(String(now.getDay()))) continue;
        const key = `treino-diario:reminder:${r.id}:${now.toDateString()}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, '1');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Treino Diário', { body: r.label });
        }
        setActive(r);
      }
    };
    load();
    const reloadId = setInterval(load, 5 * 60000);
    const tickId = setInterval(tick, 20000);
    window.addEventListener('reminders-changed', load);
    return () => {
      stop = true;
      clearInterval(reloadId);
      clearInterval(tickId);
      window.removeEventListener('reminders-changed', load);
    };
  }, []);
  if (!active) return null;
  return (
    <Sheet title="Lembrete" onClose={() => setActive(null)}>
      <p className="mb-4 text-sm">{active.label}</p>
      <button className="btn-primary w-full" onClick={() => setActive(null)}>
        Ok, vamos lá!
      </button>
    </Sheet>
  );
}
