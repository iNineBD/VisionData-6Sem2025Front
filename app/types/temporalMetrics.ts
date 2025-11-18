export type Meses =
  | 'janeiro'
  | 'fevereiro'
  | 'marco'
  | 'abril'
  | 'maio'
  | 'junho'
  | 'julho'
  | 'agosto'
  | 'setembro'
  | 'outubro'
  | 'novembro'
  | 'dezembro';


// Qtd tickets por mês
export type TicketsPorMes = {
  [mes in Meses]: number;
};

// Qtd tickets por ano (ex: 2023, 2024, 2025)
export type TemporalMetricByYear = {
  [ano: string]: TicketsPorMes[];
};

// Agrupamento genérico (por status, prioridade, etc.)
export type TemporalMetricData<GroupKey extends string = string> = {
  [group in GroupKey]: TemporalMetricByYear;
};

// Estrutura genérica de resposta
export interface TemporalMetricsResponse<GroupKey extends string = string> {
  success: boolean;
  timestamp: string;
  data: TemporalMetricData<GroupKey>;
  message: string;
}

// Tickets por STATUS
export type Status =
  | 'Aberto'
  | 'Aguardando Cliente'
  | 'Em Atendimento'
  | 'Fechado'
  | 'Resolvido';

export type TicketsPorStatusResponse = TemporalMetricsResponse<Status>;

// Tickets por PRIORIDADE
export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type TicketsPorPrioridadeResponse = TemporalMetricsResponse<Prioridade>;

// Tickets por ANO e MÊS (sem agrupamento por status/prioridade)
export interface TicketsPorAnoMesResponse {
  success: boolean;
  timestamp: string;
  data: {
    [ano: string]: TicketsPorMes[];
  };
  message: string;
}

// Tempo médio de resolução por PRIORIDADE
export interface MeanTimeByPriority {
  priorityName: string;
  meanTimeHour: number;
  meanTimeDay: number;
}

export interface MeanTimeByPriorityResponse {
  success: boolean;
  timestamp: string;
  data: MeanTimeByPriority[];
  message: string;
}

// Tipo genérico para todas as métricas
export type AnyMetricsResponse =
  | TicketsPorStatusResponse
  | TicketsPorPrioridadeResponse
  | TicketsPorAnoMesResponse
  | MeanTimeByPriorityResponse;
