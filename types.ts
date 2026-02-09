
export enum AppView {
  DELIVERY_SUCCESS = 'delivery_success',
  QLP_MANAGEMENT = 'qlp_management',
  PROTAGONISMO = 'protagonismo',
  LEADERBOARD = 'leaderboard',
  COMPARATIVO = 'comparativo',
  COMPARATIVO_ATS = 'comparativo_ats'
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  colorClass?: string;
  bgClass?: string;
  subText?: string;
}

export interface DriverPerformance {
  date: string;
  driver: string;
  avatar?: string;
  atCode: string;
  shipments: number;
  failures: number;
  pending: number;
  delivered: number;
  status: 'Success' | 'Pending' | 'High Failure';
}

export interface RawDeliveryRow {
  Bases: string;
  Date: string;
  ID: string | number;
  Motorista: string;
  AT: string | number;
  Ciclo: string;
  Remessas: string | number;
  Insucessos: string | number;
  Pendentes: string | number;
  D0: string | number;
  D1: string | number;
  D2: string | number;
  Performance: string | number;
  Status: string;
  Semana: string;
  'Dia da Semana': string;
  'Mês': string;
  Entregues: string | number;
  Coordenador: string;
  Lider: string;
  Localidade: string;
}

export interface DeliveryData {
  date: string;
  id: string;
  driver: string;
  hub: string;
  coordinator: string;
  leader: string;
  locality: string;
  atCode: string;
  atQuantity: number;
  failures: number;
  delivered: number;
  pending: number;
  successRate: number;
  status: 'META ALCANÇADA' | 'PRÓX DA META' | 'ABAIXO DA META';
}

export interface RawQLPRow {
  [key: string]: any;
}

export interface QLPData {
  base: string;
  placa: string;
  nome: string;
  situacaoCnh: string;
  situacaoMotorista: string;
  tipoVeiculo: string;
  situacaoGrPlaca: string;
  cliente: string;
  coordenador: string;
}

export interface MetaGoalData {
  base: string;
  periodo: string; // Ex: "Janeiro"
  tipoMeta: number;
  valorMetaDia: number;
  valorPremio: number;
}

export interface MetaDSData {
  base: string;
  tipoMeta: number; // 1, 2, 3
  valorMetaDS: number;
  valorPremio: number;
}

export interface MetaCaptacaoData {
  base: string;
  valorMetaQLP: number;
  valorPremio: number;
}

export interface BaseListItem {
  base: string;
  coord: string;
  lider: string;
  localidade: string;
  avatar?: string;
}

export interface ProtagonismoNote {
  base: string;
  nota: number;
}

export interface ProtagonismoRow extends BaseListItem {
  resultado: number;
}
