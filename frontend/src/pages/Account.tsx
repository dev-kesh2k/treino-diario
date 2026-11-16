import { Link } from 'react-router-dom';
import { Apple, Bell, ChevronRight, CircleHelp, History, LogOut, Ruler, Target, Trophy, User, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { Header, Page } from '../ui';

export default function Account() {
  const { user, logout } = useAuth();
  const initials = user!.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const items = [
    { to: '/conta/perfil', label: 'Meu perfil', icon: User },
    { to: '/conta/corpo', label: 'Dados corporais', icon: Ruler },
    { to: '/conta/metas', label: 'Metas', icon: Target },
    { to: '/nutricao', label: 'Nutrição', icon: Apple },
    { to: '/conquistas', label: 'Conquistas', icon: Trophy },
    { to: '/conta/historico', label: 'Histórico de treinos', icon: History },
    { to: '/conta/lembretes', label: 'Lembretes', icon: Bell },
    { to: '/conta/ajuda', label: 'Ajuda e FAQ', icon: CircleHelp },
    ...(user!.role === 'admin' ? [{ to: '/conta/usuarios', label: 'Usuários (admin)', icon: Users }] : []),
  ];

  return (
    <>
      <Header title="Minha conta" back={false} />
      <Page>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#7c4dff] to-[#4c1fc4] text-2xl font-extrabold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{user!.name}</p>
            <p className="truncate text-xs text-[#8e8aa3]">{user!.email}</p>
            <span className="mt-1 inline-block rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
              {user!.role === 'admin' ? 'Administrador' : 'Membro'}
            </span>
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold">Menu</h2>
          <div className="card divide-y divide-[#f1eff6]">
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm">
                <Icon size={19} className="text-[#4b4760]" />
                <span className="flex-1 font-medium">{label}</span>
                <ChevronRight size={17} className="text-[#8e8aa3]" />
              </Link>
            ))}
          </div>
        </section>

        <button onClick={() => confirm('Sair da sua conta?') && logout()} className="card flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium">
          <LogOut size={19} className="text-red-500" />
          Sair
        </button>
      </Page>
    </>
  );
}
