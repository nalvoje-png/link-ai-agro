import { supabase } from './supabaseClient';
import type { JanelaHorario, Setor, StatusSetor } from '../types';

// A tabela usa snake_case; o app usa camelCase. Estas funcoes fazem a conversao.

interface JanelaRow {
  inicio: string;
  fim: string;
}

interface SetorRow {
  id: number;
  nome: string;
  rele_index: number;
  janelas: JanelaRow[];
  dias_semana: number[];
  ativo: boolean;
  status: StatusSetor;
  progresso_minutos: number | null;
  tem_sensor: boolean;
}

function fromRow(row: SetorRow): Setor {
  return {
    id: row.id,
    nome: row.nome,
    releIndex: row.rele_index,
    janelas: (row.janelas ?? []).map((j, i) => ({
      id: `${row.id}-${i}`,
      inicio: j.inicio,
      fim: j.fim,
    })),
    diasSemana: row.dias_semana ?? [],
    ativo: row.ativo,
    status: row.status,
    progressoMinutos: row.progresso_minutos ?? undefined,
    temSensor: row.tem_sensor ?? false,
  };
}

function janelasParaRow(janelas: JanelaHorario[]): JanelaRow[] {
  return janelas.map((j) => ({ inicio: j.inicio, fim: j.fim }));
}

export async function listarSetores(): Promise<Setor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('setores').select('*').order('id');
  if (error) {
    console.error('[setores] erro ao listar:', error.message);
    return [];
  }
  return (data as SetorRow[]).map(fromRow);
}

// Atualiza apenas os campos de configuracao (janelas/dias/ativo).
export async function salvarConfigSetor(setor: Setor): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('setores')
    .update({
      janelas: janelasParaRow(setor.janelas),
      dias_semana: setor.diasSemana,
      ativo: setor.ativo,
    })
    .eq('id', setor.id);
  if (error) {
    console.error('[setores] erro ao salvar config:', error.message);
    return false;
  }
  return true;
}

// Usado pelo botao manual "Ligar/Desligar agora" — muda so o status.
export async function definirStatusSetor(id: number, status: StatusSetor, progressoMinutos?: number): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('setores')
    .update({ status, progresso_minutos: progressoMinutos ?? null })
    .eq('id', id);
  if (error) {
    console.error('[setores] erro ao definir status:', error.message);
    return false;
  }
  return true;
}
