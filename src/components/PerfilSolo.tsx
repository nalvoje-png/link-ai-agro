import type { LeituraSensor } from '../types';

type NivelStatus = 'ideal' | 'atencao' | 'critico' | 'sem_referencia';

interface Faixa {
  label: string;
  valor: number;
  unidade: string;
  min?: number;      // faixa ideal (quando existe referência agronômica confiável)
  max?: number;
  escalaMax: number; // teto da barra de visualização (só escala visual, não julgamento)
  casas?: number;
  nota?: string;
}

function classificar(valor: number, min?: number, max?: number): NivelStatus {
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
  sem_referencia: null,
};

const COR_BARRA: Record<NivelStatus, string> = {
  ideal: 'bg-verde-500',
  atencao: 'bg-atencao-500',
  critico: 'bg-critico-500',
  sem_referencia: 'bg-azul-400/70',
};

function tempoRelativo(iso: string): string {
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return `há ${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d`;
}

// Considera o sensor online se a última leitura chegou dentro deste prazo.
const LIMITE_SENSOR_ONLINE_MS = 15 * 60 * 1000; // 15 min (leitura roda a cada 10 min)

export function PerfilSolo({ leitura }: { leitura: LeituraSensor | null }) {
  if (!leitura) {
    return (
      <section className="vidro rounded-2xl p-6">
        <h2 className="text-xl font-semibold tracking-tight mb-2">Perfil do solo</h2>
        <p className="text-off-white/50 text-sm">Aguardando primeira leitura do sensor...</p>
      </section>
    );
  }

  const idadeLeitura = Date.now() - new Date(leitura.timestamp).getTime();
  const sensorOnline = idadeLeitura <= LIMITE_SENSOR_ONLINE_MS;

  const faixas: Faixa[] = [
    {
      label: 'Umidade',
      valor: leitura.umidade,
      unidade: '%',
      min: 20,
      max: 80,
      escalaMax: 100,
      nota: 'Faixa ampla: o ideal depende do tipo de solo e da fase da cultura.',
    },
    {
      label: 'Temperatura',
      valor: leitura.temperatura,
      unidade: '°C',
      min: 18,
      max: 30,
      escalaMax: 45,
      casas: 1,
    },
    {
      label: 'Condutividade (EC)',
      valor: leitura.ec,
      unidade: 'µS/cm',
      escalaMax: 2000,
      casas: 0,
      nota: 'Sem faixa de referência definida para este sensor. Barra é apenas visual.',
    },
    {
      label: 'pH',
      valor: leitura.ph,
      unidade: '',
      min: 5.5,
      max: 6.5,
      escalaMax: 14,
      casas: 1,
      nota: 'Faixa ideal para café: 5,5 a 6,5 (ótimo em 6,0).',
    },
    {
      label: 'Nitrogênio (N)',
      valor: leitura.nitrogenio,
      unidade: 'mg/kg',
      escalaMax: 200,
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
    {
      label: 'Fósforo (P)',
      valor: leitura.fosforo,
      unidade: 'mg/kg',
      escalaMax: 200,
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
    {
      label: 'Potássio (K)',
      valor: leitura.potassio,
      unidade: 'mg/kg',
      escalaMax: 300,
      nota: 'Valor estimado pelo sensor. Use análise laboratorial para decisões de adubação.',
    },
  ];

  return (
    <section className="vidro rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Perfil do solo</h2>
        <span className="text-xs text-off-white/40 tabular font-mono">
          {new Date(leitura.timestamp).toLocaleTimeString('pt-BR')}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {faixas.map((f) => {
          const nivel = classificar(f.valor, f.min, f.max);
          const tag = TAG[nivel];
          const pct = Math.min(100, Math.max(0, (f.valor / f.escalaMax) * 100));

          // Marcadores da faixa ideal na barra (quando existe referência)
          const temFaixa = f.min !== undefined && f.max !== undefined;
          const faixaInicio = temFaixa ? (f.min! / f.escalaMax) * 100 : 0;
          const faixaLargura = temFaixa ? ((f.max! - f.min!) / f.escalaMax) * 100 : 0;

          return (
            <div key={f.label} title={f.nota}>
              <div className="flex items-center justify-between mb-1.5">
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

              {/* Barra de visualização */}
              <div className="relative h-2 rounded-full bg-black/30 overflow-hidden">
                {/* Sombreado da faixa ideal, quando existe */}
                {temFaixa && (
                  <div
                    className="absolute inset-y-0 bg-white/10"
                    style={{ left: `${faixaInicio}%`, width: `${faixaLargura}%` }}
                  />
                )}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${COR_BARRA[nivel]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Origem dos dados */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-off-white/40">Última leitura</span>
          <span className="font-mono tabular text-off-white/70">{tempoRelativo(leitura.timestamp)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-off-white/40">Sensor</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${sensorOnline ? 'bg-verde-400 animar-luz' : 'bg-critico-500'}`} />
            <span className="text-off-white/70">{sensorOnline ? 'Online' : 'Sem leitura recente'}</span>
          </span>
        </div>
      </div>

      <p className="text-[11px] text-off-white/35 mt-4 leading-relaxed">
        N, P, K e condutividade são estimativas do sensor, não substituem análise laboratorial de solo.
      </p>
    </section>
  );
}
