
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ComposedChart, Line, Legend 
} from 'recharts';

const coordinatorData = [
  { name: 'Tainá', score: 98.5, color: '#1B4332' },
  { name: 'Rafael', score: 96.2, color: '#1B4332' },
  { name: 'Elaine', score: 94.8, color: '#2D6A4F' },
];

const initialHubData = [
  { name: 'LRJ01', value: 98.4, color: '#1B4332' },
  { name: 'LRJ14', value: 97.2, color: '#1B4332' },
  { name: 'LES03', value: 95.8, color: '#2D6A4F' },
  { name: 'LRJ08', value: 96.5, color: '#1B4332' },
  { name: 'LES09', value: 94.1, color: '#40916C' },
  { name: 'LRJ12', value: 98.9, color: '#1B4332' },
  { name: 'LRJ04', value: 93.5, color: '#40916C' },
  { name: 'LRJ23', value: 97.8, color: '#1B4332' },
  { name: 'LRJ07', value: 96.2, color: '#1B4332' },
  { name: 'LBA14', value: 95.0, color: '#2D6A4F' },
  { name: 'LRJ05', value: 92.4, color: '#52B788' },
  { name: 'LRJ02', value: 97.1, color: '#1B4332' },
  { name: 'LRJ21', value: 94.7, color: '#40916C' },
  { name: 'LRJ15', value: 96.8, color: '#1B4332' },
  { name: 'LBA18', value: 95.5, color: '#2D6A4F' },
  { name: 'LBA17', value: 91.8, color: '#74C69D' },
];

const historyData = {
  day: [
    { label: '08:00', ats: 120, rate: 98.5 },
    { label: '10:00', ats: 450, rate: 97.2 },
    { label: '12:00', ats: 380, rate: 98.1 },
    { label: '14:00', ats: 520, rate: 96.5 },
    { label: '16:00', ats: 610, rate: 97.8 },
    { label: '18:00', ats: 290, rate: 99.2 },
  ],
  week: [
    { label: 'Seg', ats: 2100, rate: 98.2 },
    { label: 'Ter', ats: 2450, rate: 97.5 },
    { label: 'Qua', ats: 2200, rate: 98.8 },
    { label: 'Qui', ats: 2800, rate: 96.4 },
    { label: 'Sex', ats: 3100, rate: 97.1 },
    { label: 'Sab', ats: 1500, rate: 99.0 },
  ],
  month: [
    { label: 'Sem 1', ats: 12400, rate: 97.8 },
    { label: 'Sem 2', ats: 14200, rate: 98.5 },
    { label: 'Sem 3', ats: 13800, rate: 96.9 },
    { label: 'Sem 4', ats: 15600, rate: 97.2 },
  ]
};

const tableData = [
  { date: '24/05/2024', id: 'DEL-1042', driver: 'Ricardo Mendonça', code: 'AT-9921', shipments: 124, failures: 2, delivered: 122, successRate: 98.4, status: 'Sucesso' },
  { date: '24/05/2024', id: 'DEL-2205', driver: 'Julio Silva', code: 'AT-8812', shipments: 98, failures: 0, delivered: 98, successRate: 100, status: 'Sucesso' },
  { date: '23/05/2024', id: 'DEL-3198', driver: 'Ana Ferreira', code: 'AT-1102', shipments: 156, failures: 12, delivered: 144, successRate: 92.3, status: 'Alerta' },
];

const DeliverySuccess: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyRange, setHistoryRange] = useState<'day' | 'week' | 'month'>('week');

  const sortedHubData = useMemo(() => {
    return [...initialHubData].sort((a, b) => {
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    });
  }, [sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-10">
      {/* Cards de Métricas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Taxa de Sucesso" value="98.5%" change="+1.2%" subText="vs semana ant." icon="check_circle" bgClass="bg-[#D8F3DC]" colorClass="text-deluna-primary" />
        <MetricCard label="Total de Envios" value="45.120" change="+3.8%" subText="volume global" icon="local_shipping" bgClass="bg-[#E2E8F0]" colorClass="text-deluna-primary" />
        <MetricCard label="Insucessos" value="682" change="-0.5%" subText="melhoria contínua" icon="error" bgClass="bg-[#FEE2E2]" colorClass="text-[#BC4749]" negative />
        <MetricCard label="Total Entregue" value="44.438" change="+1.5%" subText="entregas concluídas" icon="inventory" bgClass="bg-deluna-teal/10" colorClass="text-deluna-teal" />
      </section>

      {/* Seção de Gráficos Superiores */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-lg border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-deluna-primary text-base md:text-lg font-bold">Performance por Coordenador</h3>
              <p className="text-xs md:text-sm text-[#64748B]">Sucesso operacional por liderança</p>
            </div>
          </div>
          <div className="space-y-6">
            {coordinatorData.map((c) => (
              <div key={c.name} className="flex items-center gap-4">
                <span className="w-16 md:w-20 text-xs md:text-sm font-semibold text-[#475569]">{c.name}</span>
                <div className="flex-1 h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-deluna-primary transition-all duration-500" style={{ width: `${c.score}%`, backgroundColor: c.color }}></div>
                </div>
                <span className="w-10 md:w-12 text-right text-xs md:text-sm font-extrabold text-deluna-primary">{c.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-lg border border-[#E2E8F0] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h3 className="text-deluna-primary text-base md:text-lg font-bold">Taxa de Sucesso por Hub</h3>
              <p className="text-xs md:text-sm text-[#64748B]">Percentual concluído por base</p>
            </div>
            <button 
              onClick={toggleSort}
              className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] px-3 py-1.5 rounded-lg text-deluna-primary text-[10px] md:text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-sm">
                {sortOrder === 'desc' ? 'keyboard_double_arrow_down' : 'keyboard_double_arrow_up'}
              </span>
              {sortOrder === 'desc' ? 'Maior' : 'Menor'}
            </button>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedHubData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis hide domain={[80, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sortedHubData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Histograma de Produtividade */}
      <section className="bg-white p-6 md:p-8 rounded-lg border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-deluna-primary text-base md:text-lg font-bold">Produtividade & Qualidade</h3>
            <p className="text-xs md:text-sm text-[#64748B]">Volume vs Qualidade</p>
          </div>
          <div className="flex bg-[#F1F5F9] p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setHistoryRange(range)}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                  historyRange === range 
                  ? 'bg-white text-deluna-primary shadow-sm' 
                  : 'text-[#64748B] hover:text-deluna-primary'
                }`}
              >
                {range === 'day' ? 'Dia' : range === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historyData[historyRange]} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} 
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[90, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: '#2c7a7b' }}
              />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }}/>
              <Bar 
                yAxisId="left" 
                dataKey="ats" 
                name="Volume" 
                fill="#1B4332" 
                radius={[4, 4, 0, 0]} 
                barSize={window.innerWidth < 768 ? 20 : 40}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="rate" 
                name="DS %" 
                stroke="#2c7a7b" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#2c7a7b' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabela Detalhada */}
      <section className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-4 md:py-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-deluna-primary">Analítico Detalhado</h3>
            <p className="text-xs md:text-sm text-[#64748B]">Granularidade operacional</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[#E2E8F0] text-[10px] md:text-xs font-bold text-deluna-primary hover:bg-[#F8FAFC]">Filtrar</button>
            <button className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-deluna-primary text-white text-[10px] md:text-xs font-bold hover:bg-deluna-primary-light">Exportar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-[#F8FAFC]">
              <tr className="text-[#64748B] text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 md:px-8 py-4">Data</th>
                <th className="px-6 md:px-8 py-4">ID</th>
                <th className="px-6 md:px-8 py-4">Motorista</th>
                <th className="px-6 md:px-8 py-4 text-right">Qtd ATs</th>
                <th className="px-6 md:px-8 py-4 text-right">Entregas</th>
                <th className="px-6 md:px-8 py-4 text-right">Taxa Sucesso</th>
                <th className="px-6 md:px-8 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-medium text-[#475569]">{row.date}</td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-bold text-[#64748B]">{row.id}</td>
                  <td className="px-6 md:px-8 py-4 md:py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-deluna-primary/10 flex items-center justify-center text-deluna-primary font-bold text-[10px]">
                        {row.driver.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs md:text-sm font-bold text-deluna-primary">{row.driver}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-slate-600">{row.shipments}</td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-deluna-primary">{row.delivered}</td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-deluna-primary">{row.successRate}%</td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                      row.status === 'Sucesso' ? 'bg-[#D8F3DC] text-deluna-primary' : 
                      row.status === 'Alerta' ? 'bg-[#FEE2E2] text-[#BC4749]' : 'bg-[#FEF3C7] text-[#D97706]'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; change: string; subText: string; icon: string; bgClass: string; colorClass: string; negative?: boolean; }> = 
({ label, value, change, subText, icon, bgClass, colorClass, negative }) => (
  <div className="flex flex-col gap-2 md:gap-3 rounded-lg p-4 md:p-6 bg-white border border-[#E2E8F0] shadow-sm transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-center">
      <p className="text-[#64748B] text-[9px] md:text-[11px] font-bold uppercase tracking-widest">{label}</p>
      <div className={`size-8 rounded-full ${bgClass} flex items-center justify-center ${colorClass}`}>
        <span className="material-symbols-outlined text-base md:text-lg">{icon}</span>
      </div>
    </div>
    <p className="text-deluna-primary text-2xl md:text-3xl font-extrabold tracking-tighter">{value}</p>
    <div className="flex items-center gap-1.5">
      <p className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${
        negative ? 'bg-red-50 text-[#BC4749]' : 'bg-[#D8F3DC] text-deluna-primary-light'
      }`}>
        {change}
      </p>
      <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">{subText}</span>
    </div>
  </div>
);

export default DeliverySuccess;
