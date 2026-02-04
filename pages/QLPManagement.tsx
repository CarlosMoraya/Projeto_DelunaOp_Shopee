
import React, { useState, useEffect, useMemo } from 'react';
import { QLPData } from '../types';
import { fetchQLPData } from '../services/api';

const QLPManagement: React.FC = () => {
  const [allData, setAllData] = useState<QLPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterCnh, setFilterCnh] = useState<string>('');
  const [filterMotorista, setFilterMotorista] = useState<string>('');
  const [filterGr, setFilterGr] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      if (force) localStorage.removeItem('qlp_data_cache_v1');
      const res = await fetchQLPData();
      if (res.length === 0) {
        console.warn("fetchQLPData retornou 0 registros");
      }
      setAllData(res);
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
      const matchCnh = !filterCnh || row.situacaoCnh.toUpperCase() === filterCnh.toUpperCase();
      const matchMotorista = !filterMotorista || row.situacaoMotorista.toUpperCase() === filterMotorista.toUpperCase();
      const matchGr = !filterGr || row.situacaoGrPlaca.toUpperCase() === filterGr.toUpperCase();
      const matchSearch = !searchTerm ||
        row.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.base.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCnh && matchMotorista && matchGr && matchSearch;
    });
  }, [allData, filterCnh, filterMotorista, filterGr, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredData.length;

    const isApto = (status: string) => {
      const s = status.toUpperCase().trim();
      return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
    };

    const totalApto = filteredData.filter(r =>
      isApto(r.situacaoCnh) &&
      isApto(r.situacaoMotorista) &&
      isApto(r.situacaoGrPlaca)
    ).length;

    return {
      total,
      aptos: totalApto,
      inaptos: total - totalApto
    };
  }, [filteredData]);

  // Opções únicas para os selects (ordenadas e filtradas)
  const getOptions = (key: keyof QLPData) => {
    return [...new Set(allData.map(r => String(r[key]).trim()))]
      .filter(val => val && val !== 'undefined')
      .sort();
  };

  const cnhOptions = useMemo(() => getOptions('situacaoCnh'), [allData]);
  const motoristaOptions = useMemo(() => getOptions('situacaoMotorista'), [allData]);
  const grOptions = useMemo(() => getOptions('situacaoGrPlaca'), [allData]);

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard
          title="Total Filtrado"
          value={stats.total.toLocaleString('pt-BR')}
          icon="groups"
          color="text-deluna-primary"
          bg="bg-slate-100"
        />
        <SummaryCard
          title="Aptos (Total)"
          value={stats.aptos.toLocaleString('pt-BR')}
          icon="verified"
          color="text-green-600"
          bg="bg-green-50"
          sub="Apto em todos os critérios"
        />
        <SummaryCard
          title="Inaptos / Pendentes"
          value={stats.inaptos.toLocaleString('pt-BR')}
          icon="dangerous"
          color="text-red-600"
          bg="bg-red-50"
          sub="Possui pelo menos um critério inativo"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-black uppercase text-slate-400">Buscar (Nome, Placa, Hub)</label>
          <input
            type="text"
            placeholder="Ex: Carlos, ABC1D23..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-black uppercase text-slate-400">Situação CNH</label>
          <select
            value={filterCnh}
            onChange={(e) => setFilterCnh(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none"
          >
            <option value="">TODOS</option>
            {cnhOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-black uppercase text-slate-400">Situação Motorista</label>
          <select
            value={filterMotorista}
            onChange={(e) => setFilterMotorista(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none"
          >
            <option value="">TODOS</option>
            {motoristaOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-black uppercase text-slate-400">Situação GR</label>
          <select
            value={filterGr}
            onChange={(e) => setFilterGr(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none"
          >
            <option value="">TODOS</option>
            {grOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setFilterCnh(''); setFilterMotorista(''); setFilterGr(''); setSearchTerm(''); }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-all"
        >
          LIMPAR
        </button>
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
                  <th className="px-6 py-5 border-r border-white/10">BASE</th>
                  <th className="px-6 py-5 border-r border-white/10">PLACA</th>
                  <th className="px-6 py-5 border-r border-white/10">NOME DO MOTORISTA</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">TIPO</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">SITUAÇÃO CNH</th>
                  <th className="px-6 py-5 border-r border-white/10 text-center">SITUAÇÃO MOT.</th>
                  <th className="px-6 py-5 text-center">SITUAÇÃO GR</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-medium text-slate-700">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, i) => (
                    <tr key={`${row.placa}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                      <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100 uppercase">{row.base}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 border-r border-slate-100">{row.placa}</td>
                      <td className="px-6 py-4 font-semibold border-r border-slate-100 uppercase">{row.nome}</td>
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
