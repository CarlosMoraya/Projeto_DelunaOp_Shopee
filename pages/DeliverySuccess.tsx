import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ComposedChart, Line, Legend
} from 'recharts';
import { fetchDeliveryData } from '../services/api';
import { DeliveryData } from '../types';

const ITEMS_PER_PAGE = 20;

const getColorByScore = (score: number) => {
  if (score >= 98) return '#1B4332';
  if (score >= 95) return '#2D6A4F';
  if (score >= 90) return '#40916C';
  if (score >= 85) return '#52B788';
  return '#74C69D';
};

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

const DeliverySuccess: React.FC<{ startDate: string; endDate: string }> = ({ startDate, endDate }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyRange, setHistoryRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedCoordinator, setSelectedCoordinator] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState('');

  const [tableData, setTableData] = useState<DeliveryData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchDeliveryData();
        setTableData(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados da planilha.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTableData = useMemo(() => {
    return tableData.filter(row => {
      const matchCoord = !selectedCoordinator || row.coordinator === selectedCoordinator;
      const matchHub = !selectedHub || row.hub === selectedHub;
      const matchDriver = !driverSearch || row.driver.toLowerCase().includes(driverSearch.toLowerCase());

      // Filtro de Range de Data
      const rowDate = new Date(row.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const matchDate = (!startDate || rowDate >= start) && (!endDate || rowDate <= end);

      return matchCoord && matchHub && matchDate && matchDriver;
    });
  }, [tableData, selectedCoordinator, selectedHub, driverSearch, startDate, endDate]);

  // Dados páginados e ordenados
  const paginatedData = useMemo(() => {
    // 1. Ordena por Data (Mais recente primeiro)
    const sorted = [...filteredTableData].sort((a, b) => {
      // Tenta converter para data, se falhar, usa string compare
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateB - dateA; // Decrescente
      }
      return 0;
    });

    // 2. Pagina
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTableData, currentPage]);

  const totalPages = Math.ceil(filteredTableData.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCoordinator, selectedHub, driverSearch, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totals = useMemo(() => {
    const totalShipments = filteredTableData.reduce((acc, row) => acc + row.atQuantity, 0);
    const totalDelivered = filteredTableData.reduce((acc, row) => acc + row.delivered, 0);
    const totalFailures = filteredTableData.reduce((acc, row) => acc + row.failures, 0);
    const successRate = totalShipments > 0 ? (totalDelivered / totalShipments) * 100 : 0;

    return {
      successRate: successRate.toFixed(1) + '%',
      shipments: totalShipments.toLocaleString('pt-BR'),
      failures: totalFailures.toLocaleString('pt-BR'),
      delivered: totalDelivered.toLocaleString('pt-BR')
    };
  }, [filteredTableData]);

  // Histograma dinâmico baseado no filtro
  const dynamicHistoryData = useMemo(() => {
    const grouped = new Map<string, { ats: number, delivered: number }>();

    filteredTableData.forEach(row => {
      // Agrupa por data (YYYY-MM-DD)
      const label = row.date || 'S/D';
      const current = grouped.get(label) || { ats: 0, delivered: 0 };
      grouped.set(label, {
        ats: current.ats + row.atQuantity,
        delivered: current.delivered + row.delivered
      });
    });

    const entries = Array.from(grouped.entries())
      .map(([label, stats]) => ({
        label: new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ats: stats.ats,
        rate: stats.ats > 0 ? Math.round((stats.delivered / stats.ats) * 1000) / 10 : 0,
        sortKey: label
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return {
      day: entries.slice(-7), // Ultimos 7 dias se for "dia"
      week: entries.slice(-14),
      month: entries
    };
  }, [filteredTableData]);

  const dynamicCoordinatorData = useMemo(() => {
    const map = new Map<string, { totalAt: number, totalDelivered: number }>();
    tableData.forEach(row => {
      const coord = row.coordinator || 'S/C';
      const current = map.get(coord) || { totalAt: 0, totalDelivered: 0 };
      map.set(coord, {
        totalAt: current.totalAt + row.atQuantity,
        totalDelivered: current.totalDelivered + row.delivered
      });
    });

    const result = Array.from(map.entries()).map(([name, stats]) => {
      const score = stats.totalAt > 0 ? (stats.totalDelivered / stats.totalAt) * 100 : 0;
      return {
        name,
        score: Math.round(score * 10) / 10,
        color: getColorByScore(score)
      };
    });

    return result.sort((a, b) => b.score - a.score);
  }, [tableData]);

  const dynamicHubData = useMemo(() => {
    const map = new Map<string, { totalAt: number, totalDelivered: number }>();
    // Hub chart é filtrado por COORDENADOR mas não por ele mesmo (para poder selecionar outro hub)
    const hubFilterSource = tableData.filter(row => !selectedCoordinator || row.coordinator === selectedCoordinator);

    hubFilterSource.forEach(row => {
      const hub = row.hub || 'S/H';
      const current = map.get(hub) || { totalAt: 0, totalDelivered: 0 };
      map.set(hub, {
        totalAt: current.totalAt + row.atQuantity,
        totalDelivered: current.totalDelivered + row.delivered
      });
    });

    const result = Array.from(map.entries()).map(([name, stats]) => {
      const score = stats.totalAt > 0 ? (stats.totalDelivered / stats.totalAt) * 100 : 0;
      return {
        name,
        value: Math.round(score * 10) / 10,
        color: getColorByScore(score)
      };
    });

    return result.sort((a, b) => {
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    });
  }, [tableData, sortOrder, selectedCoordinator]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSelectedCoordinator(null);
    setSelectedHub(null);
    setDriverSearch('');
  };

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-10">
      {/* Cards de Métricas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Taxa de Sucesso" value={totals.successRate} change="+1.2%" subText="vs semana ant." icon="check_circle" bgClass="bg-[#D8F3DC]" colorClass="text-deluna-primary" />
        <MetricCard label="Total de Envios" value={totals.shipments} change="+3.8%" subText="volume global" icon="local_shipping" bgClass="bg-[#E2E8F0]" colorClass="text-deluna-primary" />
        <MetricCard label="Insucessos" value={totals.failures} change="-0.5%" subText="melhoria contínua" icon="error" bgClass="bg-[#FEE2E2]" colorClass="text-[#BC4749]" negative />
        <MetricCard label="Total Entregue" value={totals.delivered} change="+1.5%" subText="entregas concluídas" icon="inventory" bgClass="bg-deluna-teal/10" colorClass="text-deluna-teal" />
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
            {dynamicCoordinatorData.slice(0, 5).map((c) => (
              <div
                key={c.name}
                onClick={() => setSelectedCoordinator(selectedCoordinator === c.name ? null : c.name)}
                className={`flex items-center gap-4 cursor-pointer p-2 rounded-lg transition-all ${selectedCoordinator === c.name ? 'bg-deluna-primary/10 ring-1 ring-deluna-primary' : 'hover:bg-slate-50'}`}
              >
                <span className={`w-16 md:w-20 text-xs md:text-sm font-semibold ${selectedCoordinator === c.name ? 'text-deluna-primary' : 'text-[#475569]'}`}>{c.name}</span>
                <div className="flex-1 h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${c.score}%`, backgroundColor: selectedCoordinator && selectedCoordinator !== c.name ? '#CBD5E1' : c.color }}></div>
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
              <BarChart
                data={dynamicHubData}
                margin={{ bottom: 20 }}
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    setSelectedHub(selectedHub === data.activeLabel ? null : data.activeLabel as string);
                  }
                }}
              >
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
                  {dynamicHubData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedHub && selectedHub !== entry.name ? '#CBD5E1' : entry.color}
                      className="cursor-pointer"
                    />
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
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${historyRange === range
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
            <ComposedChart data={dynamicHistoryData[historyRange]} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
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
                domain={[80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: '#2c7a7b' }}
              />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
            {/* Campo de Busca por Motorista */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Buscar motorista..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-deluna-primary placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-deluna-primary/20 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {(selectedCoordinator || selectedHub || driverSearch) && (
                <button
                  onClick={clearFilters}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-50 text-red-600 text-[10px] md:text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  Limpar
                </button>
              )}
              <button className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[#E2E8F0] text-[10px] md:text-xs font-bold text-deluna-primary hover:bg-[#F8FAFC]">Filtrar</button>
              <button className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-deluna-primary text-white text-[10px] md:text-xs font-bold hover:bg-deluna-primary-light">Exportar</button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold">Carregando dados...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-bold">{error}</div>
          ) : (
            <>
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-[#64748B] text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 md:px-8 py-4">Data</th>
                    <th className="px-6 md:px-8 py-4">ID</th>
                    <th className="px-6 md:px-8 py-4">AT</th>
                    <th className="px-6 md:px-8 py-4">Motorista</th>
                    <th className="px-6 md:px-8 py-4 text-right">Qtd ATs</th>
                    <th className="px-6 md:px-8 py-4 text-right">Entregas</th>
                    <th className="px-6 md:px-8 py-4 text-right">Taxa Sucesso</th>
                    <th className="px-6 md:px-8 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">Nenhum dado encontrado</td>
                    </tr>
                  ) : (
                    paginatedData.map((row, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-medium text-[#475569]">
                          {new Date(row.date).toLocaleDateString('pt-BR') !== 'Invalid Date' ? new Date(row.date).toLocaleDateString('pt-BR') : row.date}
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-bold text-[#64748B]">{row.id}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-bold text-deluna-primary">{row.atCode}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-deluna-primary/10 flex items-center justify-center text-deluna-primary font-bold text-[10px]">
                              {row.driver.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs md:text-sm font-bold text-deluna-primary">{row.driver}</span>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-slate-600">{row.atQuantity}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-deluna-primary">{row.delivered}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm text-right font-black text-deluna-primary">{row.successRate}%</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${row.status === 'META ALCANÇADA' ? 'bg-[#D8F3DC] text-deluna-primary' :
                            row.status === 'ABAIXO DA META' ? 'bg-[#FEE2E2] text-[#BC4749]' : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Paginação */}
              <div className="flex justify-between items-center px-6 md:px-8 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                <p className="text-xs font-bold text-[#64748B]">
                  Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTableData.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredTableData.length)} de {filteredTableData.length} registros
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold text-deluna-primary bg-white border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    Anterior
                  </button>
                  <span className="flex items-center px-3 text-xs font-black text-deluna-primary">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold text-deluna-primary bg-white border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
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
        <p className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${negative ? 'bg-red-50 text-[#BC4749]' : 'bg-[#D8F3DC] text-deluna-primary-light'
          }`}>
          {change}
        </p>
        <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">{subText}</span>
      </div>
    </div>
  );

export default DeliverySuccess;
