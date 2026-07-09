import type { LeituraSensor } from '../types';

type NivelStatus = 'ideal' | 'atencao' | 'critico';

interface Faixa {
  label: string;
  valor: number;
  unidade: string;
  min: number; // faixa ideal para conilon (referência)
  max: number;
  casas?: number;
}

function classificar(valor: number, min: number, max: number): NivelStatus {
  if (valor >= min && valor <= max) return 'ideal';
  const largura = max - min;
  const margem = largura * 0.15;
  if (valor >= min - margem && valor <= max + margem) return 'atencao';
  return 'critico';
}

const TAG: Record<NivelStatus, { label: string; classe: string }> = {
  ideal: { label: 'Ideal', classe: 'bg-verde-500/15 text-verde-400' },
  atencao: { label: 'Atenção', classe: 'bg-atencao-500/15 text-atencao-500' },
  critico: { label: 'Crítico', classe: 'bg-critico-500/15 text-critico-500' },
};

export function PerfilSolo({ leitura }: { leitura: LeituraSensor | null }) {
  if (!leitura) {
    return (
      <section className="rounded-2xl border border-grafite-700 bg-grafite-800 p-6">
        <h2 className="text-xl font-semibold tracking-tight mb-2">Perfil do solo</h2>
        <p className="text-grafite-400 text-sm">Aguardando primeira leitura do sensor...</p>
      </section>
    );
  }

  const faixas: Faixa[] = [
    { label: 'Umidade', valor: leitura.umidade, unidade: '%', min: 50, max: 70 },
    { label: 'Temperatura', valor: leitura.temperatura, unidade: '°C', min: 18, max: 26, casas: 1 },
    { label: 'Condutividade (EC)', valor: leitura.ec, unidade: 'mS/cm', min: 0.8, max: 1.8, casas: 1 },
    { label: 'pH', valor: leitura.ph, unidade: '', min: 5.5, max: 6.5, casas: 1 },
    { label: 'Nitrogênio (N)', valor: leitura.nitrogenio, unidade: 'mg/kg', min: 20, max: 40 },
    { label: 'Fósforo (P)', valor: leitura.fosforo, unidade: 'mg/kg', min: 10, max: 30 },
    { label: 'Potássio (K)', valor: leitura.potassio, unidade: 'mg/kg', min: 100, max: 200 },
  ];

  return (
    <section className="rounded-2xl border border-grafite-700 bg-grafite-800 p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xl font-semibold tracking-tight">Perfil do solo</h2>
        <span className="text-xs text-grafite-500 tabular font-mono">
          {new Date(leitura.timestamp).toLocaleTimeString('pt-BR')}
        </span>
      </div>

      <div className="flex flex-col">
        {faixas.map((f) => {
          const nivel = classificar(f.valor, f.min, f.max);
          const tag = TAG[nivel];
          return (
            <div
              key={f.label}
              className="flex items-center justify-between py-3.5 border-b border-grafite-700/70 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm text-grafite-400 truncate">{f.label}</span>
                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${tag.classe}`}>
                  {tag.label}
                </span>
              </div>
              <span className="tabular font-mono text-sm font-medium text-off-white shrink-0 pl-3">
                {f.valor.toFixed(f.casas ?? 0)}
                {f.unidade && <span className="text-grafite-500 ml-1">{f.unidade}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
