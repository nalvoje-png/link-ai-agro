import type { LeituraSensor } from '../types';

type NivelStatus = 'ideal' | 'atencao' | 'critico' | 'sem_referencia';

interface Faixa {
  label: string;
  valor: number;
  unidade: string;
  min?: number;   // faixa ideal (quando existe referência agronômica confiável)
  max?: number;
  casas?: number;
  nota?: string;  // observação exibida ao passar o mouse
}

function classificar(valor: number, min?: number, max?: number): NivelStatus {
  // Sem faixa de referência definida: não emitimos julgamento.
  if (min === undefined || max === undefined) return 'sem_referencia';
  if (valor >= min && valor <= max) return 'ideal';
  const largura = max - min;
  const margem = largura * 0.2;
  if (valor >= min - margem && valor <= max + margem) return 'atencao';
  return 'critico';
}

const TAG: Record<NivelStatus, { label: string; classe: string } | null> = {
  ideal: { label: 'Ideal', classe: 'bg-verde-500/15 text-verde-400' },
  atencao: { label: 'Atenção', classe: 'bg-atencao-500/15 text-atencao-500' },
  critico: { label: 'Crítico', classe: 'bg-critico-500/15 text-critico-500' },
  sem_referencia: null, // não mostra tag nenhuma
};

export function PerfilSolo({ leitura }: { leitura: LeituraSensor | null }) {
  if (!leitura) {
    return (
      <section className="vidro rounded-2xl p-6">
        <h2 className="text-xl font-semibold tracking-tight mb-2">Perfil do solo</h2>
        <p className="text-off-white/50 text-sm">Aguardando primeira leitura do sensor...</p>
      </section>
    );
  }

  const faixas: Faixa[] = [
    {
      // A literatura agronômica não define um "% ideal" universal: o ponto ideal
      // varia com textura do solo, profundidade de raiz e clima. Faixa larga,
      // só para sinalizar extremos (solo encharcado ou ressecado).
      label: 'Umidade',
      valor: leitura.umidade,
      unidade: '%',
      min: 20,
      max: 80,
      nota: 'Faixa ampla: o ideal depende do tipo de solo e da fase da cultura.',
    },
    {
      // Conilon se desenvolve bem entre 22-26°C (temperatura do ar).
      // Solo é mais estável; faixa alargada para refletir isso.
      label: 'Temperatura',
      valor: leitura.temperatura,
      unidade: '°C',
      min: 18,
      max: 30,
      casas: 1,
    },
    {
      // Sem referência confiável para EC em µS/cm com este tipo de sensor.
      label: 'Condutividade (EC)',
      valor: leitura.ec,
      unidade: 'µS/cm',
      casas: 0,
      nota: 'Sem faixa de referência definida para este sensor.',
    },
    {
      // Referência sólida: melhor faixa para café é pH 5,5–6,5, ótimo em 6,0.
      label: 'pH',
      valor: leitura.ph,
      unidade: '',
      min: 5.5,
      max: 6.5,
      casas: 1,
      nota: 'Faixa ideal para café: 5,5 a 6,5 (ótimo em 6,0).',
    },
    // N, P e K: estes sensores estimam os valores a partir da condutividade,
    // e não têm precisão comparável a uma análise laboratorial. Exibimos o
    // número, mas sem classificar como ideal/crítico.
    {
      label: 'Nitrogênio (N)',
      valor: leitura.nitrogenio,
      unidade: 'mg/kg',
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
    {
      label: 'Fósforo (P)',
      valor: leitura.fosforo,
      unidade: 'mg/kg',
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
    {
      label: 'Potássio (K)',
      valor: leitura.potassio,
      unidade: 'mg/kg',
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
  ];

  return (
    <section className="vidro rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xl font-semibold tracking-tight">Perfil do solo</h2>
        <span className="text-xs text-off-white/40 tabular font-mono">
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
              className="flex items-center justify-between py-3.5 border-b border-white/10 last:border-b-0"
              title={f.nota}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm text-off-white/60 truncate">{f.label}</span>
                {tag && (
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${tag.classe}`}>
                    {tag.label}
                  </span>
                )}
              </div>
              <span className="tabular font-mono text-sm font-medium text-off-white shrink-0 pl-3">
                {f.valor.toFixed(f.casas ?? 0)}
                {f.unidade && <span className="text-off-white/40 ml-1">{f.unidade}</span>}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-off-white/35 mt-4 leading-relaxed">
        N, P, K e condutividade são estimativas do sensor, não substituem análise laboratorial de solo.
      </p>
    </section>
  );
}
