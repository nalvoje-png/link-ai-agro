import { Power, Plus, X, Droplet, Clock, MoonStar, WifiOff } from 'lucide-react';
import type { JanelaHorario, Setor } from '../types';

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HOJE = new Date().getDay();

function gerarIdJanela() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  setor: Setor;
  onChange: (setor: Setor) => void;
  onToggleManual: (id: number) => void;
  falhaComunicacao?: boolean;
}

export function SetorCard({ setor, onChange, onToggleManual, falhaComunicacao }: Props) {
  const isAtivo = setor.status === 'ativo';
  const isErro = setor.status === 'erro';

  const config = falhaComunicacao
    ? { cor: 'critico', Icone: WifiOff, label: 'Falha de comunicação' }
    : isAtivo
    ? { cor: 'azul', Icone: Droplet, label: 'Irrigando' + (setor.progressoMinutos != null ? ` · ${setor.progressoMinutos}m` : '') }
    : isErro
    ? { cor: 'critico', Icone: WifiOff, label: 'Erro' }
    : setor.status === 'aguardando'
    ? { cor: 'verde', Icone: Clock, label: 'Programado' }
    : { cor: 'grafite', Icone: MoonStar, label: 'Desligado' };

  const corClasses: Record<string, { faixa: string; badge: string; borda: string }> = {
    azul: { faixa: 'bg-azul-500', badge: 'bg-azul-500/15 text-azul-300', borda: 'border-azul-500/50' },
    verde: { faixa: 'bg-verde-500', badge: 'bg-verde-500/15 text-verde-400', borda: 'border-grafite-700' },
    critico: { faixa: 'bg-critico-500', badge: 'bg-critico-500/15 text-critico-500', borda: 'border-critico-500/60' },
    grafite: { faixa: 'bg-grafite-600', badge: 'bg-grafite-700 text-grafite-400', borda: 'border-grafite-700' },
  };
  const cc = corClasses[config.cor];
  const Icone = config.Icone;

  const toggleDia = (dia: number) => {
    const dias = setor.diasSemana.includes(dia)
      ? setor.diasSemana.filter((d) => d !== dia)
      : [...setor.diasSemana, dia].sort();
    onChange({ ...setor, diasSemana: dias });
  };

  const atualizarJanela = (id: string, campo: 'inicio' | 'fim', valor: string) => {
    onChange({
      ...setor,
      janelas: setor.janelas.map((j) => (j.id === id ? { ...j, [campo]: valor } : j)),
    });
  };

  const adicionarJanela = () => {
    const nova: JanelaHorario = { id: gerarIdJanela(), inicio: '06:00', fim: '06:20' };
    onChange({ ...setor, janelas: [...setor.janelas, nova] });
  };

  const removerJanela = (id: string) => {
    onChange({ ...setor, janelas: setor.janelas.filter((j) => j.id !== id) });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-grafite-800 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 ${cc.borda}`}
    >
      <div className={`h-1 w-full ${cc.faixa}`} />

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">{setor.nome}</h3>
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${cc.badge}`}>
            <Icone className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* Janelas de horario */}
        <div className="flex flex-col gap-2">
          {setor.janelas.map((janela) => (
            <div
              key={janela.id}
              className="flex items-center gap-2 rounded-lg bg-grafite-900 border border-grafite-700 px-3 py-2"
            >
              <input
                type="time"
                value={janela.inicio}
                onChange={(e) => atualizarJanela(janela.id, 'inicio', e.target.value)}
                className="bg-transparent tabular font-mono text-sm text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
              />
              <span className="text-grafite-600 text-sm">até</span>
              <input
                type="time"
                value={janela.fim}
                onChange={(e) => atualizarJanela(janela.id, 'fim', e.target.value)}
                className="bg-transparent tabular font-mono text-sm text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
              />
              <button
                onClick={() => removerJanela(janela.id)}
                className="ml-auto text-grafite-500 hover:text-critico-500 transition-colors"
                aria-label="Remover janela de horário"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            onClick={adicionarJanela}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-grafite-600 py-2 text-xs font-medium text-grafite-400 hover:border-verde-500 hover:text-verde-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar horário
          </button>
        </div>

        {/* Dias da semana */}
        <div className="flex gap-1.5">
          {DIAS.map((label, i) => {
            const programado = setor.diasSemana.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDia(i)}
                aria-pressed={programado}
                className={`relative h-7 w-7 rounded-full text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul-400 ${
                  programado
                    ? 'bg-verde-500/20 text-verde-400'
                    : 'bg-transparent text-grafite-600 border border-grafite-700'
                }`}
              >
                {label}
                {i === HOJE && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-azul-400" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onToggleManual(setor.id)}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul-400 ${
            isAtivo
              ? 'bg-azul-500/15 border border-azul-400 text-azul-300 hover:bg-azul-500/25'
              : 'border border-grafite-600 text-grafite-400 hover:border-verde-500 hover:text-verde-400'
          }`}
        >
          <Power className="h-4 w-4" />
          {isAtivo ? 'Desligar agora' : 'Ligar agora'}
        </button>
      </div>
    </div>
  );
}
