
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
