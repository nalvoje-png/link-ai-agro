import { supabase } from './supabaseClient';

export interface Rele {
  id: number;
  nome: string;
  ligado: boolean;
  atualizado_em: string;
  comando_em: string | null;
}

export async function listarReles(): Promise<Rele[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('reles').select('*').order('id');
  if (error) {
    console.error('[reles] erro ao listar:', error.message);
    return [];
  }
  return data as Rele[];
}

export async function alternarRele(id: number, ligado: boolean): Promise<boolean> {
  if (!supabase) return false;
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from('reles')
    .update({ ligado, atualizado_em: agora, comando_em: agora })
    .eq('id', id);
  if (error) {
    console.error('[reles] erro ao atualizar:', error.message);
    return false;
  }
  return true;
}
