
import React, { useState, useEffect, useMemo } from 'react';
import { CapacityData } from '../types';
import { fetchCapacityData, fetchQLPData, clearApiCache } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CapacityManagementProps {
    startDate: string;
    endDate: string;
}

const CapacityManagement: React.FC<CapacityManagementProps> = ({ startDate, endDate }) => {
    const [allData, setAllData] = useState<CapacityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterCoordenador, setFilterCoordenador] = useState<string>('');
    const [filterBase, setFilterBase] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterVehicle, setFilterVehicle] = useState<string>('');

    // Ordenação
    const [sortConfig, setSortConfig] = useState<{ key: keyof CapacityData | null, direction: 'asc' | 'desc' }>({
        key: 'dateAdded',
        direction: 'desc'
    });

    const requestSort = (key: keyof CapacityData) => {
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
                clearApiCache();
            }

            // Fetch Candidatos and QLP in parallel
            const [capacityRes, qlpRes] = await Promise.all([
                fetchCapacityData(),
                fetchQLPData()
            ]);

            // Create Set of active CPFs from QLP
            const qlpCpfs = new Set<string>();
            qlpRes.forEach(item => {
                if (item.cpf) {
                    qlpCpfs.add(item.cpf);
                }
            });

            // Map capacity data and apply the status overwrite rule by checking CPF presence
            const mappedData = capacityRes.map(row => {
                if (row.cpf && qlpCpfs.has(row.cpf)) {
                    return { ...row, status: 'NOVO MOTORISTA' };
                } else {
                    return { ...row, status: 'PENDENTE' };
                }
            });

            setAllData(mappedData);
        } catch (err: any) {
            console.error('Erro ao carregar dados de capacidade:', err);
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
            const matchStatus = !filterStatus || (row.status || '').toUpperCase().trim() === filterStatus.toUpperCase();
            const matchCoordenador = !filterCoordenador || (row.coordinator || '').toUpperCase() === filterCoordenador.toUpperCase();
            const matchBase = !filterBase || (row.base || '').toUpperCase() === filterBase.toUpperCase();

            const matchSearch = !searchTerm ||
                row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.referral?.toLowerCase().includes(searchTerm.toLowerCase());

            // Date filtering
            let matchDate = true;
            if (row.dateAdded) {
                // dateAdded format is YYYY-MM-DD
                if (startDate && row.dateAdded < startDate) matchDate = false;
                if (endDate && row.dateAdded > endDate) matchDate = false;
            } else if (startDate || endDate) {
                // If the row doesn't have a date but we are filtering by date, exclude it
                matchDate = false;
            }

            const matchVehicle = !filterVehicle || (row.vehicleType || '').toUpperCase().trim() === filterVehicle.toUpperCase();

            return matchStatus && matchCoordenador && matchBase && matchSearch && matchDate && matchVehicle;
        });
    }, [allData, filterStatus, filterCoordenador, filterBase, searchTerm, startDate, endDate, filterVehicle]);

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
        const total = filteredData.length;
        const aprovados = filteredData.filter(r => (r.status || '').toUpperCase() === 'NOVO MOTORISTA').length;
        const pendentes = filteredData.filter(r => (r.status || '').toUpperCase() === 'PENDENTE').length;
        const reprovados = 0; // Not used anymore with the strict overlap, keeping for layout integrity but will hide/repurpose if needed
        const conversao = total > 0 ? ((aprovados / total) * 100).toFixed(1) : '0.0';

        return { total, aprovados, pendentes, reprovados, conversao };
    }, [filteredData]);

    // Dados do Gráfico de Veículos
    const vehicleChartData = useMemo(() => {
        const counts = new Map<string, number>();
        filteredData.forEach(row => {
            const v = (row.vehicleType || 'NÃO DEFINIDO').toUpperCase().trim();
            counts.set(v, (counts.get(v) || 0) + 1);
        });

        const COLORS = ['#0f766e', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea'];

        return Array.from(counts.entries())
            .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // Dados do Gráfico de Candidatos por Base
    const baseChartData = useMemo(() => {
        const baseCounts = new Map<string, number>();

        filteredData.forEach(row => {
            const base = (row.base || 'SEM BASE').toUpperCase().trim();
            baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
        });

        return Array.from(baseCounts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 bases
    }, [filteredData]);

    // Opções únicas para os selects
    const getOptions = (key: keyof CapacityData) => {
        return [...new Set(filteredData.map(r => String(r[key] || '').trim()))]
            .filter(val => val && val !== 'undefined')
            .sort();
    };

    const statusOptions = useMemo(() => getOptions('status'), [filteredData]);
    const baseOptions = useMemo(() => getOptions('base'), [filteredData]);
    const coordenadorOptions = useMemo(() => getOptions('coordinator'), [filteredData]);
    const vehicleOptions = useMemo(() => getOptions('vehicleType'), [filteredData]);

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        if (s === 'NOVO MOTORISTA') return 'text-green-600 bg-green-50 border-green-100';
        if (s === 'PENDENTE') return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-slate-500 bg-slate-50 border-slate-100';
    };

    return (
        <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 font-inter bg-[#F8FAFC] min-h-screen">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl md:text-3xl font-black text-deluna-primary uppercase tracking-tighter flex items-center gap-4">
                        Gestão de Capacidade
                        <button
                            onClick={() => loadData(true)}
                            className="bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                            title="Atualizar Dados"
                        >
                            <span className={`material-symbols-outlined text-sm text-slate-400 ${loading ? 'animate-spin' : ''}`}>sync</span>
                        </button>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">
                        Monitoramento de captação e triagem de novos motoristas (Hub & Frota).
                    </p>
                </div>
            </div>

            {/* Visão Geral */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <SummaryCard
                    title="Total Candidatos"
                    value={stats.total.toLocaleString('pt-BR')}
                    icon="group_add"
                    color="text-deluna-primary"
                    bg="bg-slate-100"
                    sub="Total filtrado na aba"
                />
                <SummaryCard
                    title="Novos Motoristas"
                    value={stats.aprovados.toLocaleString('pt-BR')}
                    icon="verified_user"
                    color="text-green-600"
                    bg="bg-green-50"
                    sub="Candidatos encontrados na QLP"
                    badge={`${stats.conversao}% conversão`}
                />
                <SummaryCard
                    title="Pendentes"
                    value={stats.pendentes.toLocaleString('pt-BR')}
                    icon="hourglass_empty"
                    color="text-amber-600"
                    bg="bg-amber-50"
                    sub="Aguardando validação ou doc"
                />
            </div>

            <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
                {/* Gráfico de Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 xl:w-1/3 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-deluna-primary">analytics</span>
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Distribuição por Veículo</h2>
                    </div>
                    <div className="flex-1 min-h-[300px] relative [&_*:focus]:outline-none">
                        {vehicleChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={vehicleChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        onClick={(data) => {
                                            if (data && data.name) {
                                                setFilterVehicle(prev => prev === data.name ? '' : data.name);
                                            }
                                        }}
                                        cursor="pointer"
                                    >
                                        {vehicleChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke={filterVehicle === entry.name ? '#1B4332' : 'none'}
                                                strokeWidth={2}
                                                opacity={!filterVehicle || filterVehicle === entry.name ? 1 : 0.3}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [value, 'Candidatos']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        onClick={(data: any) => {
                                            setFilterVehicle(prev => prev === data.value ? '' : data.value);
                                        }}
                                        formatter={(value, entry: any) => (
                                            <span className={`text-[10px] font-bold cursor-pointer ${filterVehicle === value ? 'text-deluna-primary underline' : 'text-slate-600'}`}>
                                                {value} ({entry.payload.value})
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sem dados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Candidatos por Base */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-deluna-primary">location_on</span>
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Top 10 Bases com mais Candidatos</h2>
                    </div>
                    <div className="flex-1 w-full min-h-[200px] mb-2 [&_*:focus]:outline-none">
                        {baseChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={baseChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                        angle={-15}
                                        textAnchor="end"
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar
                                        dataKey="value"
                                        fill="#0f766e"
                                        radius={[4, 4, 0, 0]}
                                        onClick={(data) => {
                                            if (data && data.name) setFilterBase(prev => prev === data.name ? '' : data.name);
                                        }}
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
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sem dados</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 items-end bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <div className="flex flex-col gap-1 flex-[1.5] min-w-[200px]">
                            <label className="text-[10px] font-black uppercase text-slate-400">Buscar (Candidato, Hub, Indicação)</label>
                            <input
                                type="text"
                                placeholder="Ex: Roberto, LRJ04..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none w-full"
                            >
                                <option value="">TODOS OS STATUS</option>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black uppercase text-slate-400">Hub / Base</label>
                            <select
                                value={filterBase}
                                onChange={(e) => setFilterBase(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none w-full"
                            >
                                <option value="">TODAS AS BASES</option>
                                {baseOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black uppercase text-slate-400">Coordenador</label>
                            <select
                                value={filterCoordenador}
                                onChange={(e) => setFilterCoordenador(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deluna-primary/20 outline-none w-full"
                            >
                                <option value="">TODOS OS COORDENADORES</option>
                                {coordenadorOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setFilterStatus('');
                                setFilterCoordenador('');
                                setFilterBase('');
                                setSearchTerm('');
                                setFilterVehicle('');
                            }}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-sm font-bold transition-all h-[38px]"
                        >
                            LIMPAR
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-deluna-primary/20 border-t-deluna-primary rounded-full animate-spin"></div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Carregando Candidatos...</p>
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
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-deluna-primary text-white text-[10px] font-black uppercase tracking-[0.15em]">
                                    {[
                                        { key: 'dateAdded', label: 'DATA CADASTRO' },
                                        { key: 'name', label: 'CANDIDATO' },
                                        { key: 'phone', label: 'CONTATO' },
                                        { key: 'base', label: 'BASE / HUB' },
                                        { key: 'vehicleType', label: 'VEÍCULO' },
                                        { key: 'coordinator', label: 'COORD.' },
                                        { key: 'status', label: 'STATUS', center: true },
                                    ].map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => requestSort(col.key as keyof CapacityData)}
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
                                        <td colSpan={7} className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">
                                            Nenhum candidato encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((row, i) => (
                                        <tr key={`${row.name}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400 border-r border-slate-100 text-[10px]">
                                                {row.dateAdded && row.dateAdded.includes('-')
                                                    ? row.dateAdded.split('-').reverse().join('/')
                                                    : row.dateAdded || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-black border-r border-slate-100 uppercase text-slate-900">{row.name}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-deluna-primary border-r border-slate-100">{row.phone}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-600 border-r border-slate-100 uppercase">{row.base}</td>
                                            <td className="px-6 py-4 italic font-bold text-slate-500 border-r border-slate-100">{row.vehicleType}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-500 border-r border-slate-100 uppercase text-[10px]">{row.coordinator || '-'}</td>
                                            <td className="px-6 py-4 text-center border-r border-slate-100">
                                                <span className={`px-3 py-1 rounded-md border font-black uppercase text-[9px] ${getStatusColor(row.status)}`}>
                                                    {row.status}
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

const SummaryCard: React.FC<{ title: string; value: string; icon: string; color: string; bg: string; sub?: string; badge?: string }> =
    ({ title, value, icon, color, bg, sub, badge }) => (
        <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-deluna-primary transition-all">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <p className="text-slate-400 text-[9px] md:text-[11px] font-black uppercase tracking-widest">{title}</p>
                    {badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${bg} ${color}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <p className={`text-2xl md:text-4xl font-black ${color} tracking-tighter`}>{value}</p>
                {sub && <p className="text-[10px] text-slate-400 font-bold italic hidden md:block">{sub}</p>}
            </div>
            <div className={`${bg} p-3 md:p-4 rounded-xl md:rounded-2xl`}>
                <span className={`material-symbols-outlined text-2xl md:text-3xl ${color}`}>{icon}</span>
            </div>
        </div>
    );

export default CapacityManagement;
