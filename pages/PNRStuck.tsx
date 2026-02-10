import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LabelList
} from 'recharts';
import { fetchDeliveryData, fetchPNRData } from '../services/api';
import { DeliveryData, PNROperationalDetail, PNRRow } from '../types';

const ITEMS_PER_PAGE = 20;

const PNRStuck: React.FC<{ startDate: string; endDate: string }> = ({ startDate, endDate }) => {
    const [tableData, setTableData] = useState<DeliveryData[]>([]);
    const [pnrData, setPnrData] = useState<PNRRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHub, setSelectedHub] = useState<string | null>(null);
    const [driverSearch, setDriverSearch] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [delivery, pnr] = await Promise.all([
                    fetchDeliveryData(),
                    fetchPNRData()
                ]);
                setTableData(delivery);
                setPnrData(pnr);
                setError(null);
            } catch (err) {
                setError('Erro ao carregar dados para PNR & Stuck.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate, selectedHub, driverSearch]);

    const filteredPnr = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
        const hubNorm = selectedHub?.trim().toUpperCase();

        return pnrData.filter(row => {
            if (!row.date) return false;
            const rowDate = new Date(row.date + 'T00:00:00').getTime();
            const matchDate = rowDate >= start && rowDate <= end;
            const matchHub = !hubNorm || row.base.trim().toUpperCase() === hubNorm;
            return matchDate && matchHub;
        });
    }, [pnrData, startDate, endDate, selectedHub]);

    const filteredDelivery = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
        const hubNorm = selectedHub?.trim().toUpperCase();

        return tableData.filter(row => {
            if (!row.date) return false;
            const rowDate = new Date(row.date + 'T00:00:00').getTime();
            const matchDate = rowDate >= start && rowDate <= end;
            const matchHub = !hubNorm || row.hub.trim().toUpperCase() === hubNorm;
            return matchDate && matchHub;
        });
    }, [tableData, startDate, endDate, selectedHub]);

    const stats = useMemo(() => {
        const totalPending = filteredDelivery.reduce((acc, row) => acc + row.pending, 0);
        const totalShipments = filteredDelivery.reduce((acc, row) => acc + row.atQuantity, 0);
        const totalFailures = filteredPnr.length;
        const totalReverted = filteredPnr.filter(row => row.statusShopee.toUpperCase() === 'REVERTIDO').length;

        const pnrRate = totalShipments > 0 ? (totalFailures / totalShipments) * 100 : 0;

        return {
            totalPending,
            totalShipments,
            totalFailures,
            totalReverted,
            pnrRate
        };
    }, [filteredDelivery, filteredPnr]);

    const hubData = useMemo(() => {
        const map = new Map<string, { pending: number, failures: number }>();

        filteredDelivery.forEach(row => {
            const h = row.hub.trim().toUpperCase();
            const current = map.get(h) || { pending: 0, failures: 0 };
            map.set(h, {
                pending: current.pending + row.pending,
                failures: current.failures
            });
        });

        filteredPnr.forEach(row => {
            const b = row.base.trim().toUpperCase();
            const current = map.get(b) || { pending: 0, failures: 0 };
            map.set(b, {
                pending: current.pending,
                failures: current.failures + 1
            });
        });

        return Array.from(map.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.pending - a.pending)
            .slice(0, 10);
    }, [filteredDelivery, filteredPnr]);

    const operationalDetails = useMemo(() => {
        // Agrupar PNRs por Motorista e Base (Normalizado para Join)
        const pnrGroups = new Map<string, { count: number, originalDriver: string, originalBase: string }>();
        filteredPnr.forEach(row => {
            const driverNorm = row.driver.trim().toUpperCase();
            const baseNorm = row.base.trim().toUpperCase();
            const key = `${driverNorm}|${baseNorm}`;

            const current = pnrGroups.get(key) || { count: 0, originalDriver: row.driver, originalBase: row.base };
            pnrGroups.set(key, {
                ...current,
                count: current.count + 1
            });
        });

        // Agrupar Entregas por Motorista e Base
        const deliveryGroups = new Map<string, number>();
        filteredDelivery.forEach(row => {
            const driverNorm = row.driver.trim().toUpperCase();
            const baseNorm = row.hub.trim().toUpperCase();
            const key = `${driverNorm}|${baseNorm}`;
            deliveryGroups.set(key, (deliveryGroups.get(key) || 0) + row.atQuantity);
        });

        // Combinar os dados de forma única por Motorista e Base
        const allKeys = new Set([...pnrGroups.keys(), ...deliveryGroups.keys()]);

        const details: PNROperationalDetail[] = Array.from(allKeys).map(key => {
            const [driverNorm, baseNorm] = key.split('|');

            const pnrEntry = pnrGroups.get(key);
            const pnrCount = pnrEntry?.count || 0;
            const totalPackets = deliveryGroups.get(key) || 0;
            const pnrPercentage = totalPackets > 0 ? (pnrCount / totalPackets) * 100 : 0;

            // Para exibição, preferimos o nome original
            const displayDriver = pnrEntry?.originalDriver || driverNorm;
            const displayBase = pnrEntry?.originalBase || baseNorm;

            return {
                driver: displayDriver,
                base: displayBase,
                pnrCount,
                totalPackets,
                pnrPercentage
            };
        });

        // Aplicar busca por motorista
        const searchFiltered = driverSearch
            ? details.filter(d => d.driver.toLowerCase().includes(driverSearch.toLowerCase()))
            : details;

        return searchFiltered.sort((a, b) => b.pnrCount - a.pnrCount);
    }, [filteredPnr, filteredDelivery, driverSearch]);




    const paginatedTable = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return operationalDetails.slice(start, start + ITEMS_PER_PAGE);
    }, [operationalDetails, currentPage]);

    const totalPages = Math.ceil(operationalDetails.length / ITEMS_PER_PAGE);

    return (
        <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-deluna-primary text-3xl font-black uppercase tracking-tighter font-display">Gestão Logística</h2>
                    <p className="text-[#64748B] text-sm font-medium">Controle de PNR (Pedidos Não Recebidos) e Stuck (Pendências)</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                        <span className="text-xs font-bold text-deluna-primary">Pendências Críticas: {stats.totalPending}</span>
                    </div>
                </div>
            </header>

            {/* Metric Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    label="Total Pacotes"
                    value={stats.totalShipments.toLocaleString('pt-BR')}
                    icon="package_2"
                    gradient="from-blue-50 to-white"
                    borderColor="border-blue-100"
                    iconBg="bg-blue-500"
                />
                <MetricCard
                    label="Insucessos (PNR)"
                    value={stats.totalFailures.toLocaleString('pt-BR')}
                    icon="report_problem"
                    gradient="from-red-50 to-white"
                    borderColor="border-red-100"
                    iconBg="bg-red-500"
                />
                <MetricCard
                    label="Taxa PNR"
                    value={stats.pnrRate.toFixed(2) + '%'}
                    icon="emergency_home"
                    gradient="from-rose-50 to-white"
                    borderColor="border-rose-100"
                    iconBg="bg-rose-500"
                />
                <MetricCard
                    label="Revertidos"
                    value={stats.totalReverted.toLocaleString('pt-BR')}
                    icon="cached"
                    gradient="from-green-50 to-white"
                    borderColor="border-green-100"
                    iconBg="bg-green-500"
                />
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-deluna-primary text-base md:text-lg font-bold">Top 10 Hubs com Stuck</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendente vs Base</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hubData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#C5A059" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#C5A059" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="pending"
                                    fill="url(#barGradient)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                >
                                    <LabelList
                                        dataKey="pending"
                                        position="top"
                                        style={{ fontSize: '11px', fontWeight: '900', fill: '#1B4332' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-deluna-primary text-base md:text-lg font-bold">Concentração de Riscos</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendências vs Insucessos</span>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Stuck (Pendentes)', value: stats.totalPending },
                                        { name: 'PNR (Insucessos)', value: stats.totalFailures }
                                    ]}
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    <Cell fill="#C5A059" stroke="none" />
                                    <Cell fill="#BC4749" stroke="none" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Table Section */}
            <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-10">
                <div className="px-8 py-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-black text-deluna-primary uppercase tracking-tight">Detalhamento Operacional</h3>
                        <p className="text-xs font-medium text-[#64748B]">Granularidade por motorista e hub</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Buscar motorista..."
                                value={driverSearch}
                                onChange={(e) => setDriverSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-deluna-primary placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-deluna-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-deluna-primary hover:bg-[#F1F5F9] transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">filter_alt</span>
                                Filtros
                            </button>
                            <button className="px-4 py-2 bg-deluna-primary text-white rounded-xl text-xs font-bold hover:bg-deluna-primary-light transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-[#F8FAFC]">
                            <tr className="text-[#64748B] text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Motorista Responsável</th>
                                <th className="px-8 py-5">Base / Hub</th>
                                <th className="px-8 py-5 text-right">Pacotes (PNR)</th>
                                <th className="px-8 py-5 text-right">Total Pacotes</th>
                                <th className="px-8 py-5 text-right">PNR %</th>
                                <th className="px-8 py-5 text-center">Meta</th>
                                <th className="px-8 py-5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse">Carregando indicadores logísticos...</td></tr>
                            ) : paginatedTable.length === 0 ? (
                                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhum registro encontrado para o período.</td></tr>
                            ) : (
                                paginatedTable.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-deluna-primary text-white flex items-center justify-center text-[10px] font-black">
                                                    {row.driver.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-extrabold text-deluna-primary group-hover:translate-x-1 transition-transform">{row.driver}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-deluna-primary/5 text-deluna-primary rounded-full text-[11px] font-bold border border-deluna-primary/10">
                                                {row.base}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-right font-black text-red-600">
                                            {row.pnrCount}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-right font-black text-slate-400">
                                            {row.totalPackets}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${row.pnrPercentage > 1.00 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {row.pnrPercentage.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">
                                            1.00%
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {row.pnrPercentage <= 1.00 ? (
                                                <div className="flex items-center justify-center gap-1.5 text-green-600">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Alcançada</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5 text-red-600">
                                                    <span className="material-symbols-outlined text-base">error_outline</span>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Fora da Meta</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-5 bg-[#F8FAFC] border-t border-[#F1F5F9] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-bold text-[#64748B]">
                        Exibindo {Math.min(paginatedTable.length, ITEMS_PER_PAGE)} de {operationalDetails.length} registros operacionais
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black text-deluna-primary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                            Anterior
                        </button>
                        <div className="flex items-center px-4 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black text-deluna-primary">
                            {currentPage} / {totalPages || 1}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black text-deluna-primary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Próximo
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: string; icon: string; gradient: string; borderColor: string; iconBg: string; }> =
    ({ label, value, icon, gradient, borderColor, iconBg }) => (
        <div className={`bg-white p-6 rounded-2xl border ${borderColor} shadow-sm hover:shadow-md transition-all flex flex-col gap-4 bg-gradient-to-br ${gradient}`}>
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{label}</span>
                <div className={`${iconBg} text-white p-2 rounded-xl shadow-lg shadow-black/5`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
            </div>
            <div className="text-3xl font-black text-deluna-primary tracking-tighter">{value}</div>
        </div>
    );

export default PNRStuck;
