import { supabase } from './supabaseClient';
import type { LeituraSensor } from '../types';

interface LeituraRow {
  criado_em: string;
  umidade: number;
  temperatura: number;
  ec: number;
  ph: number;
  nitrogenio: number;
  fosforo: number;
  potassio: number;
}

function fromRow(row: LeituraRow): LeituraSensor {
  return {
    timestamp: row.criado_em,
    umidade: row.umidade,
    temperatura: row.temperatura,
    ec: row.ec,
    ph: row.ph,
    nitrogenio: row.nitrogenio,
    fosforo: row.fosforo,
    potassio: row.potassio,
  };
}

// Pega a leitura mais recente do sensor de solo.
export async function obterUltimaLeitura(): Promise<LeituraSensor | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('leituras_sensor')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[leituras_sensor] erro ao obter ultima leitura:', error.message);
    return null;
  }
  return data ? fromRow(data as LeituraRow) : null;
}
