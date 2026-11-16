import { useState } from 'react';
import { api, type User } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, Header, Page, useToast } from '../ui';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState({
    name: user!.name,
    email: user!.email,
    gender: user!.gender,
    birthYear: user!.birthYear?.toString() || '',
    heightCm: user!.heightCm?.toString() || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const { toast, toastNode } = useToast();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError('');
    try {
      const r = await api.put<{ user: User }>('/me', f);
      setUser(r.user);
      toast('Perfil atualizado');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const changePw = async () => {
    setPwError('');
    try {
      await api.put('/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast('Senha alterada');
    } catch (e) {
      setPwError((e as Error).message);
    }
  };

  const deleteAccount = async () => {
    const password = prompt('Para excluir sua conta e TODOS os seus dados, digite sua senha:');
    if (!password) return;
    try {
      await api.del('/me', { password });
      logout();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <>
      <Header title="Meu perfil" />
      <Page>
        <section className="card space-y-3 p-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Sexo</label>
              <select className="input !px-2" value={f.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </div>
            <div>
              <label className="label">Nascimento</label>
              <input className="input" inputMode="numeric" placeholder="Ano" value={f.birthYear} onChange={(e) => set('birthYear', e.target.value)} />
            </div>
            <div>
              <label className="label">Altura (cm)</label>
              <input className="input" inputMode="decimal" value={f.heightCm} onChange={(e) => set('heightCm', e.target.value)} />
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          <button className="btn-primary w-full" onClick={save}>
            Salvar perfil
          </button>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-bold">Alterar senha</h2>
          <input className="input" type="password" placeholder="Senha atual" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          <input className="input" type="password" placeholder="Nova senha (mín. 6)" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          {pwError && <ErrorBox message={pwError} />}
          <button className="btn-ghost w-full" onClick={changePw} disabled={!pw.currentPassword || !pw.newPassword}>
            Alterar senha
          </button>
        </section>

        <button onClick={deleteAccount} className="w-full py-2 text-center text-xs font-semibold text-red-600">
          Excluir minha conta
        </button>
      </Page>
      {toastNode}
    </>
  );
}
