import { Droplets, Wifi } from 'lucide-react';
import type { EstadoSistema, JanelaHorario, Setor } from '../types';

interface Props {
  estado: EstadoSistema;
  setores: Setor[];
  onToggleModo: () => void;
}

interface ProximaIrrigacao {
  setor: Setor;
  proximaJanela: JanelaHorario;
}

export function PainelBomba({ estado, setores, onToggleModo }: Props) {
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
    <section className="rounded-2xl border border-grafite-700 bg-grafite-800 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Indicador da bomba */}
        <div className="flex items-center gap-4">
          <div
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-colors ${
              estado.bombaLigada
                ? 'bg-gradient-to-br from-azul-400 to-azul-600'
                : 'bg-grafite-700'
            }`}
          >
            <Droplets
              className={`h-7 w-7 ${estado.bombaLigada ? 'text-white' : 'text-grafite-400'}`}
            />
            {estado.bombaLigada && (
              <span className="absolute inset-0 rounded-full bg-azul-500 animate-ping opacity-20" />
            )}
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-none">
              Bomba {estado.bombaLigada ? 'ligada' : 'desligada'}
            </p>
            <p className="text-sm text-grafite-400 mt-1.5">
              {setoresAtivos.length > 0
                ? `Irrigando: ${setoresAtivos.map((s) => s.nome).join(', ')}`
                : proximo
                ? `Próximo: ${proximo.setor.nome} às ${proximo.proximaJanela.inicio}`
                : 'Nenhum setor programado para hoje'}
            </p>
          </div>
        </div>

        {/* Conectividade + modo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-full bg-grafite-900 border border-grafite-700 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              {estado.online && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde-500 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  estado.online ? 'bg-verde-500' : 'bg-grafite-500'
                }`}
              />
            </span>
            <Wifi className={`h-3.5 w-3.5 ${estado.online ? 'text-verde-400' : 'text-grafite-500'}`} />
            <span className="text-xs font-medium text-grafite-400">
              {estado.online ? 'Online' : 'Offline'}
            </span>
          </div>

          <button
            onClick={onToggleModo}
            className="rounded-full border border-grafite-700 bg-grafite-900 px-4 py-1.5 text-xs font-medium text-grafite-400 hover:border-azul-400 hover:text-azul-300 transition-colors"
          >
            Modo: <span className="font-semibold text-off-white">{estado.modoOperacao === 'sequencial' ? 'Sequencial' : 'Paralelo'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
