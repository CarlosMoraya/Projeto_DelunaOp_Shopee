
import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, LabelList, PieChart, Pie
} from 'recharts';
import { fetchMonitoramentoData } from '../services/api';
import { MonitoramentoData } from '../types';

const ITEMS_PER_PAGE = 20;

const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC'];

const Monitoramento: React.FC = () => {
    const [tableData, setTableData] = useState<MonitoramentoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHub, setSelectedHub] = useState<string | null>(null);
    const [selectedCoordinator, setSelectedCoordinator] = useState<string | null>(null);
    const [driverSearch, setDriverSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchMonitoramentoData();
                setTableData(data);
                setError(null);
            } catch (err) {
                setError('Erro ao carregar dados de monitoramento.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredData = useMemo(() => {
        return tableData.filter(row => {
            const matchHub = !selectedHub || row.driverStation === selectedHub;
            const matchCoord = !selectedCoordinator || row.coordinator === selectedCoordinator;
            const matchDriver = !driverSearch || row.driverName.toLowerCase().includes(driverSearch.toLowerCase());

            // Filtro por Status (Pie Chart)
            const progress = parseFloat(row.deliveryProgress.replace('%', ''));
            const isCompleted = !isNaN(progress) && progress >= 100;
            const matchStatus = statusFilter === 'all' ||
                (statusFilter === 'completed' && isCompleted) ||
                (statusFilter === 'pending' && !isCompleted);

            return matchHub && matchCoord && matchDriver && matchStatus;
        });
    }, [tableData, selectedHub, selectedCoordinator, driverSearch, statusFilter]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedHub, selectedCoordinator, driverSearch]);

    const totals = useMemo(() => {
        const assigned = filteredData.reduce((acc, row) => acc + row.assigned, 0);
        const delivered = filteredData.reduce((acc, row) => acc + row.deliveredCount, 0);
        const pending = Math.max(0, assigned - delivered);

        // Conta quantos motoristas possuem progresso menor que 100%
        const openRoutes = filteredData.filter(row => {
            const progress = parseFloat(row.deliveryProgress.replace('%', ''));
            return isNaN(progress) ? true : progress < 100;
        }).length;

        const successRate = assigned > 0 ? (delivered / assigned) * 100 : 0;

        return {
            assigned: assigned.toLocaleString('pt-BR'),
            pending: pending.toLocaleString('pt-BR'),
            openRoutes: openRoutes.toLocaleString('pt-BR'),
            successRate: successRate.toFixed(1) + '%',
            driversCount: filteredData.length
        };
    }, [filteredData]);

    const stationData = useMemo(() => {
        const map = new Map<string, { total: number, delivered: number, originalName: string }>();
        filteredData.forEach(row => {
            const displayName = row.baseId || row.driverStation;
            const current = map.get(displayName) || { total: 0, delivered: 0, originalName: row.driverStation };
            map.set(displayName, {
                total: current.total + row.assigned,
                delivered: current.delivered + row.deliveredCount,
                originalName: row.driverStation
            });
        });

        return Array.from(map.entries()).map(([name, stats]) => {
            const rate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
            return {
                name,
                originalName: stats.originalName,
                value: Math.round(rate * 10) / 10
            };
        }).sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value).slice(0, 10);
    }, [filteredData, sortOrder]);

    const progressData = useMemo(() => {
        const completed = tableData.filter(row => {
            const p = parseFloat(row.deliveryProgress.replace('%', ''));
            return !isNaN(p) && p >= 100;
        }).length;
        const total = tableData.length;
        const pending = Math.max(0, total - completed);

        return [
            { id: 'completed', name: 'Rotas Concluídas', value: completed, color: '#1B4332' },
            { id: 'pending', name: 'Rotas em Operação', value: pending, color: '#E2E8F0' }
        ];
    }, [tableData]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const clearFilters = () => {
        setSelectedHub(null);
        setSelectedCoordinator(null);
        setDriverSearch('');
        setStatusFilter('all');
    };

    return (
        <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-10">
            {/* Header / Titulo */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-black text-deluna-primary font-display uppercase tracking-tight">Monitoramento em Tempo Real</h1>
                <p className="text-sm md:text-base text-slate-500 font-medium">Acompanhamento granular da operação Shopee</p>
            </div>

            {/* Cards de Métricas */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <MetricCard label="Total Atribuído" value={totals.assigned} icon="assignment" bgClass="bg-blue-50" colorClass="text-blue-600" />
                <MetricCard label="Pendentes" value={totals.pending} icon="pending_actions" bgClass="bg-orange-50" colorClass="text-orange-600" />
                <MetricCard label="Rotas em Aberto" value={totals.openRoutes} icon="local_shipping" bgClass="bg-yellow-50" colorClass="text-yellow-600" />
                <MetricCard label="Taxa de Sucesso" value={totals.successRate} icon="trending_up" bgClass="bg-deluna-primary/10" colorClass="text-deluna-primary" />
                <MetricCard label="Motoristas" value={totals.driversCount} icon="person" bgClass="bg-purple-50" colorClass="text-purple-600" />
            </section>

            {/* Gráficos */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-deluna-primary text-lg font-bold font-display">
                            {sortOrder === 'desc' ? 'Top 10' : 'Bottom 10'} Taxa de Entrega por Estação
                        </h3>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase hover:bg-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">
                                {sortOrder === 'desc' ? 'trending_down' : 'trending_up'}
                            </span>
                            {sortOrder === 'desc' ? 'Ver Piores' : 'Ver Melhores'}
                        </button>
                    </div>
                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stationData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis hide domain={[0, 110]} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                    onClick={(data) => setSelectedHub(selectedHub === data.originalName ? null : data.originalName)}
                                    className="cursor-pointer focus:outline-none"
                                >
                                    {stationData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.originalName === selectedHub ? '#F59E0B' : COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                    <LabelList dataKey="value" position="top" fill="#1B4332" fontSize={10} fontWeight={800} formatter={(val: number) => `${val}%`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <h3 className="text-deluna-primary text-lg font-bold mb-6 font-display self-start">Progresso das Rotas</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => setStatusFilter(statusFilter === data.id ? 'all' : data.id)}
                                    className="cursor-pointer focus:outline-none"
                                >
                                    {progressData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={statusFilter === entry.id ? '#F59E0B' : entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-6 mt-4">
                        {progressData.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setStatusFilter(statusFilter === item.id ? 'all' : item.id as any)}
                                className={`flex items-center gap-2 transition-opacity ${statusFilter !== 'all' && statusFilter !== item.id ? 'opacity-30' : 'opacity-100'}`}
                            >
                                <div className="size-3 rounded-full" style={{ backgroundColor: statusFilter === item.id ? '#F59E0B' : item.color }}></div>
                                <span className="text-xs font-bold text-slate-600">{item.name}: {item.value}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tabela */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-deluna-primary font-display">Detalhamento por Motorista</h3>
                        <p className="text-xs md:text-sm text-slate-500 font-medium">Performance individual atualizada</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        {/* Toggle Rotas em Aberto */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Apenas Em Aberto</span>
                            <button
                                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${statusFilter === 'pending' ? 'bg-deluna-primary' : 'bg-slate-300'}`}
                            >
                                <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${statusFilter === 'pending' ? 'translate-x-5' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Buscar motorista..."
                                value={driverSearch}
                                onChange={(e) => setDriverSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-deluna-primary outline-none focus:ring-2 focus:ring-deluna-primary/20 transition-all font-interface"
                            />
                        </div>
                        {(selectedHub || selectedCoordinator || driverSearch || statusFilter !== 'all') && (
                            <button onClick={clearFilters} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">filter_alt_off</span> Limpar
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando dados da operação...</div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500 font-bold">{error}</div>
                    ) : (
                        <table className="w-full text-left min-w-[1000px]">
                            <thead>
                                <tr className="bg-deluna-primary text-white text-[10px] uppercase font-black tracking-widest">
                                    <th className="px-6 py-4">Estação</th>
                                    <th className="px-6 py-4">Motorista</th>
                                    <th className="px-6 py-4 text-center">Atribuído</th>
                                    <th className="px-6 py-4 text-center">Progresso</th>
                                    <th className="px-6 py-4 text-center">Entregues (#)</th>
                                    <th className="px-6 py-4 text-center">Entregues (%)</th>
                                    <th className="px-6 py-4 text-center">On-hold</th>
                                    <th className="px-6 py-4">Hora Atrib.</th>
                                    <th className="px-6 py-4">Última Entrega</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-slate-400 font-bold italic">Nenhum motorista encontrado com os filtros aplicados.</td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedHub(selectedHub === row.driverStation ? null : row.driverStation)}
                                                    className={`group px-3 py-1 flex flex-col items-start rounded-lg transition-all ${selectedHub === row.driverStation ? 'bg-deluna-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{row.baseId || 'N/A'}</span>
                                                    <span className={`text-[8px] font-bold opacity-60 truncate max-w-[120px] ${selectedHub === row.driverStation ? 'text-white' : 'text-slate-400'}`}>{row.driverStation}</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-deluna-primary/10 flex items-center justify-center text-deluna-primary font-black text-[10px]">
                                                    {row.driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-deluna-primary font-interface">{row.driverName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-black text-slate-600">{row.assigned}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 w-24 mx-auto">
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-deluna-primary" style={{ width: row.deliveryProgress.includes('%') ? row.deliveryProgress : '0%' }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-center text-deluna-primary">{row.deliveryProgress}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-black text-deluna-primary">{row.deliveredCount}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black ${row.deliveredPercentage >= 95 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {row.deliveredPercentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{row.onHold}</td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-interface uppercase">{row.assignedTime}</td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 font-interface uppercase">{row.timeSinceLastDelivery}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Paginação */}
                {!loading && !error && filteredData.length > 0 && (
                    <div className="px-6 md:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 italic">
                            Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} motoristas
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="size-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-deluna-primary shadow-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="size-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: string; bgClass: string; colorClass: string; }> = ({ label, value, icon, bgClass, colorClass }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all group">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className={`size-10 rounded-xl ${bgClass} flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
        </div>
        <span className="text-4xl font-extrabold text-deluna-primary tracking-tighter">{value}</span>
    </div>
);

export default Monitoramento;
