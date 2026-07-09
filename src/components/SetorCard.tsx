import { Power, Clock } from 'lucide-react';
import type { Setor } from '../types';

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HOJE = new Date().getDay();

const STATUS_LABEL: Record<Setor['status'], string> = {
  ativo: 'Irrigando',
  aguardando: 'Programado',
  desligado: 'Desligado',
  erro: 'Erro',
};

interface Props {
  setor: Setor;
  onChange: (setor: Setor) => void;
  onToggleManual: (id: number) => void;
}

export function SetorCard({ setor, onChange, onToggleManual }: Props) {
  const isAtivo = setor.status === 'ativo';
  const isErro = setor.status === 'erro';

  const statusCor = isAtivo
    ? 'bg-azul-500/15 text-azul-300 border-azul-400/40'
    : isErro
    ? 'bg-critico-500/15 text-critico-500 border-critico-500/40'
    : setor.status === 'aguardando'
    ? 'bg-verde-500/15 text-verde-400 border-verde-500/30'
    : 'bg-grafite-700 text-grafite-400 border-grafite-600';

  const toggleDia = (dia: number) => {
    const dias = setor.diasSemana.includes(dia)
      ? setor.diasSemana.filter((d) => d !== dia)
      : [...setor.diasSemana, dia].sort();
    onChange({ ...setor, diasSemana: dias });
  };

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-4 bg-grafite-800 transition-colors ${
        isAtivo ? 'border-azul-500/50' : 'border-grafite-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{setor.nome}</h3>
        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusCor}`}>
          {STATUS_LABEL[setor.status]}
          {isAtivo && setor.progressoMinutos != null
            ? ` · ${setor.progressoMinutos}/${setor.duracaoMinutos}m`
            : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-grafite-400">
        <Clock className="h-3.5 w-3.5" />
        <input
          type="time"
          value={setor.horaInicio}
          onChange={(e) => onChange({ ...setor, horaInicio: e.target.value })}
          className="bg-transparent tabular font-mono text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
        />
        <span className="text-grafite-600">·</span>
        <input
          type="number"
          min={1}
          value={setor.duracaoMinutos}
          onChange={(e) => onChange({ ...setor, duracaoMinutos: Number(e.target.value) })}
          className="w-12 bg-transparent tabular font-mono text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 rounded"
        />
        <span>min</span>
      </div>

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
        className={`mt-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul-400 ${
          isAtivo
            ? 'bg-azul-500/15 border border-azul-400 text-azul-300 hover:bg-azul-500/25'
            : 'border border-grafite-600 text-grafite-400 hover:border-verde-500 hover:text-verde-400'
        }`}
      >
        <Power className="h-4 w-4" />
        {isAtivo ? 'Desligar agora' : 'Ligar agora'}
      </button>
    </div>
  );
}
