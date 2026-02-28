
import React, { useState, useEffect, useMemo } from 'react';
import { QLPData } from '../types';
import { fetchQLPData, fetchDeliveryData } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const checkVehicleType = (tipoVeiculo: string | undefined, filter: string) => {
  if (!filter) return true;
  const t = (tipoVeiculo || '').toUpperCase().trim();
  if (filter === 'PASSEIO') return t.includes('PASSEIO');
  if (filter === 'UTILITÁRIO') return t.includes('UTILITARIO') || t.includes('UTILITÁRIO');
  if (filter === 'VAN') return t.includes('VAN');
  if (filter === 'VUC') return t.includes('VUC');
  if (filter === 'OUTROS') {
    return !t.includes('PASSEIO') && !t.includes('UTILITARIO') && !t.includes('UTILITÁRIO') && !t.includes('VAN') && !t.includes('VUC');
  }
  return t.includes(filter);
};

const QLPManagement: React.FC = () => {
  const [allData, setAllData] = useState<QLPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterSituacao, setFilterSituacao] = useState<string>('');
  const [filterCoordenador, setFilterCoordenador] = useState<string>('');
  const [filterTipoVeiculo, setFilterTipoVeiculo] = useState<string>(''); // Novo filtro
  const [filterBase, setFilterBase] = useState<string>(''); // Novo filtro
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: keyof QLPData | null, direction: 'asc' | 'desc' }>({
    key: 'nome',
    direction: 'asc'
  });

  const requestSort = (key: keyof QLPData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      if (force) {
        localStorage.removeItem('qlp_data_cache_v1');
        localStorage.removeItem('delivery_data_cache_v1');
      }

      // 1. Carrega QLP rapidamente e exibe a tabela
      const qlpData = await fetchQLPData();
      if (qlpData.length === 0) {
        console.warn("fetchQLPData retornou 0 registros");
      }
      setAllData(qlpData);
      setLoading(false);

      // 2. Carrega dados de rotas em background e faz o JOIN
      const deliveryData = await fetchDeliveryData();
      const lastTripMap = new Map<string, string>();
      deliveryData.forEach(d => {
        if (!lastTripMap.has(d.id)) {
          lastTripMap.set(d.id, d.date);
        }
      });

      setAllData(prev => prev.map(row => ({
        ...row,
        ultimaViagem: lastTripMap.get(row.nomeId || '') || row.ultimaViagem || ''
      })));

    } catch (err: any) {
      console.error('Erro ao carregar QLP:', err);
      setError(err.message || 'Erro desconhecido ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return allData.filter(row => {
      const isApto = (status: string) => {
        const s = (status || '').toUpperCase().trim();
        return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
      };

      const rowIsApto = isApto(row.situacaoCnh) && isApto(row.situacaoMotorista) && isApto(row.situacaoGrPlaca);
      const isAtivo = (row.statusQlp || '').toUpperCase().trim() === 'ATIVO';

      // Lógica de Inatividade > 7 dias
      const isSemAtividade7d = (() => {
        if (!row.ultimaViagem) return true; // Se nunca viajou, está sem atividade
        const lastDate = new Date(row.ultimaViagem + 'T12:00:00');
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7;
      })();

      let matchSituacao = true;
      if (filterSituacao === 'ATIVO_APTO') matchSituacao = isAtivo && rowIsApto;
      else if (filterSituacao === 'ATIVO_PENDENTE') matchSituacao = isAtivo && !rowIsApto;
      else if (filterSituacao === 'ATIVO_INATIVO_7D') matchSituacao = isAtivo && isSemAtividade7d;
      else if (filterSituacao === 'ATIVO_SEM_ATIVIDADE') matchSituacao = isAtivo && !row.ultimaViagem;
      else if (filterSituacao === 'INATIVO') matchSituacao = !isAtivo;

      const matchCoordenador = !filterCoordenador || row.coordenador.toUpperCase() === filterCoordenador.toUpperCase();

      // Novos matches para os gráficos
      const matchTipoVeiculo = checkVehicleType(row.tipoVeiculo, filterTipoVeiculo);
      const matchBase = !filterBase || (row.base || '').toUpperCase() === filterBase.toUpperCase();

      const matchSearch = !searchTerm ||
        row.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.base.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSituacao && matchCoordenador && matchTipoVeiculo && matchBase && matchSearch;
    });
  }, [allData, filterSituacao, filterCoordenador, filterTipoVeiculo, filterBase, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!] || '';
      const bValue = b[sortConfig.key!] || '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const stats = useMemo(() => {
    const ativos = filteredData.filter(r => (r.statusQlp || '').toUpperCase().trim() === 'ATIVO');
    const inativos = filteredData.filter(r => (r.statusQlp || '').toUpperCase().trim() === 'INATIVO').length;

    const isApto = (status: string) => {
      const s = (status || '').toUpperCase().trim();
      return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
    };

    const totalAptoAtivo = ativos.filter(r =>
      isApto(r.situacaoCnh) &&
      isApto(r.situacaoMotorista) &&
      isApto(r.situacaoGrPlaca)
    ).length;

    return {
      totalAtivos: ativos.length,
      totalInativos: inativos,
      aptosAtivos: totalAptoAtivo,
      inaptosAtivos: ativos.length - totalAptoAtivo
    };
  }, [filteredData]);

  // Dados do Gráfico de Veículos
  const vehicleChartData = useMemo(() => {
    // Para o gráfico de veículos, queremos ver a distribuição do que já está filtrado (exceto pelo próprio filtro de veículo para não zerar as outras fatias se uma for selecionada, ou talvez manter consistente)
    // Decisão: Usar os dados filtrados pelos OUTROS filtros para calcular os totais do gráfico.
    const dataForVehicleChart = allData.filter(row => {
      const isApto = (status: string) => {
        const s = (status || '').toUpperCase().trim();
        return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
      };
      const rowIsApto = isApto(row.situacaoCnh) && isApto(row.situacaoMotorista) && isApto(row.situacaoGrPlaca);
      const isAtivo = (row.statusQlp || '').toUpperCase().trim() === 'ATIVO';

      const isSemAtividade7d = (() => {
        if (!row.ultimaViagem) return true;
        const lastDate = new Date(row.ultimaViagem + 'T12:00:00');
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7;
      })();

      let matchSituacao = true;
      if (filterSituacao === 'ATIVO_APTO') matchSituacao = isAtivo && rowIsApto;
      else if (filterSituacao === 'ATIVO_PENDENTE') matchSituacao = isAtivo && !rowIsApto;
      else if (filterSituacao === 'ATIVO_INATIVO_7D') matchSituacao = isAtivo && isSemAtividade7d;
      else if (filterSituacao === 'ATIVO_SEM_ATIVIDADE') matchSituacao = isAtivo && !row.ultimaViagem;
      else if (filterSituacao === 'INATIVO') matchSituacao = !isAtivo;

      const matchCoordenador = !filterCoordenador || row.coordenador.toUpperCase() === filterCoordenador.toUpperCase();
      const matchBase = !filterBase || (row.base || '').toUpperCase() === filterBase.toUpperCase();
      const matchSearch = !searchTerm ||
        row.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.base.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSituacao && matchCoordenador && matchBase && matchSearch;
    });

    let passeio = 0;
    let utilitario = 0;
    let van = 0;
    let vuc = 0;
    let outros = 0;

    dataForVehicleChart.forEach(row => {
      const type = (row.tipoVeiculo || '').toUpperCase().trim();
      if (type.includes('PASSEIO')) passeio++;
      else if (type.includes('UTILITARIO') || type.includes('UTILITÁRIO')) utilitario++;
      else if (type.includes('VAN')) van++;
      else if (type.includes('VUC')) vuc++;
      else outros++;
    });

    return [
      { name: 'Passeio', value: passeio, color: '#3b82f6' },
      { name: 'Utilitário', value: utilitario, color: '#10b981' },
      { name: 'Van', value: van, color: '#f59e0b' },
      { name: 'VUC', value: vuc, color: '#8b5cf6' },
      { name: 'Outros', value: outros, color: '#94a3b8' },
    ].filter(item => item.value > 0);
  }, [allData, filterSituacao, filterCoordenador, filterBase, searchTerm]);

  // Dados do Gráfico de Veículos por Base
  const baseChartData = useMemo(() => {
    // Para o gráfico de bases, usamos dados filtrados pelos outros filtros
    const dataForBaseChart = allData.filter(row => {
      const isApto = (status: string) => {
        const s = (status || '').toUpperCase().trim();
        return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
      };
      const rowIsApto = isApto(row.situacaoCnh) && isApto(row.situacaoMotorista) && isApto(row.situacaoGrPlaca);
      const isAtivo = (row.statusQlp || '').toUpperCase().trim() === 'ATIVO';

      const isSemAtividade7d = (() => {
        if (!row.ultimaViagem) return true;
        const lastDate = new Date(row.ultimaViagem + 'T12:00:00');
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7;
      })();

      let matchSituacao = true;
      if (filterSituacao === 'ATIVO_APTO') matchSituacao = isAtivo && rowIsApto;
      else if (filterSituacao === 'ATIVO_PENDENTE') matchSituacao = isAtivo && !rowIsApto;
      else if (filterSituacao === 'ATIVO_INATIVO_7D') matchSituacao = isAtivo && isSemAtividade7d;
      else if (filterSituacao === 'ATIVO_SEM_ATIVIDADE') matchSituacao = isAtivo && !row.ultimaViagem;
      else if (filterSituacao === 'INATIVO') matchSituacao = !isAtivo;

      const matchCoordenador = !filterCoordenador || row.coordenador.toUpperCase() === filterCoordenador.toUpperCase();
      const matchTipoVeiculo = checkVehicleType(row.tipoVeiculo, filterTipoVeiculo);
      const matchSearch = !searchTerm ||
        row.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.base.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSituacao && matchCoordenador && matchTipoVeiculo && matchSearch;
    });

    const baseCounts = new Map<string, number>();

    dataForBaseChart.forEach(row => {
      const base = (row.base || 'SEM BASE').toUpperCase().trim();
      baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
    });

    return Array.from(baseCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allData, filterSituacao, filterCoordenador, filterTipoVeiculo, searchTerm]);

  // Opções únicas para os selects (ordenadas e filtradas)
  const getOptions = (key: keyof QLPData) => {
    return [...new Set(allData.map(r => String(r[key]).trim()))]
      .filter(val => val && val !== 'undefined')
      .sort();
  };

  const cnhOptions = useMemo(() => getOptions('situacaoCnh'), [allData]);
  const motoristaOptions = useMemo(() => getOptions('situacaoMotorista'), [allData]);
  const grOptions = useMemo(() => getOptions('situacaoGrPlaca'), [allData]);
  const coordenadorOptions = useMemo(() => getOptions('coordenador'), [allData]);

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('APTO') && !s.includes('INAPTO')) return 'text-green-600 bg-green-50 border-green-100';
    if (s.includes('INAPTO')) return 'text-red-600 bg-red-50 border-red-100';
    if (s.includes('PENDENTE')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 font-inter bg-[#F8FAFC] min-h-screen">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-3xl font-black text-deluna-primary uppercase tracking-tighter flex items-center gap-4">
            Gestão de QLP - Shopee
            <button
              onClick={() => loadData(true)}
              className="bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              title="Atualizar Dados"
            >
              <span className={`material-symbols-outlined text-sm text-slate-400 ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Monitoramento de conformidade de CNH, Motorista e Gerenciamento de Risco.
          </p>
        </div>
      </div>

      {/* Visões Gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <SummaryCard
          title="Total Ativos"
          value={stats.totalAtivos.toLocaleString('pt-BR')}
          icon="groups"
          color="text-deluna-primary"
          bg="bg-slate-100"
          sub="Motoristas com status Ativo"
        />
        <SummaryCard
          title="Total Inativos"
          value={stats.totalInativos.toLocaleString('pt-BR')}
          icon="person_off"
          color="text-slate-500"
          bg="bg-slate-50"
          sub="Motoristas com status Inativo"
        />
        <SummaryCard
          title="Aptos (Ativos)"
          value={stats.aptosAtivos.toLocaleString('pt-BR')}
          icon="verified"
          color="text-green-600"
          bg="bg-green-50"
          sub="Ativos sem pendências"
        />
        <SummaryCard
          title="Inaptos / Pendentes"
          value={stats.inaptosAtivos.toLocaleString('pt-BR')}
          icon="dangerous"
          color="text-red-600"
          bg="bg-red-50"
          sub="Ativos com alguma pendência"
        />
      </div>

      {/* Gráficos e Filtros */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">

        {/* Gráfico de Distribuição de Veículos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 xl:w-1/3 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-deluna-primary">local_shipping</span>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Tipos de Veículos</h2>
          </div>
          <div className="flex-1 min-h-[250px] relative [&_*:focus]:outline-none">
            {vehicleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{ outline: 'none' }}>
                  <Pie
                    data={vehicleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => {
                      if (data && data.name) {
                        setFilterTipoVeiculo(prev => prev === data.name.toUpperCase() ? '' : data.name.toUpperCase());
                      }
                    }}
                    cursor="pointer"
                  >
                    {vehicleChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={filterTipoVeiculo === entry.name.toUpperCase() ? '#1B4332' : 'none'}
                        strokeWidth={2}
                        opacity={!filterTipoVeiculo || filterTipoVeiculo === entry.name.toUpperCase() ? 1 : 0.3}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Veículos']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    onClick={(data: any) => {
                      setFilterTipoVeiculo(prev => prev === data.value.toUpperCase() ? '' : data.value.toUpperCase());
                    }}
                    formatter={(value, entry: any) => (
                      <span className={`text-[10px] font-bold cursor-pointer ${filterTipoVeiculo === value.toUpperCase() ? 'text-deluna-primary underline' : 'text-slate-600'}`}>
                        {value} ({entry.payload.value})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sem dados de<br />veículos</p>
              </div>
            )}
          </div>
        </div>

        {/* Painel Central (Barra de Filtros e Gráfico de Bases) (Agora ocupa espaço restante) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-deluna-primary">storefront</span>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Total de Veículos por Base e Filtros da Tabela</h2>
          </div>

          <div className="flex-1 w-full min-h-[160px] mb-2 [&_*:focus]:outline-none">
            {baseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={baseChartData}
                  style={{ outline: 'none' }}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  barSize={30}
                  onClick={(data) => {
                    if (data && data.activeLabel) {
                      setFilterBase(prev => prev === data.activeLabel ? '' : data.activeLabel);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={(props: any) => (
                      <text
                        x={props.x}
                        y={props.y}
                        dy={10}
                        fontSize={10}
                        fill={filterBase === props.payload.value ? '#1B4332' : '#64748b'}
                        fontWeight="bold"
                        textAnchor="middle"
                        className="cursor-pointer"
                        onClick={() => setFilterBase(prev => prev === props.payload.value ? '' : props.payload.value)}
                      >
                        {props.payload.value}
                      </text>
                    )}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value: number) => [value, 'Veículos']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  >
                    {baseChartData.map((entry, index) => (
                      <Cell
                        key={`cell-bar-${index}`}
                        fill={filterBase === entry.name ? '#1B4332' : '#0f766e'}
                        opacity={!filterBase || filterBase === entry.name ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sem dados de<br />bases</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 items-end bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div className="flex flex-col gap-1 flex-[1.5] min-w-[200px]">
              <label className="text-[10px] font-black uppercase text-slate-400">Buscar (Nome, Placa, Hub)</label>
              <input
                type="text"
                placeholder="Ex: Carlos, ABC1D23..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1 flex-[2] min-w-[240px]">
              <label className="text-[10px] font-black uppercase text-slate-400">Situação / Conformidade</label>
              <select
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none w-full"
              >
                <option value="">TODOS (ATIVOS + INATIVOS)</option>
                <option value="ATIVO_APTO">ATIVOS - APTOS</option>
                <option value="ATIVO_PENDENTE">ATIVOS - COM PENDÊNCIA</option>
                <option value="ATIVO_INATIVO_7D">ATIVOS - SEM ATIVIDADE (&gt; 7 DIAS)</option>
                <option value="ATIVO_SEM_ATIVIDADE">SEM NENHUMA ATIVIDADE</option>
                <option value="INATIVO">INATIVOS</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-[10px] font-black uppercase text-slate-400">Coordenador</label>
              <select
                value={filterCoordenador}
                onChange={(e) => setFilterCoordenador(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none w-full"
              >
                <option value="">TODOS</option>
                {coordenadorOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
              </select>
            </div>

            <button
              onClick={() => {
                setFilterSituacao('');
                setFilterCoordenador('');
                setFilterTipoVeiculo('');
                setFilterBase('');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-all h-[38px]"
            >
              LIMPAR
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-deluna-primary/20 border-t-deluna-primary rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sincronizando com a Planilha QLP...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
            <p className="font-black text-red-500 uppercase tracking-widest text-xs">Erro na Conexão</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <button onClick={() => loadData(true)} className="mt-4 px-6 py-2 bg-deluna-primary text-white rounded-lg text-xs font-bold">Tentar Novamente</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-deluna-primary text-white text-[10px] font-black uppercase tracking-[0.15em]">
                  {[
                    { key: 'base', label: 'BASE' },
                    { key: 'coordenador', label: 'COORDENADOR' },
                    { key: 'placa', label: 'PLACA' },
                    { key: 'nome', label: 'NOME DO MOTORISTA' },
                    { key: 'ultimaViagem', label: 'ÚLTIMA VIAGEM', center: true },
                    { key: 'tipoVeiculo', label: 'TIPO', center: true },
                    { key: 'situacaoCnh', label: 'SITUAÇÃO CNH', center: true },
                    { key: 'situacaoMotorista', label: 'SITUAÇÃO MOT.', center: true },
                    { key: 'situacaoGrPlaca', label: 'SITUAÇÃO GR', center: true },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => requestSort(col.key as keyof QLPData)}
                      className={`px-6 py-5 bg-deluna-primary text-white border-r border-white/10 cursor-pointer hover:brightness-110 transition-all uppercase font-black text-[10px] tracking-[0.15em] ${col.center ? 'text-center' : ''}`}
                    >
                      <div className={`flex items-center gap-2 ${col.center ? 'justify-center' : ''}`}>
                        <span>{col.label}</span>
                        {sortConfig.key === col.key && (
                          <span className="text-[12px] opacity-100">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortConfig.key !== col.key && (
                          <span className="opacity-20 text-[12px]">↕</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] font-medium text-slate-700">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, i) => (
                    <tr key={`${row.placa}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                      <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100 uppercase">{row.base}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 border-r border-slate-100 uppercase text-[10px]">{row.coordenador}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 border-r border-slate-100">{row.placa}</td>
                      <td className="px-6 py-4 font-semibold border-r border-slate-100 uppercase">{row.nome}</td>
                      <td className="px-6 py-4 text-center border-r border-slate-100 font-mono font-bold text-slate-500">
                        {row.ultimaViagem ? new Date(row.ultimaViagem + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100 italic font-bold text-slate-500">{row.tipoVeiculo}</td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                        <span className={`px-3 py-1 rounded-md border font-black uppercase text-[9px] ${getStatusColor(row.situacaoCnh)}`}>
                          {row.situacaoCnh}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                        <span className={`px-3 py-1 rounded-md border font-black uppercase text-[9px] ${getStatusColor(row.situacaoMotorista)}`}>
                          {row.situacaoMotorista}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-md border font-black uppercase text-[9px] ${getStatusColor(row.situacaoGrPlaca)}`}>
                          {row.situacaoGrPlaca}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: string; color: string; bg: string; sub?: string }> =
  ({ title, value, icon, color, bg, sub }) => (
    <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-deluna-primary transition-all">
      <div className="flex flex-col gap-1">
        <p className="text-slate-400 text-[9px] md:text-[11px] font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl md:text-4xl font-black ${color} tracking-tighter`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-400 font-bold italic hidden md:block">{sub}</p>}
      </div>
      <div className={`${bg} p-3 md:p-4 rounded-xl md:rounded-2xl`}>
        <span className={`material-symbols-outlined text-2xl md:text-3xl ${color}`}>{icon}</span>
      </div>
    </div>
  );

export default QLPManagement;
