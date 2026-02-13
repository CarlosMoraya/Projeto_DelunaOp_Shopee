import React, { useState, useEffect, useMemo } from 'react';
import { DeliveryData, QLPData, MetaGoalData } from '../types';
import { fetchDeliveryData, fetchQLPData, fetchMetasData } from '../services/api';

interface ComparativoATsProps {
  startDate: string;
  endDate: string;
}

interface BaseMetricsATs {
  base: string;
  locality: string;
  leader: string;
  coordinator: string;
  qlp: number;
  meta1: number | null; // Null se cruzar meses
  carrMed: number;
  carrMax: number;
  prevTotal: number;
  currTotal: number;
  pending: number;
  trend: 'up' | 'down';
}

const ComparativoATs: React.FC<ComparativoATsProps> = ({ startDate, endDate }) => {
  const [allData, setAllData] = useState<DeliveryData[]>([]);
  const [qlpData, setQlpData] = useState<QLPData[]>([]);
  const [metasData, setMetasData] = useState<MetaGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deliveryRes, qlpRes, metasRes] = await Promise.all([
          fetchDeliveryData(),
          fetchQLPData(),
          fetchMetasData()
        ]);
        setAllData(deliveryRes);
        setQlpData(qlpRes);
        setMetasData(metasRes);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);



  // Função auxiliar para converter string YYYY-MM-DD para Date local (evita problemas de timezone)
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Calcular período anterior (mesmo intervalo no mês anterior)
  const getPreviousPeriod = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);

    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    return {
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0]
    };
  }, [startDate, endDate]);

  // Função auxiliar de filtro
  const filterByPeriod = (data: DeliveryData[], start: string, end: string) => {
    const startTime = parseLocalDate(start).getTime();
    const endTime = parseLocalDate(end).getTime();
    return data.filter(row => {
      const rowDate = parseLocalDate(row.date).getTime();
      return rowDate >= startTime && rowDate <= endTime;
    });
  };

  // Lista de coordenadores únicos para o filtro
  const coordinators = useMemo(() => {
    const unique = [...new Set(allData.map(d => d.coordinator))].filter(c => c && c !== 'S/C');
    return unique.sort();
  }, [allData]);

  const currentPeriodData = useMemo(() => {
    let data = filterByPeriod(allData, startDate, endDate);
    if (selectedCoordinator) {
      data = data.filter(d => d.coordinator === selectedCoordinator);
    }
    return data;
  }, [allData, startDate, endDate, selectedCoordinator]);

  const previousPeriodData = useMemo(() => {
    let data = filterByPeriod(allData, getPreviousPeriod.start, getPreviousPeriod.end);
    if (selectedCoordinator) {
      data = data.filter(d => d.coordinator === selectedCoordinator);
    }
    return data;
  }, [allData, getPreviousPeriod, selectedCoordinator]);

  const qlpCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const normalizeBase = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');

    qlpData.forEach(row => {
      const normalizedBase = normalizeBase(row.base);
      if (normalizedBase) {
        counts.set(normalizedBase, (counts.get(normalizedBase) || 0) + 1);
      }
    });
    return counts;
  }, [qlpData]);

  // Agrupar por BASE e Calcular Métricas
  const baseMetrics = useMemo(() => {
    const basesMap = new Map<string, {
      locality: string;
      leader: string;
      coordinator: string;
      currDaysData: Map<string, Set<string>>; // Map<Data, Set<AT_ID>>
      currTotal: number;
      prevTotal: number;
      pending: number;
    }>();

    // Processar PERÍODO ATUAL
    currentPeriodData.forEach(row => {
      const base = row.hub;
      if (!basesMap.has(base)) {
        basesMap.set(base, {
          locality: row.locality || '',
          leader: row.leader || '',
          coordinator: row.coordinator || '',
          currDaysData: new Map(),
          currTotal: 0,
          prevTotal: 0,
          pending: 0
        });
      }
      const entry = basesMap.get(base)!;

      // Contagem de rotas únicas (ATs)
      const dayKey = row.date;
      const dayATs = entry.currDaysData.get(dayKey) || new Set<string>();

      if (row.atCode && row.atCode !== '') {
        dayATs.add(row.atCode);
      } else {
        // Fallback para linhas sem código de AT
        dayATs.add(`row-${row.id}-${Math.random()}`);
      }
      entry.currDaysData.set(dayKey, dayATs);

      // Pendentes: somar TODAS as ocorrências (cada linha conta)
      entry.pending += row.pending || 0;
    });

    // Calcular TOTAL ATUAL (soma dos tamanhos dos sets de cada dia)
    basesMap.forEach((entry) => {
      let total = 0;
      entry.currDaysData.forEach(set => total += set.size);
      entry.currTotal = total;
    });

    // Processar PERÍODO ANTERIOR
    const prevBasesMap = new Map<string, Map<string, Set<string>>>();

    previousPeriodData.forEach(row => {
      const base = row.hub;
      if (!prevBasesMap.has(base)) {
        prevBasesMap.set(base, new Map());
      }
      const userDays = prevBasesMap.get(base)!;
      const dayKey = row.date;
      const dayATs = userDays.get(dayKey) || new Set<string>();

      if (row.atCode && row.atCode !== '') {
        dayATs.add(row.atCode);
      } else {
        dayATs.add(`row-${row.id}-${Math.random()}`);
      }
      userDays.set(dayKey, dayATs);
    });

    // Consolidar totais anteriores no mapa principal
    prevBasesMap.forEach((daysMap, base) => {
      if (!basesMap.has(base)) {
        const sampleRow = previousPeriodData.find(r => r.hub === base);
        basesMap.set(base, {
          locality: sampleRow?.locality || '',
          leader: sampleRow?.leader || '',
          coordinator: sampleRow?.coordinator || '',
          currDaysData: new Map(),
          currTotal: 0,
          prevTotal: 0,
          pending: 0
        });
      }
      let total = 0;
      daysMap.forEach(set => total += set.size);
      basesMap.get(base)!.prevTotal = total;
    });

    // Função para calcular META 1 (dentro do useMemo para acessar startDate e endDate)
    const calculateMeta1 = (baseName: string) => {
      // Validar datas
      if (!startDate || !endDate) return 0;

      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

      // 1. Verificar se cruza meses
      if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
        return null; // Retorna null para exibir traço
      }

      // 2. Definir nome do mês
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const currentMonthName = months[start.getMonth()];

      // 3. Calcular dias
      // +1 para incluir o dia final no cálculo
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // 4. Encontrar meta
      const normalize = (s: string) => s.toUpperCase().replace(/[\s_|-]/g, '');
      const normalizedBase = normalize(baseName);

      // Usar comparação de string case-insensitive
      const meta = metasData.find(m =>
        normalize(m.base) === normalizedBase &&
        m.periodo.toLowerCase() === currentMonthName.toLowerCase() &&
        m.tipoMeta === 1
      );

      if (!meta) return 0;

      return Math.round(meta.valorMetaDia * diffDays);
    };


    // Construir resultado final
    const result: BaseMetricsATs[] = [];

    basesMap.forEach((data, base) => {
      const dailyCounts: number[] = [];
      data.currDaysData.forEach(set => dailyCounts.push(set.size));

      const numDaysOperated = dailyCounts.length;
      const totalRoutesPeriod = dailyCounts.reduce((a, b) => a + b, 0);

      const carrMed = numDaysOperated > 0 ? Math.round(totalRoutesPeriod / numDaysOperated) : 0;
      const carrMax = numDaysOperated > 0 ? Math.max(...dailyCounts) : 0;

      const normalizeBase = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');

      result.push({
        base,
        locality: data.locality,
        leader: data.leader,
        coordinator: data.coordinator,
        qlp: qlpCounts.get(normalizeBase(base)) || 0,
        meta1: calculateMeta1(base),
        carrMed,
        carrMax,
        prevTotal: data.prevTotal,
        currTotal: data.currTotal,
        pending: data.pending,
        trend: data.currTotal >= data.prevTotal ? 'up' : 'down'
      });
    });

    // Filtrar por pendentes se solicitado
    let finalResult = result;
    if (showOnlyPending) {
      finalResult = result.filter(item => item.pending > 0);
    }

    return finalResult.sort((a, b) => a.base.localeCompare(b.base));
  }, [currentPeriodData, previousPeriodData, qlpCounts, metasData, startDate, endDate, showOnlyPending]);

  // Calcular totais gerais
  const totals = useMemo(() => {
    if (baseMetrics.length === 0) return null;

    const visibleBases = new Set(baseMetrics.map(b => b.base));

    // Agregar dados diários globais (apenas para bases visíveis)
    const dailyGlobalMap = new Map<string, Set<string>>();
    currentPeriodData.forEach(row => {
      if (!visibleBases.has(row.hub)) return;

      const dayKey = row.date;
      const daySet = dailyGlobalMap.get(dayKey) || new Set<string>();
      if (row.atCode && row.atCode !== '') {
        daySet.add(`${row.hub}-${row.atCode}`);
      } else {
        daySet.add(`${row.hub}-row-${row.id}-${Math.random()}`);
      }
      dailyGlobalMap.set(dayKey, daySet);
    });

    const dailyCounts = Array.from(dailyGlobalMap.values()).map(set => set.size);
    const totalATs = dailyCounts.reduce((a, b) => a + b, 0);
    const numDays = dailyCounts.length;

    const totalCarrMed = numDays > 0 ? Math.round(totalATs / numDays) : 0;
    const totalCarrMax = dailyCounts.length > 0 ? Math.max(...dailyCounts) : 0;

    const totalPrev = baseMetrics.reduce((sum, item) => sum + item.prevTotal, 0);
    const totalCurr = baseMetrics.reduce((sum, item) => sum + item.currTotal, 0);
    const totalPending = baseMetrics.reduce((sum, item) => sum + item.pending, 0);
    const totalQLP = baseMetrics.reduce((sum, item) => sum + item.qlp, 0);

    // Soma das Metas (cuidado com nulls)
    let totalMeta1 = 0;
    let hasCrossMonth = false;
    baseMetrics.forEach(item => {
      if (item.meta1 === null) {
        hasCrossMonth = true;
      } else {
        totalMeta1 += item.meta1;
      }
    });

    return {
      carrMed: totalCarrMed,
      carrMax: totalCarrMax,
      prev: totalPrev,
      curr: totalCurr,
      pending: totalPending,
      totalQLP,
      totalMeta1: hasCrossMonth ? null : totalMeta1
    };
  }, [baseMetrics, currentPeriodData]);


  const formatNum = (val: number) => val.toLocaleString('pt-BR');

  const calcVarPercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return (
    <div className="p-4 md:p-10 font-inter bg-[#F8FAFC] min-h-screen flex flex-col gap-6 md:gap-10">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-3xl font-black text-deluna-primary uppercase tracking-tighter">
            Cenários de Comparação Operacional
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Exibindo comparativo de <span className="text-deluna-primary font-bold uppercase">Período Anterior</span> vs <span className="text-deluna-primary font-bold uppercase">Período Atual</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Filtro por Coordenador */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Coordenador:</label>
            <select
              value={selectedCoordinator}
              onChange={(e) => setSelectedCoordinator(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-deluna-primary outline-none focus:ring-2 focus:ring-deluna-primary/20"
            >
              <option value="">Todos</option>
              {coordinators.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Pendentes */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Exibir:</label>
            <select
              value={showOnlyPending ? 'pending' : 'all'}
              onChange={(e) => setShowOnlyPending(e.target.value === 'pending')}
              className={`px-3 py-2 bg-white border rounded-lg text-sm font-bold outline-none transition-all focus:ring-2 ${showOnlyPending
                ? 'border-red-200 text-red-600 focus:ring-red-500/20'
                : 'border-slate-200 text-deluna-primary focus:ring-deluna-primary/20'
                }`}
            >
              <option value="all">Todas as Bases</option>
              <option value="pending">Somente Pendentes (!)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">Carregando dados...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-deluna-primary text-white text-[11px] font-black uppercase tracking-[0.15em]">
                  <th className="px-6 py-5 border-r border-white/10">BASE | DS</th>
                  <th className="px-6 py-5 border-r border-white/10">Localidade</th>
                  <th className="px-6 py-5 border-r border-white/10">Líder</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">QLP</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Méd</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Máx</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">DIF META 1</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center bg-amber-500/20 text-amber-100">META 1</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Ant. (ATs)</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Atual (ATs)</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">PENDENTES</th>
                  <th className="px-6 py-5 text-center bg-black min-w-[120px]">Var %</th>
                  <th className="px-6 py-5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-medium text-slate-700">
                {baseMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400 font-bold">Nenhum dado encontrado para o período selecionado</td>
                  </tr>
                ) : (
                  <>
                    {baseMetrics.map((row, i) => {
                      const variance = calcVarPercent(row.currTotal, row.prevTotal);
                      return (
                        <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                          <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100">{row.base}</td>
                          <td className="px-6 py-4 italic font-bold text-slate-500 border-r border-slate-100">{row.locality || '-'}</td>
                          <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.leader || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold text-deluna-primary">{row.qlp || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMed || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMax || '-'}</td>
                          <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.meta1 !== null ? (row.currTotal - row.meta1 >= 0 ? 'text-green-700 bg-green-50/30' : 'text-red-600 bg-red-50/30') : ''}`}>
                            {row.meta1 !== null ? formatNum(row.currTotal - row.meta1) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-green-800 bg-green-50">
                            {row.meta1 !== null ? formatNum(row.meta1) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-slate-400">
                            {formatNum(row.prevTotal)}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-slate-800">
                            {formatNum(row.currTotal)}
                          </td>
                          <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.pending > 0 ? 'text-red-600 bg-red-50/10' : 'text-slate-400'}`}>
                            {row.pending > 0 ? formatNum(row.pending) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center bg-slate-50/80 font-black">
                            <div className="flex items-center justify-center gap-2">
                              <span className={variance >= 0 ? 'text-green-700' : 'text-red-600'}>
                                {variance.toFixed(1).replace('.', ',')}%
                              </span>
                              <span className={`material-symbols-outlined text-[16px] ${variance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {variance >= 0 ? 'change_history' : 'stat_minus_1'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center h-5">
                              <SimpleSparkline trend={row.trend} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Rodapé - Total Geral */}
                    {totals && (
                      <tr className="bg-white border-t-2 border-slate-900 font-black text-deluna-primary text-[10px] md:text-[12px]">
                        <td colSpan={3} className="px-6 py-5 italic text-right border-r border-slate-100 uppercase tracking-widest">Total Geral</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.totalQLP || '-'}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMed || '-'}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMax || '-'}</td>
                        <td className={`px-6 py-5 text-center border-r border-slate-100 font-black ${totals.totalMeta1 !== null ? (totals.curr - totals.totalMeta1 >= 0 ? 'text-green-700 bg-green-50/30' : 'text-red-600 bg-red-50/30') : ''}`}>
                          {totals.totalMeta1 !== null ? formatNum(totals.curr - totals.totalMeta1) : '-'}
                        </td>
                        <td className="px-6 py-5 text-center border-r border-slate-100 text-green-800 bg-green-50">
                          {totals.totalMeta1 !== null ? formatNum(totals.totalMeta1) : '-'}
                        </td>
                        <td className="px-6 py-5 text-center border-r border-slate-100 text-slate-400">{formatNum(totals.prev)}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100 text-deluna-primary">{formatNum(totals.curr)}</td>
                        <td className={`px-6 py-5 text-center border-r border-slate-100 ${totals.pending > 0 ? 'text-red-600 bg-red-50/10' : ''}`}>
                          {totals.pending > 0 ? formatNum(totals.pending) : '-'}
                        </td>
                        <td className="px-6 py-5 text-center bg-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            {(() => {
                              const totalVar = calcVarPercent(totals.curr, totals.prev);
                              return (
                                <>
                                  <span className={totalVar >= 0 ? 'text-deluna-primary' : 'text-red-600'}>
                                    {totalVar.toFixed(1).replace('.', ',')}%
                                  </span>
                                  <span className={`material-symbols-outlined text-[16px] ${totalVar >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {totalVar >= 0 ? 'change_history' : 'stat_minus_1'}
                                  </span>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-5"></td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const SimpleSparkline: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => (
  <svg width="70" height="24" viewBox="0 0 70 24" preserveAspectRatio="none" className="overflow-visible">
    {trend === 'up' ? (
      <path d="M0 22 L14 18 L28 20 L42 14 L56 12 L70 4" fill="none" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M0 4 L14 8 L28 6 L42 16 L56 18 L70 22" fill="none" stroke="#BC4749" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

export default ComparativoATs;
