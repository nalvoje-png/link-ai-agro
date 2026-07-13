import { Power, Plus, X, Droplet, Clock, MoonStar, WifiOff } from 'lucide-react';
import type { JanelaHorario, Setor } from '../types';

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HOJE = new Date().getDay();

function gerarIdJanela() {
  return Math.random().toString(36).slice(2, 9);
}

function minutosDoDia(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
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
    ? { cor: 'verde', Icone: Clock, label: 'Agendado' }
    : { cor: 'grafite', Icone: MoonStar, label: 'Desativado' };

  const corClasses: Record<string, { faixa: string; badge: string; borda: string; barra: string }> = {
    azul: { faixa: 'bg-azul-400', badge: 'bg-azul-500/20 text-azul-300', borda: 'border-azul-400/50', barra: 'bg-azul-400' },
    verde: { faixa: 'bg-verde-400', badge: 'bg-verde-500/20 text-verde-400', borda: 'border-verde-400/30', barra: 'bg-verde-400' },
    critico: { faixa: 'bg-critico-500', badge: 'bg-critico-500/20 text-critico-500', borda: 'border-critico-500/60', barra: 'bg-critico-500' },
    grafite: { faixa: 'bg-white/20', badge: 'bg-white/10 text-off-white/50', borda: 'border-white/10', barra: 'bg-white/30' },
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
      className={`vidro relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)] ${cc.borda} ${
        isAtivo ? 'animar-onda' : ''
      }`}
    >
      <div className={`h-1 w-full ${cc.faixa}`} style={{ boxShadow: '0 0 12px currentColor' }} />

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">{setor.nome}</h3>
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${cc.badge}`}>
            <Icone className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* Interruptor mestre: liga/desliga o agendamento inteiro deste setor */}
        <button
          onClick={() => onChange({ ...setor, ativo: !setor.ativo })}
          className="vidro-sutil flex items-center justify-between rounded-lg px-3 py-2"
        >
          <span className="text-xs font-medium text-off-white/60">Agendamento automático</span>
          <span
            className={`relative flex h-5 w-9 items-center rounded-full p-0.5 backdrop-blur-sm transition-colors ${
              setor.ativo ? 'bg-verde-500/90 shadow-[0_0_8px_rgba(34,211,166,0.6)]' : 'bg-white/15'
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                setor.ativo ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        {/* Janelas de horario */}
        <div className="flex flex-col gap-2">
          {setor.janelas.map((janela) => {
            const inicioPct = (minutosDoDia(janela.inicio) / 1440) * 100;
            const fimPct = (minutosDoDia(janela.fim) / 1440) * 100;
            const largura = Math.max(fimPct - inicioPct, 1);
            return (
              <div key={janela.id} className="vidro-sutil rounded-lg px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={janela.inicio}
                    onChange={(e) => atualizarJanela(janela.id, 'inicio', e.target.value)}
                    className="bg-transparent tabular font-mono text-sm text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
                  />
                  <span className="text-off-white/30 text-sm">até</span>
                  <input
                    type="time"
                    value={janela.fim}
                    onChange={(e) => atualizarJanela(janela.id, 'fim', e.target.value)}
                    className="bg-transparent tabular font-mono text-sm text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
                  />
                  <button
                    onClick={() => removerJanela(janela.id)}
                    className="ml-auto text-off-white/40 hover:text-critico-500 transition-colors"
                    aria-label="Remover janela de horário"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Barra decorativa: posicao da janela ao longo do dia (00h-24h) */}
                <div className="relative h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 rounded-full ${cc.barra}`}
                    style={{ left: `${inicioPct}%`, width: `${largura}%` }}
                  />
                </div>
              </div>
            );
          })}

          <button
            onClick={adicionarJanela}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs font-medium text-off-white/50 hover:border-verde-400/60 hover:text-verde-400 hover:bg-white/5 transition-colors"
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
                    ? 'bg-verde-500/25 text-verde-300 shadow-[0_0_6px_rgba(34,211,166,0.4)]'
                    : 'bg-white/5 text-off-white/30 border border-white/10'
                }`}
              >
                {label}
                {i === HOJE && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-azul-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onToggleManual(setor.id)}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul-400 ${
            isAtivo
              ? 'bg-azul-500/20 border border-azul-400/70 text-azul-200 shadow-[0_0_14px_rgba(56,189,248,0.35)] hover:bg-azul-500/30'
              : 'bg-white/5 border border-white/15 text-off-white/70 hover:border-verde-400/60 hover:text-verde-300 hover:bg-white/10'
          }`}
        >
          <Power className="h-4 w-4" />
          {isAtivo ? 'Desligar agora' : 'Ligar agora'}
        </button>
      </div>
    </div>
  );
}
