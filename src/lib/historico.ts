import { supabase } from './supabaseClient';
import type { EventoSetor, LeituraSensor } from '../types';

interface EventoRow {
  id: number;
  setor_id: number;
  criado_em: string;
  tipo: 'ligou' | 'desligou';
  origem: 'manual' | 'automatico';
}

export async function listarEventosSetor(setorId: number, limite = 30): Promise<EventoSetor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('eventos_setor')
    .select('*')
    .eq('setor_id', setorId)
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (error) {
    console.error('[eventos_setor] erro ao listar:', error.message);
    return [];
  }
  return (data as EventoRow[]).map((r) => ({
    id: r.id,
    setorId: r.setor_id,
    criadoEm: r.criado_em,
    tipo: r.tipo,
    origem: r.origem,
  }));
}

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

// Ultimas leituras do sensor associado a um setor (se houver)
export async function listarLeiturasSetor(setorId: number, limite = 10): Promise<LeituraSensor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leituras_sensor')
    .select('*')
    .eq('setor_id', setorId)
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (error) {
    console.error('[leituras_sensor] erro ao listar por setor:', error.message);
    return [];
  }
  return (data as LeituraRow[]).map((r) => ({
    timestamp: r.criado_em,
    umidade: r.umidade,
    temperatura: r.temperatura,
    ec: r.ec,
    ph: r.ph,
    nitrogenio: r.nitrogenio,
    fosforo: r.fosforo,
    potassio: r.potassio,
  }));
}
