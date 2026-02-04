
import React, { useState, useEffect, useMemo } from 'react';
import { DeliveryData } from '../types';
import { fetchDeliveryData } from '../services/api';

interface ComparativoProps {
  startDate: string;
  endDate: string;
}

interface BaseMetrics {
  base: string;
  locality: string;
  leader: string;
  coordinator: string;
  qlp: number;
  carrMed: number;
  carrMax: number;
  prevRate: number;
  currRate: number;
  trend: 'up' | 'down';
}

const Comparativo: React.FC<ComparativoProps> = ({ startDate, endDate }) => {
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

  // Função para calcular o período anterior (mesmo range no mês anterior)
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

  // Filtrar dados por período
  const filterByPeriod = (data: DeliveryData[], start: string, end: string) => {
    return data.filter(row => {
      const rowDate = new Date(row.date).getTime();
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return rowDate >= startTime && rowDate <= endTime;
    });
  };

  // Lista de coordenadores únicos
  const coordinators = useMemo(() => {
    const unique = [...new Set(allData.map(d => d.coordinator))].filter(c => c && c !== 'S/C');
    return unique.sort();
  }, [allData]);

  // Dados do período atual e anterior
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

  // Agrupar dados por Base e calcular métricas
  const baseMetrics = useMemo(() => {
    const basesMap = new Map<string, {
      locality: string;
      leader: string;
      coordinator: string;
      currTotalAT: number;
      currTotalDelivered: number;
      currDaysData: Map<string, number>;
      prevTotalAT: number;
      prevTotalDelivered: number;
    }>();

    // Processar período atual
    currentPeriodData.forEach(row => {
      const base = row.hub;
      if (!basesMap.has(base)) {
        basesMap.set(base, {
          locality: row.locality || '',
          leader: row.leader || '',
          coordinator: row.coordinator || '',
          currTotalAT: 0,
          currTotalDelivered: 0,
          currDaysData: new Map(), // Agora armazena Set de ATs
          prevTotalAT: 0,
          prevTotalDelivered: 0
        });
      }
      const entry = basesMap.get(base)!;
      entry.currTotalAT += row.atQuantity;
      entry.currTotalDelivered += row.delivered;

      // Agrupar IDs de ATs por dia para contagem (assumindo que 1 AT = 1 código de AT único)
      // Se não houver código de AT, usamos um fallback para contagem básica
      const dayKey = row.date;
      const dayATs = entry.currDaysData.get(dayKey) as unknown as Set<string> || new Set<string>();

      if (row.atCode && row.atCode !== '') {
        dayATs.add(row.atCode);
      } else {
        // Se não tiver código de AT, assumimos que cada linha é uma AT distinta (fallback)
        // Usamos um ID único gerado ou o ID da linha se disponível
        dayATs.add(`row-${row.id}-${Math.random()}`);
      }

      // Armazenamos como 'any' temporariamente para compatibilidade com a estrutura, depois convertemos
      entry.currDaysData.set(dayKey, dayATs as any);
    });

    // Processar período anterior
    previousPeriodData.forEach(row => {
      const base = row.hub;
      if (basesMap.has(base)) {
        const entry = basesMap.get(base)!;
        entry.prevTotalAT += row.atQuantity;
        entry.prevTotalDelivered += row.delivered;
      }
    });

    // Calcular métricas finais
    const result: BaseMetrics[] = [];
    basesMap.forEach((data, base) => {
      // Converter os Sets para números (tamanho do set)
      const dailyCounts: number[] = [];
      data.currDaysData.forEach((value) => {
        const set = value as unknown as Set<string>;
        dailyCounts.push(set.size);
      });

      const numDaysOperated = dailyCounts.length;

      // CARR. MÉD = Soma de rotas únicas / dias operados
      const totalRoutesInPeriod = dailyCounts.reduce((sum, count) => sum + count, 0);
      const carrMed = numDaysOperated > 0 ? Math.round(totalRoutesInPeriod / numDaysOperated) : 0;

      // CARR. MÁX = Máximo de rotas em um único dia
      const carrMax = numDaysOperated > 0 ? Math.max(...dailyCounts) : 0;

      const currRate = data.currTotalAT > 0 ? (data.currTotalDelivered / data.currTotalAT) * 100 : 0;
      const prevRate = data.prevTotalAT > 0 ? (data.prevTotalDelivered / data.prevTotalAT) * 100 : 0;

      result.push({
        base,
        locality: data.locality,
        leader: data.leader,
        coordinator: data.coordinator,
        qlp: 0, // Pendente de outra fonte
        carrMed,
        carrMax,
        prevRate: Math.round(prevRate * 100) / 100,
        currRate: Math.round(currRate * 100) / 100,
        trend: currRate >= prevRate ? 'up' : 'down'
      });
    });

    return result.sort((a, b) => a.base.localeCompare(b.base));
  }, [currentPeriodData, previousPeriodData]);

  // Calcular totais gerais
  const totals = useMemo(() => {
    if (baseMetrics.length === 0) return null;

    // Agregar dados diários globais para calcular Média e Máximo reais do Total Geral
    const dailyGlobalMap = new Map<string, Set<string>>();
    currentPeriodData.forEach(row => {
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

    const avgPrevRate = baseMetrics.reduce((acc, b) => acc + b.prevRate, 0) / baseMetrics.length;
    const avgCurrRate = baseMetrics.reduce((acc, b) => acc + b.currRate, 0) / baseMetrics.length;

    return {
      carrMed: totalCarrMed,
      carrMax: totalCarrMax,
      prevRate: Math.round(avgPrevRate * 100) / 100,
      currRate: Math.round(avgCurrRate * 100) / 100
    };
  }, [baseMetrics, currentPeriodData]);

  // Formatar labels dos períodos
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
            Exibindo comparativo de <span className="text-deluna-primary font-bold">Período Anterior</span> vs <span className="text-deluna-primary font-bold">Período Atual</span>.
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
                  <th className="px-6 py-5 border-r border-white/10 text-center">Período Anterior</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">Período Atual</th>
                  <th className="px-6 py-5 text-center bg-black min-w-[130px]">Var %</th>
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
                      const variance = row.currRate - row.prevRate;
                      return (
                        <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                          <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100">{row.base}</td>
                          <td className="px-6 py-4 italic font-bold text-slate-500 border-r border-slate-100">{row.locality || '-'}</td>
                          <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.leader || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">-</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMed || '-'}</td>
                          <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.carrMax || '-'}</td>
                          <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.prevRate > 0 && row.prevRate < 98 ? 'text-red-500' : ''}`}>
                            {row.prevRate > 0 ? `${row.prevRate.toFixed(2).replace('.', ',')}%` : '-'}
                          </td>
                          <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.currRate < 98 ? 'text-red-500' : ''}`}>
                            {row.currRate > 0 ? `${row.currRate.toFixed(2).replace('.', ',')}%` : '-'}
                          </td>
                          <td className="px-6 py-4 text-center bg-slate-50/80 font-black">
                            <div className="flex items-center justify-center gap-2">
                              <span className={variance >= 0 ? 'text-slate-800' : 'text-red-600'}>
                                {variance.toFixed(2).replace('.', ',')}%
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
                    {totals && (
                      <tr className="bg-white border-t-2 border-slate-900 font-black text-deluna-primary text-[10px] md:text-[12px]">
                        <td colSpan={3} className="px-6 py-5 italic text-right border-r border-slate-100 uppercase tracking-widest">Total Geral</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">-</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMed || '-'}</td>
                        <td className="px-6 py-5 text-center border-r border-slate-100">{totals.carrMax || '-'}</td>
                        <td className={`px-6 py-5 text-center border-r border-slate-100 ${totals.prevRate < 98 ? 'text-red-500' : ''}`}>
                          {totals.prevRate.toFixed(2).replace('.', ',')}%
                        </td>
                        <td className={`px-6 py-5 text-center border-r border-slate-100 ${totals.currRate < 98 ? 'text-red-500' : ''}`}>
                          {totals.currRate.toFixed(2).replace('.', ',')}%
                        </td>
                        <td className="px-6 py-5 text-center bg-slate-100">
                          <div className="flex items-center justify-center gap-2">
                            <span className={(totals.currRate - totals.prevRate) >= 0 ? 'text-deluna-primary' : 'text-red-600'}>
                              {(totals.currRate - totals.prevRate).toFixed(2).replace('.', ',')}%
                            </span>
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

export default Comparativo;
