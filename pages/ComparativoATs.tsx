
import React, { useState, useEffect, useMemo } from 'react';
import { DeliveryData } from '../types';
import { fetchDeliveryData } from '../services/api';

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
  carrMed: number;
  carrMax: number;
  prevTotal: number;
  currTotal: number;
  trend: 'up' | 'down';
}

const ComparativoATs: React.FC<ComparativoATsProps> = ({ startDate, endDate }) => {
  const [allData, setAllData] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchDeliveryData();
        setAllData(data);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calcular período anterior (mesmo intervalo no mês anterior)
  const getPreviousPeriod = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

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
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return data.filter(row => {
      const rowDate = new Date(row.date).getTime();
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

  // Agrupar por BASE e Calcular Métricas
  const baseMetrics = useMemo(() => {
    const basesMap = new Map<string, {
      locality: string;
      leader: string;
      coordinator: string;
      currDaysData: Map<string, Set<string>>; // Map<Data, Set<AT_ID>>
      currTotal: number;
      prevTotal: number;
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
          prevTotal: 0
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
    // (Atenção: bases que só existiram no mês anterior e não no atual não aparecerão na tabela
    // se iterarmos apenas sobre basesMap. Se quisermos mostrar todas, precisaríamos unir as chaves.
    // O padrão geralmente é mostrar a base ativa. Vamos manter basesMap como guia).
    prevBasesMap.forEach((daysMap, base) => {
      if (!basesMap.has(base)) {
        // Se a base teve volume apenas no mês anterior e queremos mostrá-la:
        // Precisamos recuperar locality/leader/coordinator de algum registro anterior
        // Simplificação: Vamos focar nas bases que têm operação atual ou vamos adicionar se não existir?
        // "Comparativo" geralmente foca no presente vs passado. Se a base fechou, talvez deva aparecer zerada no atual.
        // Para consistência com Comparativo.tsx, vamos adicionar se não existir.
        const sampleRow = previousPeriodData.find(r => r.hub === base);
        basesMap.set(base, {
          locality: sampleRow?.locality || '',
          leader: sampleRow?.leader || '',
          coordinator: sampleRow?.coordinator || '',
          currDaysData: new Map(),
          currTotal: 0,
          prevTotal: 0
        });
      }
      let total = 0;
      daysMap.forEach(set => total += set.size);
      basesMap.get(base)!.prevTotal = total;
    });

    // Construir resultado final
    const result: BaseMetricsATs[] = [];

    basesMap.forEach((data, base) => {
      // Métricas de Carregamento (Baseado APENAS no Período Atual para Cap/Máx, ou deveria considerar histórico?)
      // Carr Méd/Máx geralmente referem-se à operação atual.
      const dailyCounts: number[] = [];
      data.currDaysData.forEach(set => dailyCounts.push(set.size));

      const numDaysOperated = dailyCounts.length;
      const totalRoutesPeriod = dailyCounts.reduce((a, b) => a + b, 0);

      const carrMed = numDaysOperated > 0 ? Math.round(totalRoutesPeriod / numDaysOperated) : 0;
      const carrMax = numDaysOperated > 0 ? Math.max(...dailyCounts) : 0;

      result.push({
        base,
        locality: data.locality,
        leader: data.leader,
        coordinator: data.coordinator,
        qlp: 0,
        carrMed,
        carrMax,
        prevTotal: data.prevTotal,
        currTotal: data.currTotal,
        trend: data.currTotal >= data.prevTotal ? 'up' : 'down'
      });
    });

    return result.sort((a, b) => a.base.localeCompare(b.base));
  }, [currentPeriodData, previousPeriodData, allData]); // allData para garantir reatividade total

  // Calcular totais gerais
  const totals = useMemo(() => {
    if (baseMetrics.length === 0) return null;

    const totalPrev = baseMetrics.reduce((sum, item) => sum + item.prevTotal, 0);
    const totalCurr = baseMetrics.reduce((sum, item) => sum + item.currTotal, 0);
    const totalCarrMed = Math.round(baseMetrics.reduce((acc, b) => acc + b.carrMed, 0) / baseMetrics.length); // Média das médias
    const totalCarrMax = Math.max(...baseMetrics.map(b => b.carrMax)); // Máximo absoluto

    return {
      carrMed: totalCarrMed,
      carrMax: totalCarrMax,
      prev: totalPrev,
      curr: totalCurr
    };
  }, [baseMetrics]);


  const formatNum = (val: number) => val.toLocaleString('pt-BR');

  const calcVarPercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const periodLabels = useMemo(() => {
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };
    return {
      curr: `${formatDate(startDate)} a ${formatDate(endDate)}`,
      prev: `${formatDate(getPreviousPeriod.start)} a ${formatDate(getPreviousPeriod.end)}`
    };
  }, [startDate, endDate, getPreviousPeriod]);

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
                  <th className="px-6 py-5 border-r border-white/10 text-center">Ant. (ATs)</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Atual (ATs)</th>
                  <th className="px-6 py-5 text-center bg-black min-w-[120px]">Var %</th>
                  <th className="px-6 py-5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-medium text-slate-700">
                {baseMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">Nenhum dado encontrado para o período selecionado</td>
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
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">-</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMed || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMax || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-slate-400">
                            {formatNum(row.prevTotal)}
                          </td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-slate-800">
                            {formatNum(row.currTotal)}
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
                        <td className="px-6 py-5 text-center border-r border-slate-100">-</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMed || '-'}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMax || '-'}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100 text-slate-400">{formatNum(totals.prev)}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100 text-deluna-primary">{formatNum(totals.curr)}</td>
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
