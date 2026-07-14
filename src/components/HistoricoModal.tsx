import { useEffect, useState } from 'react';
import { X, Power, PowerOff, Sprout, CircleOff } from 'lucide-react';
import type { EventoSetor, LeituraSensor, Setor } from '../types';
import { listarEventosSetor, listarLeiturasSetor } from '../lib/historico';
import { supabase } from '../lib/supabaseClient';

interface Props {
  setor: Setor;
  onClose: () => void;
}

type ItemLinha =
  | { tipo: 'evento'; quando: string; evento: EventoSetor }
  | { tipo: 'leitura'; quando: string; leitura: LeituraSensor };

const EVENTOS_DEMO: EventoSetor[] = [
  { id: 3, setorId: 0, criadoEm: new Date(Date.now() - 3600_000).toISOString(), tipo: 'desligou', origem: 'automatico' },
  { id: 2, setorId: 0, criadoEm: new Date(Date.now() - 5400_000).toISOString(), tipo: 'ligou', origem: 'automatico' },
  { id: 1, setorId: 0, criadoEm: new Date(Date.now() - 90000_000).toISOString(), tipo: 'ligou', origem: 'manual' },
];

export function HistoricoModal({ setor, onClose }: Props) {
  const demo = !supabase;
  const [eventos, setEventos] = useState<EventoSetor[]>(demo ? EVENTOS_DEMO : []);
  const [leituras, setLeituras] = useState<LeituraSensor[]>([]);
  const [carregando, setCarregando] = useState(!demo);

  useEffect(() => {
    if (demo) return;
    let ativo = true;
    (async () => {
      const [evs, lts] = await Promise.all([
        listarEventosSetor(setor.id),
        setor.temSensor ? listarLeiturasSetor(setor.id) : Promise.resolve([]),
      ]);
      if (!ativo) return;
      setEventos(evs);
      setLeituras(lts);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [demo, setor.id, setor.temSensor]);

  const linha: ItemLinha[] = [
    ...eventos.map((e) => ({ tipo: 'evento' as const, quando: e.criadoEm, evento: e })),
    ...leituras.map((l) => ({ tipo: 'leitura' as const, quando: l.timestamp, leitura: l })),
  ].sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime());

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="vidro rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{setor.nome}</h2>
            <p className="text-xs text-off-white/50">Histórico e sensores</p>
          </div>
          <button onClick={onClose} className="text-off-white/50 hover:text-off-white transition-colors" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sensores do setor */}
        <div className="p-5 border-b border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-3">Sensores</h3>
          {!setor.temSensor ? (
            <div className="flex items-center gap-2.5 text-sm text-off-white/50 vidro-sutil rounded-lg px-3 py-3">
              <CircleOff className="h-4 w-4 shrink-0" />
              Nenhum sensor instalado neste setor.
            </div>
          ) : leituras.length === 0 ? (
            <p className="text-sm text-off-white/50">Sensor instalado, aguardando primeira leitura...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const u = leituras[0];
                const items = [
                  ['Umidade', `${u.umidade}%`],
                  ['Temperatura', `${u.temperatura}°C`],
                  ['pH', `${u.ph}`],
                  ['EC', `${u.ec} mS/cm`],
                  ['N', `${u.nitrogenio}`],
                  ['P', `${u.fosforo}`],
                  ['K', `${u.potassio}`],
                ];
                return items.map(([label, val]) => (
                  <div key={label} className="vidro-sutil rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-off-white/50">{label}</span>
                    <span className="text-sm font-mono tabular">{val}</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Linha do tempo */}
        <div className="p-5 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-off-white/50 mb-3">Linha do tempo</h3>
          {carregando ? (
            <p className="text-sm text-off-white/50">Carregando...</p>
          ) : linha.length === 0 ? (
            <p className="text-sm text-off-white/50">Nenhum registro ainda para este setor.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {linha.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.tipo === 'evento' ? (
                      item.evento.tipo === 'ligou' ? (
                        <Power className="h-4 w-4 text-verde-400" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-off-white/40" />
                      )
                    ) : (
                      <Sprout className="h-4 w-4 text-azul-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.tipo === 'evento' ? (
                      <p className="text-sm">
                        {item.evento.tipo === 'ligou' ? 'Ligou' : 'Desligou'}{' '}
                        <span className="text-off-white/50">
                          ({item.evento.origem === 'manual' ? 'manual' : 'automático'})
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm">
                        Leitura do solo{' '}
                        <span className="text-off-white/50">
                          · umidade {item.leitura.umidade}% · {item.leitura.temperatura}°C
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-off-white/40 tabular font-mono">{fmt(item.quando)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
