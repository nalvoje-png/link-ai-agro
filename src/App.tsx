import { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { PainelBomba } from './components/PainelBomba';
import { SetorCard } from './components/SetorCard';
import { PerfilSolo } from './components/PerfilSolo';
import { TesteReles } from './components/TesteReles';
import { supabase } from './lib/supabaseClient';
import { listarSetores, salvarConfigSetor, definirStatusSetor } from './lib/setores';
import { obterEstado, definirModoOperacao } from './lib/estadoSistema';
import { obterUltimaLeitura } from './lib/leituras';
import { alternarRele } from './lib/reles';
import type { EstadoSistema, LeituraSensor, Setor, StatusSetor } from './types';

const SETORES_DEMO: Setor[] = [
  { id: 1, nome: 'Setor 1', releIndex: 1, horaInicio: '06:00', duracaoMinutos: 20, diasSemana: [1, 3, 5], ativo: true, status: 'aguardando' },
  { id: 2, nome: 'Setor 2', releIndex: 2, horaInicio: '06:25', duracaoMinutos: 20, diasSemana: [1, 3, 5], ativo: true, status: 'aguardando' },
  { id: 3, nome: 'Setor 3', releIndex: 3, horaInicio: '06:50', duracaoMinutos: 25, diasSemana: [1, 3, 5], ativo: true, status: 'ativo', progressoMinutos: 8 },
  { id: 4, nome: 'Setor 4', releIndex: 4, horaInicio: '07:20', duracaoMinutos: 20, diasSemana: [2, 4, 6], ativo: true, status: 'aguardando' },
  { id: 5, nome: 'Setor 5', releIndex: 5, horaInicio: '07:45', duracaoMinutos: 20, diasSemana: [2, 4, 6], ativo: false, status: 'desligado' },
  { id: 6, nome: 'Setor 6', releIndex: 6, horaInicio: '08:10', duracaoMinutos: 20, diasSemana: [2, 4, 6], ativo: true, status: 'aguardando' },
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

function App() {
  const demo = !supabase;

  const [setores, setSetores] = useState<Setor[]>(SETORES_DEMO);
  const [leitura, setLeitura] = useState<LeituraSensor | null>(LEITURA_DEMO);
  const [estado, setEstado] = useState<EstadoSistema>(ESTADO_DEMO);

  // Carrega dados reais do Supabase e mantem sincronizado por polling.
  useEffect(() => {
    if (demo) return;

    let ativo = true;

    async function sincronizar() {
      const [novosSetores, novoEstado, novaLeitura] = await Promise.all([
        listarSetores(),
        obterEstado(),
        obterUltimaLeitura(),
      ]);
      if (!ativo) return;
      if (novosSetores.length > 0) setSetores(novosSetores);
      if (novoEstado) setEstado(novoEstado);
      if (novaLeitura) setLeitura(novaLeitura);
    }

    sincronizar();
    const intervalo = setInterval(sincronizar, INTERVALO_POLL_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [demo]);

  // Edicao de horario/duracao/dias/ativo de um setor (persiste no Supabase).
  const atualizarSetor = (novo: Setor) => {
    setSetores((prev) => prev.map((s) => (s.id === novo.id ? novo : s)));
    if (!demo) salvarConfigSetor(novo);
  };

  // Botao manual "Ligar agora" / "Desligar agora" — muda status e aciona os reles fisicos.
  const alternarManual = async (id: number) => {
    const novo: Setor[] = setores.map((s) => {
      if (s.id === id) {
        const novoStatus: StatusSetor = s.status === 'ativo' ? 'desligado' : 'ativo';
        return { ...s, status: novoStatus, progressoMinutos: novoStatus === 'ativo' ? 0 : undefined };
      }
      // Em modo sequencial, ligar um setor desliga o que estava ativo antes.
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
    await alternarRele(0, algumAtivo); // rele 0 = bomba
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

        <TesteReles />

        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-3">Setores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {setores.map((setor) => (
              <SetorCard
                key={setor.id}
                setor={setor}
                onChange={atualizarSetor}
                onToggleManual={alternarManual}
              />
            ))}
          </div>
        </section>

        <PerfilSolo leitura={leitura} />

        <footer className="text-center text-xs text-grafite-600 pt-4">
          NVX AI LABS — LINK-AI AGRO · DADOS DE DEMONSTRAÇÃO · v1.0.4
        </footer>
      </div>
    </div>
  );
}

export default App;
