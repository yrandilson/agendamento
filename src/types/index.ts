export interface Service {
  id: string;
  nome: string;
  duracao_min: number;
  preco: number;
  ativo: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  nome_cliente: string;
  telefone_cliente: string;
  servico_id: string;
  servico_nome: string;
  data: string;
  horario: string;
  status: 'confirmado' | 'cancelado' | 'concluido';
  created_at: string;
  cliente_user_id?: string;
}

export interface Admin {
  id: string;
  user_id?: string;
  email: string;
  ativo: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DashboardMetrics {
  total: number;
  confirmados: number;
  concluidos: number;
  cancelados: number;
  faturamento: number;
  ticket_medio: number;
  clientes_unicos: number;
}

export interface AnalyticsData {
  ultimos_30_dias: {
    data: string;
    agendamentos: number;
    faturamento: number;
  }[];
  ranking_servicos: {
    servico: string;
    quantidade: number;
    faturamento: number;
  }[];
  comparativo_mensal: {
    mes_atual: number;
    mes_anterior: number;
    variacao: number;
  };
}