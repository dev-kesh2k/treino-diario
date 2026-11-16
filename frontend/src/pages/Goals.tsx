import { useState } from 'react';
import { api, type User } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, Header, Page, useToast } from '../ui';

const FIELDS: { key: keyof User; label: string; hint: string }[] = [
  { key: 'weeklyGoal', label: 'Treinos por semana', hint: '1 a 14' },
  { key: 'burnGoal', label: 'Calorias queimadas por dia (kcal)', hint: 'Anel da tela inicial' },
  { key: 'calorieGoal', label: 'Calorias consumidas por dia (kcal)', hint: 'Usado em Nutrição' },
  { key: 'waterGoalMl', label: 'Água por dia (ml)', hint: 'Sugestão: 35 ml × seu peso' },
  { key: 'stepsGoal', label: 'Passos por dia', hint: '' },
  { key: 'goalWeightKg', label: 'Peso meta (kg)', hint: 'Opcional' },
];

export default function Goals() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [...FIELDS.map((x) => x.key), 'carbsPct', 'proteinPct', 'fatPct'].map((k) => [k, user![k as keyof User]?.toString() ?? '']),
    ),
  );
  const [error, setError] = useState('');
  const { toast, toastNode } = useToast();
  const macroSum = Number(f.carbsPct || 0) + Number(f.proteinPct || 0) + Number(f.fatPct || 0);

  const save = async () => {
    setError('');
    try {
      const r = await api.put<{ user: User }>('/me', f);
      setUser(r.user);
      toast('Metas salvas');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <Header title="Metas" />
      <Page>
        <section className="card space-y-3 p-4">
          {FIELDS.map((x) => (
            <div key={x.key}>
              <label className="label">{x.label}</label>
              <input className="input" inputMode="decimal" value={f[x.key]} onChange={(e) => setF({ ...f, [x.key]: e.target.value })} />
              {x.hint && <p className="mt-0.5 text-[10px] text-[#8e8aa3]">{x.hint}</p>}
            </div>
          ))}
        </section>
        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-bold">Divisão de macronutrientes (%)</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['carbsPct', 'Carbo'],
              ['proteinPct', 'Proteína'],
              ['fatPct', 'Gordura'],
            ].map(([k, l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <p className={`text-[11px] ${macroSum === 100 ? 'text-[#8e8aa3]' : 'text-red-600'}`}>Soma: {macroSum}% (precisa ser 100%)</p>
        </section>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save}>
          Salvar metas
        </button>
      </Page>
      {toastNode}
    </>
  );
}
