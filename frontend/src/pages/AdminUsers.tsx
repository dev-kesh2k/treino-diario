import { api, useApi } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, Header, Loading, Page, useToast } from '../ui';

interface Row {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: string;
  sessions: number;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<{ users: Row[] }>(user?.role === 'admin' ? '/admin/users' : null);
  const { toast, toastNode } = useToast();

  const setRole = async (u: Row) => {
    const role = u.role === 'admin' ? 'member' : 'admin';
    if (!confirm(`${role === 'admin' ? 'Tornar' : 'Remover'} ${u.name} ${role === 'admin' ? 'administrador' : 'dos administradores'}?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/role`, { role });
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  if (user?.role !== 'admin') return <Page><ErrorBox message="Apenas administradores." /></Page>;

  return (
    <>
      <Header title="Usuários" />
      <Page>
        <p className="text-xs text-[#6b6780]">Administradores podem cadastrar exercícios e treinos públicos para todos.</p>
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        <div className="card divide-y divide-[#f1eff6]">
          {data?.users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-[11px] text-[#8e8aa3]">
                  {u.email} • {u.sessions} treinos • desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setRole(u)}
                disabled={u.id === user.id}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-60 ${u.role === 'admin' ? 'bg-brand text-white' : 'bg-[#f4f2f9] text-[#4b4760]'}`}
              >
                {u.role === 'admin' ? 'Admin' : 'Membro'}
              </button>
            </div>
          ))}
        </div>
      </Page>
      {toastNode}
    </>
  );
}
