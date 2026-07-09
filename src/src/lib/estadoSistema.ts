import { supabase } from './supabaseClient';
import type { EstadoSistema, ModoOperacao } from '../types';

interface EstadoRow {
  online: boolean;
  ultima_sincronizacao: string | null;
  bomba_ligada: boolean;
  modo_operacao: ModoOperacao;
  max_setores_simultaneos: number;
}

function fromRow(row: EstadoRow): EstadoSistema {
  return {
    online: row.online,
    ultimaSincronizacao: row.ultima_sincronizacao ?? '',
    bombaLigada: row.bomba_ligada,
    modoOperacao: row.modo_operacao,
    maxSetoresSimultaneos: row.max_setores_simultaneos,
  };
}

export async function obterEstado(): Promise<EstadoSistema | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('estado_sistema').select('*').eq('id', 1).single();
  if (error) {
    console.error('[estado_sistema] erro ao obter:', error.message);
    return null;
  }
  return fromRow(data as EstadoRow);
}

export async function definirModoOperacao(modo: ModoOperacao): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('estado_sistema').update({ modo_operacao: modo }).eq('id', 1);
  if (error) {
    console.error('[estado_sistema] erro ao definir modo:', error.message);
    return false;
  }
  return true;
}
