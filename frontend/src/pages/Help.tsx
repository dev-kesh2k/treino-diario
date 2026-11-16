import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Header, Page } from '../ui';

const FAQ = [
  ['Como as calorias são calculadas?', 'Cada exercício tem um gasto médio por minuto. Multiplicamos pelo tempo de execução (exercícios de repetição contam 3 segundos por repetição) e ajustamos pelo seu peso mais recente (referência de 70 kg). Registre seu peso em Dados corporais para um cálculo mais preciso.'],
  ['Como funciona o progresso de um programa?', 'Ao começar um programa, cada treino dele que você concluir conta uma sessão. O progresso é sessões feitas ÷ (semanas × sessões por semana). Só um programa fica ativo por vez.'],
  ['Posso criar meus próprios treinos?', 'Sim. Em Treinos, toque no + , dê um nome, escolha os exercícios, ajuste repetições/segundos e a ordem. Seus treinos ficam só para você.'],
  ['Como funciona o treino em andamento?', 'Exercícios por tempo fazem contagem regressiva. Nos de repetição, o contador avança no ritmo de uma repetição a cada 3 segundos e você pode tocar no círculo para somar. Use ⏭ para concluir o exercício antes ou pular o descanso, e ⏸ para pausar.'],
  ['Encerrei o treino no meio. Ele foi salvo?', 'Sim, se você concluiu pelo menos um exercício: o treino é salvo com os exercícios feitos e as calorias correspondentes.'],
  ['Os passos são contados automaticamente?', 'Não: o navegador não tem acesso ao pedômetro. Toque no card de passos na tela inicial e informe o total mostrado no seu celular ou relógio.'],
  ['Os lembretes funcionam com o app fechado?', 'Os lembretes aparecem enquanto o app estiver aberto (aba do navegador ou atalho na tela inicial). Permita as notificações na tela de Lembretes para receber o aviso mesmo em outra aba.'],
  ['Como excluo minha conta?', 'Em Conta → Meu perfil → Excluir minha conta. Todos os seus dados (treinos, refeições, medidas) são apagados.'],
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <Header title="Ajuda e FAQ" />
      <Page>
        <div className="space-y-2">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="card overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 p-4 text-left text-sm font-semibold">
                <span className="flex-1">{q}</span>
                <ChevronDown size={17} className={`text-[#8e8aa3] transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="px-4 pb-4 text-xs leading-relaxed text-[#6b6780]">{a}</p>}
            </div>
          ))}
        </div>
      </Page>
    </>
  );
}
