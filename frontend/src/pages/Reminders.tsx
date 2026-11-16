import { useState } from 'react';
import { Bell, BellRing, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, useApi } from '../api';
import { Empty, ErrorBox, Header, Loading, Page, Sheet, useToast } from '../ui';
import { WEEKDAYS } from '../util';

interface Reminder {
  id: string;
  label: string;
  time: string;
  days: string;
  enabled: boolean;
}

const changed = () => window.dispatchEvent(new Event('reminders-changed'));

export default function Reminders() {
  const { data, error, loading, reload } = useApi<{ reminders: Reminder[] }>('/reminders');
  const [edit, setEdit] = useState<Partial<Reminder> | null>(null);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const { toast, toastNode } = useToast();

  const toggle = async (r: Reminder) => {
    try {
      await api.put(`/reminders/${r.id}`, { ...r, enabled: !r.enabled });
      await reload();
      changed();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const remove = async (r: Reminder) => {
    if (!confirm(`Excluir o lembrete "${r.label}"?`)) return;
    try {
      await api.del(`/reminders/${r.id}`);
      await reload();
      changed();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <>
      <Header
        title="Lembretes"
        right={
          <button aria-label="Novo lembrete" onClick={() => setEdit({ label: 'Hora de treinar!', time: '07:00', days: '12345', enabled: true })} className="rounded-full bg-brand p-1.5 text-white">
            <Plus size={18} />
          </button>
        }
      />
      <Page>
        <div className="rounded-2xl bg-brand-light p-4 text-xs text-[#4b4760]">
          Os lembretes aparecem enquanto o Treino Diário estiver aberto (em uma aba ou adicionado à tela inicial).
          {perm === 'default' && (
            <button
              className="mt-2 flex items-center gap-1 font-semibold text-brand"
              onClick={() => Notification.requestPermission().then(setPerm)}
            >
              <BellRing size={14} /> Permitir notificações do navegador
            </button>
          )}
          {perm === 'granted' && <p className="mt-1 font-semibold text-emerald-700">Notificações do navegador permitidas.</p>}
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && !data.reminders.length && <Empty icon={Bell} text="Nenhum lembrete. Toque no + para criar." />}
        <div className="space-y-2">
          {data?.reminders.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className={`text-2xl font-extrabold ${r.enabled ? '' : 'text-[#c9c3e0]'}`}>{r.time}</p>
                <p className="truncate text-xs font-semibold">{r.label}</p>
                <p className="text-[10px] text-[#8e8aa3]">{r.days.length === 7 ? 'Todos os dias' : r.days.split('').map((d) => WEEKDAYS[+d]).join(', ')}</p>
              </div>
              <button aria-label="Editar" onClick={() => setEdit(r)} className="p-1.5 text-[#8e8aa3]">
                <Pencil size={16} />
              </button>
              <button aria-label="Excluir" onClick={() => remove(r)} className="p-1.5 text-red-500">
                <Trash2 size={16} />
              </button>
              <button
                role="switch"
                aria-checked={r.enabled}
                aria-label="Ativar lembrete"
                onClick={() => toggle(r)}
                className={`relative h-7 w-12 rounded-full transition ${r.enabled ? 'bg-brand' : 'bg-[#d9d5e6]'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${r.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Page>

      {edit && (
        <ReminderForm
          initial={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            reload();
            changed();
            toast('Lembrete salvo');
          }}
        />
      )}
      {toastNode}
    </>
  );
}

function ReminderForm({ initial, onClose, onSaved }: { initial: Partial<Reminder>; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ label: initial.label || '', time: initial.time || '07:00', days: initial.days || '', enabled: initial.enabled ?? true });
  const [error, setError] = useState('');
  const toggleDay = (d: number) =>
    setF((x) => ({ ...x, days: x.days.includes(String(d)) ? x.days.replace(String(d), '') : `${x.days}${d}` }));

  const save = async () => {
    setError('');
    try {
      if (initial.id) await api.put(`/reminders/${initial.id}`, f);
      else await api.post('/reminders', f);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Sheet title={initial.id ? 'Editar lembrete' : 'Novo lembrete'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Mensagem</label>
          <input className="input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        </div>
        <div>
          <label className="label">Horário</label>
          <input className="input" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
        </div>
        <div>
          <label className="label">Dias</label>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                onClick={() => toggleDay(i)}
                className={`rounded-lg py-2 text-[11px] font-semibold ${f.days.includes(String(i)) ? 'bg-brand text-white' : 'bg-[#f4f2f9] text-[#6b6780]'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        {error && <ErrorBox message={error} />}
        <button className="btn-primary w-full" onClick={save}>
          Salvar
        </button>
      </div>
    </Sheet>
  );
}
