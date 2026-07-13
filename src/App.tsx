import { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { PainelBomba } from './components/PainelBomba';
import { SetorCard } from './components/SetorCard';
import { PerfilSolo } from './components/PerfilSolo';
import { supabase } from './lib/supabaseClient';
import { listarSetores, salvarConfigSetor, definirStatusSetor } from './lib/setores';
import { obterEstado, definirModoOperacao } from './lib/estadoSistema';
import { obterUltimaLeitura } from './lib/leituras';
import { alternarRele, listarReles, type Rele } from './lib/reles';
import type { EstadoSistema, LeituraSensor, Setor, StatusSetor } from './types';

const SETORES_DEMO: Setor[] = [
  { id: 1, nome: 'Setor 1', releIndex: 1, janelas: [{ id: '1-0', inicio: '06:00', fim: '06:20' }], diasSemana: [1, 3, 5], ativo: true, status: 'aguardando' },
  { id: 2, nome: 'Setor 2', releIndex: 2, janelas: [{ id: '2-0', inicio: '06:25', fim: '06:45' }], diasSemana: [1, 3, 5], ativo: true, status: 'aguardando' },
  { id: 3, nome: 'Setor 3', releIndex: 3, janelas: [{ id: '3-0', inicio: '06:50', fim: '07:15' }], diasSemana: [1, 3, 5], ativo: true, status: 'ativo', progressoMinutos: 8 },
  { id: 4, nome: 'Setor 4', releIndex: 4, janelas: [{ id: '4-0', inicio: '07:20', fim: '07:40' }], diasSemana: [2, 4, 6], ativo: true, status: 'aguardando' },
  { id: 5, nome: 'Setor 5', releIndex: 5, janelas: [{ id: '5-0', inicio: '07:45', fim: '08:05' }], diasSemana: [2, 4, 6], ativo: false, status: 'desligado' },
  {
    id: 6,
    nome: 'Setor 6',
    releIndex: 6,
    janelas: [
      { id: '6-0', inicio: '06:00', fim: '06:30' },
      { id: '6-1', inicio: '18:00', fim: '18:30' },
    ],
    diasSemana: [2, 4, 6],
    ativo: true,
    status: 'aguardando',
  },
];

const LEITURA_DEMO: LeituraSensor = {
  timestamp: new Date().toISOString(),
  umidade: 58,
  temperatura: 24.3,
  ec: 1.3,
  ph: 6.1,
  nitrogenio: 32,
  fosforo: 14,
  potassio: 168,
};

const ESTADO_DEMO: EstadoSistema = {
  online: true,
  ultimaSincronizacao: new Date().toISOString(),
  bombaLigada: true,
  modoOperacao: 'sequencial',
  maxSetoresSimultaneos: 1,
};

const INTERVALO_POLL_MS = 5000;
const TIMEOUT_CONFIRMACAO_MS = 15000; // acima do ciclo do firmware (5s), com folga

function calcularFalhaComunicacao(setor: Setor, relesPorIndex: Map<number, Rele>, estado: EstadoSistema): boolean {
  const rele = relesPorIndex.get(setor.releIndex);
  if (!rele || !rele.comando_em) return false;

  const comandoEm = new Date(rele.comando_em).getTime();
  const decorrido = Date.now() - comandoEm;
  if (decorrido < TIMEOUT_CONFIRMACAO_MS) return false; // ainda dentro do prazo normal

  const ultimaSinc = estado.ultimaSincronizacao ? new Date(estado.ultimaSincronizacao).getTime() : 0;
  return ultimaSinc < comandoEm; // a placa nao sincronizou depois desse comando
}

function App() {
  const demo = !supabase;

  const [setores, setSetores] = useState<Setor[]>(SETORES_DEMO);
  const [leitura, setLeitura] = useState<LeituraSensor | null>(LEITURA_DEMO);
  const [estado, setEstado] = useState<EstadoSistema>(ESTADO_DEMO);
  const [reles, setReles] = useState<Rele[]>([]);

  useEffect(() => {
    if (demo) return;

    let ativo = true;

    async function sincronizar() {
      const [novosSetores, novoEstado, novaLeitura, novosReles] = await Promise.all([
        listarSetores(),
        obterEstado(),
        obterUltimaLeitura(),
        listarReles(),
      ]);
      if (!ativo) return;
      if (novosSetores.length > 0) setSetores(novosSetores);
      if (novoEstado) setEstado(novoEstado);
      if (novaLeitura) setLeitura(novaLeitura);
      if (novosReles.length > 0) setReles(novosReles);
    }

    sincronizar();
    const intervalo = setInterval(sincronizar, INTERVALO_POLL_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [demo]);

  const relesPorIndex = new Map(reles.map((r) => [r.id, r]));

  const atualizarSetor = (novo: Setor) => {
    setSetores((prev) => prev.map((s) => (s.id === novo.id ? novo : s)));
    if (!demo) salvarConfigSetor(novo);
  };

  const alternarManual = async (id: number) => {
    const novo: Setor[] = setores.map((s) => {
      if (s.id === id) {
        const novoStatus: StatusSetor = s.status === 'ativo' ? 'desligado' : 'ativo';
        return { ...s, status: novoStatus, progressoMinutos: novoStatus === 'ativo' ? 0 : undefined };
      }
      if (estado.modoOperacao === 'sequencial' && s.status === 'ativo') {
        return { ...s, status: 'aguardando' as StatusSetor };
      }
      return s;
    });

    setSetores(novo);
    if (demo) return;

    for (const s of novo) {
      await definirStatusSetor(s.id, s.status, s.progressoMinutos);
    }
    const algumAtivo = novo.some((s) => s.status === 'ativo');
    await alternarRele(0, algumAtivo);
    for (const s of novo) {
      await alternarRele(s.releIndex, s.status === 'ativo');
    }
  };

  const alternarModo = async () => {
    const novoModo = estado.modoOperacao === 'sequencial' ? 'paralelo' : 'sequencial';
    setEstado((e) => ({ ...e, modoOperacao: novoModo }));
    if (!demo) await definirModoOperacao(novoModo);
  };

  return (
    <div className="min-h-screen bg-grafite-950 px-4 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-verde-500/20 to-azul-500/20 border border-grafite-700">
            <Sprout className="h-6 w-6 text-verde-400" />
          </div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight leading-snug">
            LINK-AI AGRO <span className="text-grafite-600 font-normal mx-1">|</span>
            <span className="text-grafite-400 font-medium"> FAZENDA CONILON — CONTROLE DE IRRIGAÇÃO</span>
          </h1>
        </header>

        <PainelBomba estado={estado} setores={setores} onToggleModo={alternarModo} />

        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-3">Setores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {setores.map((setor) => (
              <SetorCard
                key={setor.id}
                setor={setor}
                onChange={atualizarSetor}
                onToggleManual={alternarManual}
                falhaComunicacao={calcularFalhaComunicacao(setor, relesPorIndex, estado)}
              />
            ))}
          </div>
        </section>

        <PerfilSolo leitura={leitura} />

        <footer className="text-center text-xs text-grafite-600 pt-4">
          NVX AI LABS — LINK-AI AGRO · DADOS DE DEMONSTRAÇÃO · v1.1.2
        </footer>
      </div>
    </div>
  );
}

export default App;
