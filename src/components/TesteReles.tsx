import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { listarReles, alternarRele, type Rele } from '../lib/reles';

const RELES_DEMO: Rele[] = [
  { id: 0, nome: 'Bomba', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 1, nome: 'Setor 1', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 2, nome: 'Setor 2', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 3, nome: 'Setor 3', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 4, nome: 'Setor 4', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 5, nome: 'Setor 5', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 6, nome: 'Setor 6', ligado: false, atualizado_em: new Date().toISOString() },
  { id: 7, nome: 'Reserva', ligado: false, atualizado_em: new Date().toISOString() },
];

export function TesteReles() {
  const [reles, setReles] = useState<Rele[]>(RELES_DEMO);
  const [carregando, setCarregando] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demo = !supabase;

  useEffect(() => {
    if (demo) return;

    let ativo = true;
    async function buscar() {
      const dados = await listarReles();
      if (ativo && dados.length > 0) setReles(dados);
    }

    buscar();
    pollingRef.current = setInterval(buscar, 3000);
    return () => {
      ativo = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [demo]);

  const alternar = async (rele: Rele) => {
    const novoEstado = !rele.ligado;
    setReles((prev) => prev.map((r) => (r.id === rele.id ? { ...r, ligado: novoEstado } : r)));

    if (demo) return;
    setCarregando(true);
    const ok = await alternarRele(rele.id, novoEstado);
    if (!ok) {
      // reverte em caso de falha de escrita
      setReles((prev) => prev.map((r) => (r.id === rele.id ? { ...r, ligado: rele.ligado } : r)));
    }
    setCarregando(false);
  };

  return (
    <section className="rounded-2xl border border-grafite-700 bg-grafite-800 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-azul-400" />
        <h2 className="text-xl font-semibold tracking-tight">Teste de relés (hardware)</h2>
      </div>
      <p className="text-xs text-grafite-500 mb-4">
        {demo
          ? 'Modo demonstração — configure o Supabase para controlar a placa de verdade.'
          : 'Acionamento direto dos 8 relés físicos, sem passar pela lógica de agendamento. Útil para validar a comunicação com a HKL-EA8.'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reles.map((rele) => (
          <button
            key={rele.id}
            onClick={() => alternar(rele)}
            disabled={carregando}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60 ${
              rele.ligado
                ? 'border-azul-400 bg-azul-500/10'
                : 'border-grafite-700 bg-grafite-900 hover:border-grafite-600'
            }`}
          >
            <span
              className={`relative flex h-10 w-16 items-center rounded-full p-1 transition-colors ${
                rele.ligado ? 'bg-azul-500' : 'bg-grafite-700'
              }`}
            >
              <span
                className={`h-8 w-8 rounded-full bg-white shadow transition-transform ${
                  rele.ligado ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </span>
            <span className="text-xs font-medium text-off-white">{rele.nome}</span>
            <span className="text-[10px] text-grafite-500 uppercase tracking-wide">
              Relé {rele.id.toString().padStart(2, '0')} {rele.ligado ? '· ligado' : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
