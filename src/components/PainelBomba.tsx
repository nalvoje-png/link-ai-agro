import { Droplets, Wifi, Zap } from 'lucide-react';
import type { EstadoSistema, JanelaHorario, Setor } from '../types';

interface Props {
  estado: EstadoSistema;
  setores: Setor[];
  onToggleModo: () => void;
  onConfiguracaoRapida: () => void;
}

interface ProximaIrrigacao {
  setor: Setor;
  proximaJanela: JanelaHorario;
}

export function PainelBomba({ estado, setores, onToggleModo, onConfiguracaoRapida }: Props) {
  const setoresAtivos = setores.filter((s) => s.status === 'ativo');
  const proximo = setores
    .filter((s) => s.status === 'aguardando' && s.ativo)
    .map((s): ProximaIrrigacao | null => {
      const janelasValidas = s.janelas.filter((j) => j.inicio && j.fim);
      if (janelasValidas.length === 0) return null;
      const proximaJanela = [...janelasValidas].sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
      return { setor: s, proximaJanela };
    })
    .filter((x): x is ProximaIrrigacao => x !== null)
    .sort((a, b) => a.proximaJanela.inicio.localeCompare(b.proximaJanela.inicio))[0];

  return (
    <section className="vidro rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Indicador da bomba */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-colors ${
                estado.bombaLigada
                  ? 'bg-gradient-to-br from-azul-400 to-azul-600'
                  : 'bg-white/10 backdrop-blur-sm border border-white/10'
              }`}
            >
              <Droplets
                className={`h-7 w-7 ${estado.bombaLigada ? 'text-white' : 'text-off-white/40'}`}
              />
              {estado.bombaLigada && (
                <span className="absolute inset-0 rounded-full bg-azul-500 animate-ping opacity-25" />
              )}
            </div>
            {/* Luz de status estilo indicador fisico */}
            <span
              className={`animar-luz absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-grafite-950 ${
                estado.bombaLigada ? 'bg-verde-400 text-verde-400' : 'bg-critico-500 text-critico-500'
              }`}
            />
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-none drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
              Bomba {estado.bombaLigada ? 'ligada' : 'desligada'}
            </p>
            <p className="text-sm text-off-white/60 mt-1.5">
              {setoresAtivos.length > 0
                ? `Irrigando: ${setoresAtivos.map((s) => s.nome).join(', ')}`
                : proximo
                ? `Próximo: ${proximo.setor.nome} às ${proximo.proximaJanela.inicio}`
                : 'Nenhum setor programado para hoje'}
            </p>
          </div>
        </div>

        {/* Conectividade + modo */}
        <div className="flex flex-col items-stretch gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="vidro-sutil flex items-center gap-2 rounded-full px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                {estado.online && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde-400 opacity-70" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    estado.online ? 'bg-verde-400' : 'bg-grafite-500'
                  }`}
                />
              </span>
              <Wifi className={`h-3.5 w-3.5 ${estado.online ? 'text-verde-400' : 'text-grafite-500'}`} />
              <span className="text-xs font-medium text-off-white/70">
                {estado.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              onClick={onToggleModo}
              className="vidro-sutil rounded-full px-4 py-1.5 text-xs font-medium text-off-white/70 hover:border-azul-400/60 transition-colors"
            >
              Modo: <span className="font-semibold text-off-white">{estado.modoOperacao === 'sequencial' ? 'Sequencial' : 'Paralelo'}</span>
            </button>
          </div>

          <button
            onClick={onConfiguracaoRapida}
            className="flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold bg-verde-500/20 border border-verde-400/40 text-verde-300 hover:bg-verde-500/30 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Configuração rápida
          </button>
        </div>
      </div>
    </section>
  );
}
