// Idempotente: roda a cada publicação. Cria o admin inicial e o catálogo base
// (exercícios, programas, treinos e artigos) só quando ainda não existem.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// [nome, categoria, músculo, modo, reps, segundos, kcal/min, ícone, instruções]
const EXERCISES = [
  ['Flexão', 'superior', 'Peito e tríceps', 'reps', 12, 30, 7, 'dumbbell', 'Mãos um pouco além da largura dos ombros, corpo reto da cabeça aos pés. Desça até o peito quase tocar o chão e empurre de volta.'],
  ['Flexão inclinada', 'superior', 'Peito', 'reps', 12, 30, 5.5, 'dumbbell', 'Apoie as mãos num banco ou sofá firme. Mantenha o abdômen contraído e desça o peito até a borda.'],
  ['Flexão diamante', 'superior', 'Tríceps', 'reps', 10, 30, 7.5, 'dumbbell', 'Junte as mãos formando um losango com polegares e indicadores sob o peito. Desça com os cotovelos junto ao corpo.'],
  ['Pike push-up', 'superior', 'Ombros', 'reps', 10, 30, 7, 'dumbbell', 'Quadril elevado em "V" invertido. Flexione os cotovelos levando a cabeça em direção ao chão e volte.'],
  ['Tríceps no banco', 'superior', 'Tríceps', 'reps', 12, 30, 6, 'dumbbell', 'Mãos na borda de um banco atrás do corpo, pernas estendidas. Desça dobrando os cotovelos a 90° e suba.'],
  ['Barra fixa', 'superior', 'Costas e bíceps', 'reps', 8, 30, 9, 'dumbbell', 'Pegada pronada na largura dos ombros. Puxe até o queixo passar a barra, desça controlando.'],
  ['Remada invertida', 'superior', 'Costas', 'reps', 10, 30, 7, 'dumbbell', 'Debaixo de uma mesa firme ou barra baixa, corpo reto, puxe o peito até a borda e desça devagar.'],
  ['Agachamento', 'inferior', 'Quadríceps e glúteos', 'reps', 15, 30, 6.5, 'footprints', 'Pés na largura dos ombros. Desça levando o quadril para trás até as coxas ficarem paralelas ao chão, joelhos alinhados com os pés.'],
  ['Afundo', 'inferior', 'Pernas e glúteos', 'reps', 12, 30, 6.5, 'footprints', 'Dê um passo à frente e desça até os dois joelhos formarem 90°. Volte e alterne as pernas.'],
  ['Agachamento sumô', 'inferior', 'Adutores e glúteos', 'reps', 15, 30, 6.5, 'footprints', 'Pés bem afastados e pontas para fora. Desça com o tronco ereto e suba contraindo os glúteos.'],
  ['Agachamento com salto', 'inferior', 'Pernas (explosão)', 'reps', 12, 30, 10, 'footprints', 'Faça um agachamento e suba saltando o mais alto possível. Aterrisse suave, já descendo para a próxima.'],
  ['Ponte de glúteo', 'inferior', 'Glúteos', 'reps', 15, 30, 4.5, 'footprints', 'Deitado, joelhos dobrados. Eleve o quadril até alinhar com joelhos e ombros, segure 1 s e desça.'],
  ['Elevação de panturrilha', 'inferior', 'Panturrilhas', 'reps', 20, 30, 4, 'footprints', 'Em pé, suba na ponta dos pés o máximo possível e desça devagar. Use um degrau para mais amplitude.'],
  ['Cadeira isométrica', 'inferior', 'Quadríceps', 'time', 12, 40, 5, 'footprints', 'Costas apoiadas na parede, desça até as coxas ficarem paralelas ao chão e segure a posição.'],
  ['Afundo búlgaro', 'inferior', 'Pernas e glúteos', 'reps', 10, 30, 7.5, 'footprints', 'Pé de trás apoiado num banco. Desça o joelho de trás em direção ao chão e suba. Troque a perna na série seguinte.'],
  ['Prancha', 'core', 'Abdômen', 'time', 12, 45, 4.5, 'shield', 'Antebraços no chão, cotovelos sob os ombros e corpo reto. Contraia abdômen e glúteos e segure.'],
  ['Prancha lateral', 'core', 'Oblíquos', 'time', 12, 30, 4.5, 'shield', 'Apoie um antebraço e a lateral do pé, quadril alto, corpo alinhado. Segure e troque de lado.'],
  ['Abdominal crunch', 'core', 'Reto abdominal', 'reps', 15, 30, 5, 'shield', 'Deitado com joelhos dobrados, eleve os ombros do chão contraindo o abdômen, sem puxar o pescoço.'],
  ['Abdominal bicicleta', 'core', 'Oblíquos', 'reps', 20, 30, 6, 'shield', 'Leve o cotovelo ao joelho oposto alternando, enquanto a outra perna se estende.'],
  ['Elevação de pernas', 'core', 'Abdômen inferior', 'reps', 12, 30, 5, 'shield', 'Deitado, pernas estendidas. Eleve até 90° e desça devagar sem encostar os pés no chão.'],
  ['Russian twist', 'core', 'Oblíquos', 'reps', 20, 30, 6, 'shield', 'Sentado, tronco inclinado para trás e pés elevados. Gire o tronco tocando o chão de cada lado.'],
  ['Superman', 'core', 'Lombar', 'reps', 12, 30, 4, 'shield', 'Deitado de bruços, eleve braços e pernas ao mesmo tempo, segure 1 s e desça.'],
  ['Polichinelo', 'cardio', 'Corpo inteiro', 'time', 30, 45, 8, 'heart-pulse', 'Salte abrindo pernas e braços acima da cabeça e volte à posição inicial em ritmo constante.'],
  ['Escalador', 'cardio', 'Corpo inteiro', 'time', 20, 30, 9, 'heart-pulse', 'Em posição de prancha alta, leve os joelhos ao peito alternando rapidamente.'],
  ['Burpee', 'cardio', 'Corpo inteiro', 'reps', 10, 30, 10, 'heart-pulse', 'Agache, apoie as mãos, jogue as pernas para trás, faça uma flexão, volte e salte com os braços para cima.'],
  ['Corrida estacionária', 'cardio', 'Pernas e cardio', 'time', 30, 60, 8, 'heart-pulse', 'Corra no lugar elevando bem os joelhos e movimentando os braços.'],
  ['Skater', 'cardio', 'Pernas e equilíbrio', 'time', 20, 30, 8.5, 'heart-pulse', 'Salte lateralmente de uma perna para a outra, cruzando a perna de trás, como um patinador.'],
  ['Pular corda', 'cardio', 'Corpo inteiro', 'time', 60, 60, 11, 'heart-pulse', 'Saltos baixos na ponta dos pés, girando a corda com os punhos. Sem corda, simule o movimento.'],
];

// Programas e seus treinos: [nome, [[exercício, reps|null, segundos|null], ...], descrição, nível, descanso]
const PROGRAMS = [
  {
    name: 'Queima de Gordura', goal: 'perder-peso', level: 'Intermediário', weeks: 4, sessionsPerWeek: 3, color: 'orange',
    description: 'Treinos intervalados de alta intensidade para acelerar o metabolismo e queimar gordura em 4 semanas.',
    workouts: [
      ['HIIT Queima Total', [['Polichinelo', null, 45], ['Burpee', 10], ['Escalador', null, 30], ['Agachamento com salto', 12], ['Skater', null, 30], ['Prancha', null, 40]], 'Circuito intenso para elevar a frequência cardíaca.', 'Intermediário', 15],
      ['Cardio Express', [['Corrida estacionária', null, 60], ['Polichinelo', null, 45], ['Escalador', null, 30], ['Pular corda', null, 60], ['Burpee', 8]], 'Cardio rápido para dias corridos.', 'Intermediário', 20],
      ['Full Body Queima', [['Agachamento', 15], ['Flexão', 12], ['Afundo', 12], ['Escalador', null, 30], ['Abdominal bicicleta', 20], ['Polichinelo', null, 45]], 'Corpo inteiro com foco em gasto calórico.', 'Intermediário', 20],
    ],
  },
  {
    name: 'Ganho de Massa', goal: 'ganhar-massa', level: 'Avançado', weeks: 6, sessionsPerWeek: 4, color: 'violet',
    description: 'Treinos de força com o peso do corpo e progressão de volume para hipertrofia.',
    workouts: [
      ['Empurrar (Peito e Ombro)', [['Flexão', 15], ['Flexão diamante', 12], ['Pike push-up', 10], ['Flexão inclinada', 15], ['Tríceps no banco', 15]], 'Peito, ombros e tríceps.', 'Avançado', 45],
      ['Puxar (Costas e Bíceps)', [['Barra fixa', 8], ['Remada invertida', 12], ['Superman', 15], ['Barra fixa', 6], ['Remada invertida', 10]], 'Costas e bíceps.', 'Avançado', 45],
      ['Pernas Força', [['Agachamento', 20], ['Afundo búlgaro', 12], ['Agachamento sumô', 20], ['Ponte de glúteo', 20], ['Elevação de panturrilha', 25], ['Cadeira isométrica', null, 60]], 'Quadríceps, glúteos e panturrilhas.', 'Avançado', 45],
    ],
  },
  {
    name: 'Abdômen Definido', goal: 'definicao', level: 'Intermediário', weeks: 4, sessionsPerWeek: 3, color: 'sky',
    description: 'Fortaleça o core e defina o abdômen com séries progressivas.',
    workouts: [
      ['Core Essencial', [['Prancha', null, 40], ['Abdominal crunch', 15], ['Abdominal bicicleta', 20], ['Elevação de pernas', 12], ['Prancha lateral', null, 30]], 'Base sólida para o abdômen.', 'Intermediário', 20],
      ['Core Avançado', [['Prancha', null, 60], ['Russian twist', 24], ['Elevação de pernas', 15], ['Escalador', null, 40], ['Prancha lateral', null, 45], ['Superman', 15]], 'Mais tempo sob tensão.', 'Avançado', 20],
    ],
  },
  {
    name: 'Programa Iniciante', goal: 'iniciante', level: 'Iniciante', weeks: 3, sessionsPerWeek: 3, color: 'emerald',
    description: 'Comece do zero com movimentos básicos, técnica e progressão segura.',
    workouts: [
      ['Primeiros Passos', [['Polichinelo', null, 30], ['Agachamento', 10], ['Flexão inclinada', 8], ['Ponte de glúteo', 12], ['Prancha', null, 20]], 'Seu primeiro treino: leve e completo.', 'Iniciante', 30],
      ['Corpo Inteiro Leve', [['Corrida estacionária', null, 40], ['Afundo', 8], ['Flexão inclinada', 10], ['Abdominal crunch', 12], ['Superman', 10]], 'Movimentos básicos para criar o hábito.', 'Iniciante', 30],
    ],
  },
  {
    name: 'Tonificação Corporal', goal: 'definicao', level: 'Intermediário', weeks: 4, sessionsPerWeek: 3, color: 'rose',
    description: 'Combine força e cardio para tonificar braços, pernas e glúteos.',
    workouts: [
      ['Full Body Workout', [['Polichinelo', null, 45], ['Flexão', 12], ['Agachamento', 15], ['Prancha', null, 45], ['Afundo', 12], ['Escalador', null, 30], ['Ponte de glúteo', 15], ['Abdominal bicicleta', 20]], 'Treino de corpo inteiro para queimar calorias e ganhar força.', 'Intermediário', 20],
      ['Pernas e Glúteos', [['Agachamento sumô', 15], ['Afundo', 12], ['Ponte de glúteo', 20], ['Cadeira isométrica', null, 45], ['Elevação de panturrilha', 20]], 'Inferiores com foco em glúteos.', 'Intermediário', 20],
    ],
  },
];

const ARTICLES = [
  {
    slug: 'barriga-chapada', title: '7 dicas para perder gordura abdominal', category: 'Emagrecimento', minutes: 4,
    summary: 'Não existe queima localizada, mas estas atitudes funcionam.',
    body: `1. Déficit calórico: perder gordura (inclusive na barriga) depende de gastar mais do que você consome. Registre suas refeições na aba Nutrição.
2. Proteína em todas as refeições: aumenta a saciedade e preserva massa muscular. Mire em 1,6 g por kg de peso.
3. Treine força 3x por semana: músculo gasta energia até em repouso.
4. Some cardio intervalado (HIIT): sessões curtas e intensas elevam o gasto calórico.
5. Durma 7–9 horas: pouco sono aumenta a fome e o cortisol.
6. Reduza ultraprocessados e bebidas açucaradas: são calorias que não saciam.
7. Seja constante: a sequência de dias treinando importa mais do que treinos perfeitos.`,
  },
  {
    slug: 'hidratacao', title: 'Quanta água beber por dia?', category: 'Nutrição', minutes: 3,
    summary: 'Hidratação adequada melhora desempenho e recuperação.',
    body: `Uma referência simples é 35 ml por kg de peso corporal por dia. Uma pessoa de 70 kg precisa de cerca de 2,4 litros.
Em dias de treino, acrescente 500 ml a 1 litro, principalmente no calor.
Sinais de desidratação: urina escura, dor de cabeça, cansaço e queda de rendimento.
Dica: registre cada copo na aba Água e ajuste sua meta em Conta → Metas.`,
  },
  {
    slug: 'aquecimento', title: 'Por que aquecer antes do treino', category: 'Treino', minutes: 3,
    summary: '5 minutos que reduzem lesões e melhoram o desempenho.',
    body: `O aquecimento aumenta a temperatura muscular, a lubrificação das articulações e a frequência cardíaca de forma gradual.
Sugestão de 5 minutos: 1 min de corrida estacionária, 1 min de polichinelo, 10 agachamentos lentos, 10 rotações de braços e 30 s de prancha.
Prefira alongamentos dinâmicos antes do treino e os estáticos depois.`,
  },
  {
    slug: 'descanso', title: 'Descanso também é treino', category: 'Recuperação', minutes: 3,
    summary: 'Os músculos crescem na recuperação, não durante o treino.',
    body: `Durante o treino criamos microlesões nas fibras musculares; é no descanso que o corpo as reconstrói mais fortes.
Dê 48 horas de intervalo para o mesmo grupo muscular em treinos intensos.
Dias de descanso ativo (caminhada, alongamento, mobilidade) ajudam na recuperação.
Sinais de excesso: dores que não passam, queda de desempenho, insônia e irritabilidade.`,
  },
];

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@treinodiario.app').trim().toLowerCase();
  // Sem senha no código (o repositório é público): o deploy do Hub gera uma e guarda só no .env do servidor.
  const password = String(process.env.SEED_ADMIN_PASSWORD || '');
  if (!password) console.warn('SEED_ADMIN_PASSWORD não definido: admin inicial não criado.');
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';

  if (password && (await prisma.user.count({ where: { role: 'admin' } })) === 0) {
    await prisma.user.upsert({
      where: { email },
      update: { role: 'admin' },
      create: { email, name, role: 'admin', passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Admin criado: ${email}`);
  }

  for (const [n, category, muscle, mode, reps, seconds, kcalPerMin, icon, instructions] of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: n },
      update: {},
      create: { name: n, category, muscle, mode, reps, seconds, kcalPerMin, icon, instructions },
    });
  }
  const exercises = new Map((await prisma.exercise.findMany()).map((e) => [e.name, e]));

  if ((await prisma.program.count()) === 0) {
    for (const [sort, p] of PROGRAMS.entries()) {
      const { workouts, ...data } = p;
      const program = await prisma.program.create({ data: { ...data, sort } });
      for (const [i, [wName, items, description, level, restSeconds]] of workouts.entries()) {
        await prisma.workout.create({
          data: {
            name: wName,
            description,
            level,
            restSeconds,
            programId: program.id,
            sort: sort * 10 + i,
            items: {
              create: items.map(([exName, reps, secs], position) => {
                const ex = exercises.get(exName);
                if (!ex) throw new Error(`Exercício desconhecido no seed: ${exName}`);
                return { exerciseId: ex.id, position, reps: ex.mode === 'reps' ? reps : null, seconds: ex.mode === 'time' ? secs : null };
              }),
            },
          },
        });
      }
    }
    console.log('Programas e treinos criados');
  }

  for (const a of ARTICLES) {
    await prisma.article.upsert({ where: { slug: a.slug }, update: {}, create: a });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
