export type ModoOperacao = 'sequencial' | 'paralelo';

export type StatusSetor = 'ativo' | 'aguardando' | 'desligado' | 'erro';

export interface Setor {
  id: number;            // 1 a 6
  nome: string;           // ex: "Setor 1", ou nome customizado dado pelo usuário
  releIndex: number;      // qual relé físico da HKL-EA8 (0-7) corresponde a esse setor
  horaInicio: string;     // "06:00"
  duracaoMinutos: number; // 20
  diasSemana: number[];   // 0=domingo ... 6=sábado
  ativo: boolean;         // programação ligada/desligada pelo usuário
  status: StatusSetor;
  progressoMinutos?: number; // quando status === 'ativo', quantos minutos já rodaram
}

export interface LeituraSensor {
  timestamp: string;
  umidade: number;        // %
  temperatura: number;    // °C
  ec: number;             // mS/cm (condutividade elétrica)
  ph: number;
  nitrogenio: number;     // mg/kg
  fosforo: number;        // mg/kg
  potassio: number;       // mg/kg
}

export interface EstadoSistema {
  online: boolean;
  ultimaSincronizacao: string;
  bombaLigada: boolean;
  modoOperacao: ModoOperacao;
  maxSetoresSimultaneos: number; // usado só quando modoOperacao === 'paralelo'
}
