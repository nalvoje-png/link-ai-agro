import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import type { Setor } from '../types';

interface Props {
  setores: Setor[];
  onAplicar: (novaConfig: Setor[]) => void;
  onClose: () => void;
}

function minutosParaHHMM(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function ConfiguracaoRapidaModal({ setores, onAplicar, onClose }: Props) {
  const [selecionados, setSelecionados] = useState<number[]>(setores.map((s) => s.id));
  const [duracao, setDuracao] = useState(30);
  const [horaInicial, setHoraInicial] = useState('06:00');
  const [confirmando, setConfirmando] = useState(false);

  const toggleSetor = (id: number) => {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort()));
  };

  // Previa: calcula os horarios em cascata sequencial
  const previa = selecionados
    .map((id) => setores.find((s) => s.id === id))
    .filter((s): s is Setor => !!s)
    .map((s, i) => {
      const inicioMin = hhmmParaMinutos(horaInicial) + i * duracao;
      return {
        setor: s,
        inicio: minutosParaHHMM(inicioMin),
        fim: minutosParaHHMM(inicioMin + duracao),
      };
    });

  const aplicar = () => {
    const novaConfig = setores.map((s) => {
      const item = previa.find((p) => p.setor.id === s.id);
      if (!item) return s;
      return {
        ...s,
        janelas: [{ id: `${s.id}-qs`, inicio: item.inicio, fim: item.fim }],
        diasSemana: [0, 1, 2, 3, 4, 5, 6],
        ativo: true,
      };
    });
    onAplicar(novaConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="vidro rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-verde-400" />
            <h2 className="text-lg font-semibold tracking-tight">Configuração rápida</h2>
          </div>
          <button onClick={onClose} className="text-off-white/50 hover:text-off-white transition-colors" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {/* Setores */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-2 block">Setores</label>
            <div className="flex flex-wrap gap-2">
              {setores.map((s) => {
                const on = selecionados.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSetor(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      on ? 'bg-verde-500/25 text-verde-300 border border-verde-400/40' : 'vidro-sutil text-off-white/50'
                    }`}
                  >
                    {s.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duracao e hora inicial */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-2 block">Duração (min)</label>
              <input
                type="number"
                min={1}
                value={duracao}
                onChange={(e) => setDuracao(Math.max(1, Number(e.target.value)))}
                className="vidro-sutil w-full rounded-lg px-3 py-2 text-sm font-mono tabular text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-2 block">Hora inicial</label>
              <input
                type="time"
                value={horaInicial}
                onChange={(e) => setHoraInicial(e.target.value)}
                className="vidro-sutil w-full rounded-lg px-3 py-2 text-sm font-mono tabular text-off-white focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-400"
              />
            </div>
          </div>

          {/* Previa */}
          {previa.length > 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-2 block">
                Prévia (sequência)
              </label>
              <div className="flex flex-col gap-1.5">
                {previa.map((p) => (
                  <div key={p.setor.id} className="vidro-sutil rounded-lg px-3 py-2 flex items-center justify-between text-sm">
                    <span>{p.setor.nome}</span>
                    <span className="font-mono tabular text-off-white/70">
                      {p.inicio} — {p.fim}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-off-white/40 mt-2">
                Todos os dias da semana · agendamento ligado automaticamente.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 flex flex-col gap-3">
          {confirmando ? (
            <>
              <p className="text-sm text-off-white/70">
                Isto vai <span className="text-off-white font-medium">substituir</span> os horários atuais dos setores selecionados. Continuar?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmando(false)}
                  className="flex-1 vidro-sutil rounded-lg py-2.5 text-sm font-semibold text-off-white/70 hover:text-off-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicar}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-verde-500/25 border border-verde-400/50 text-verde-200 hover:bg-verde-500/35 transition-colors"
                >
                  Sim, substituir
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setConfirmando(true)}
              disabled={selecionados.length === 0}
              className="rounded-lg py-2.5 text-sm font-semibold bg-verde-500/25 border border-verde-400/50 text-verde-200 hover:bg-verde-500/35 transition-colors disabled:opacity-40"
            >
              Aplicar configuração
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
