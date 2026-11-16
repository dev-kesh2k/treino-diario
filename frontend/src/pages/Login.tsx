import { useState, type FormEvent } from 'react';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../auth';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-[#7c4dff] to-[#4c1fc4] px-6 pb-14 pt-16 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Dumbbell size={30} />
          </div>
          <h1 className="text-3xl font-extrabold">Treino Diário</h1>
          <p className="mt-2 text-sm text-white/80">Treinos, nutrição e progresso num só lugar. Seja constante para ter resultados!</p>
        </div>
      </div>

      <form onSubmit={submit} className="-mt-8 space-y-4 px-5">
        <div className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[#f4f2f9] p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`rounded-full py-2 text-sm font-semibold ${mode === m ? 'bg-white text-brand shadow' : 'text-[#6b6780]'}`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          {mode === 'register' && (
            <div>
              <label className="label">Nome</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
          )}
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 6 : undefined}
              required
            />
          </div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </form>
    </div>
  );
}
