import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LabelList
} from 'recharts';
import { fetchDeliveryData, fetchPNRData, fetchBaseMetadata } from '../services/api';
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
    const [chartFilterCoord, setChartFilterCoord] = useState<string | null>(null);
    const [chartFilterHub, setChartFilterHub] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [delivery, pnr, baseInfo] = await Promise.all([
                    fetchDeliveryData(),
                    fetchPNRData(),
                    fetchBaseMetadata()
                ]);

                // Cross-reference to find Date based on assignmentTaskId
                const normalizeId = (id: string) => String(id || '').replace(/\s+/g, '').toUpperCase();

                const deliveryMap = new Map<string, DeliveryData>();
                delivery.forEach(d => {
                    if (d.atCode) {
                        deliveryMap.set(normalizeId(d.atCode), d);
                    }
                });

                const { metadataMap, normalizeBase } = baseInfo;

                const enrichedPnr = pnr.map(p => {
                    const atId = normalizeId(p.assignmentTaskId);
                    const matchedDelivery = deliveryMap.get(atId);

                    // A data vem do cruzamento (Data do Extravio). Se não localizado, "-"
                    const extravioDate = matchedDelivery ? matchedDelivery.date : '-';

                    let finalBaseName = matchedDelivery ? matchedDelivery.hub : '';
                    const normalized = normalizeBase(finalBaseName);
                    const meta = metadataMap.get(normalized);

                    if (meta && meta.baseId) {
                        finalBaseName = meta.baseId;
                    }

                    return {
                        ...p,
                        date: extravioDate,
                        base: finalBaseName
                    };
                });

                setTableData(delivery);
                setPnrData(enrichedPnr);
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
        setChartFilterCoord(null);
        setChartFilterHub(null);
    }, [startDate, endDate, selectedHub, driverSearch]);

    const filteredPnr = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
        const hubNorm = selectedHub?.trim().toUpperCase();

        return pnrData.filter(row => {
            const matchHub = !hubNorm || row.base.trim().toUpperCase() === hubNorm;
            if (!matchHub) return false;

            // Se não houver data definida (foi cruzado mas não localizado)
            if (!row.date || row.date === '-') {
                // Só exibe se não houver um filtro de data explícito (ou seja, se startDate/endDate forem vazios)
                // Ou podemos optar por nunca exibir se não houver data, mas o usuário quer "apenas os dados da tabela PNR".
                // Para manter a integridade do filtro de data, vamos ignorar se houver um range ativo.
                return !startDate && !endDate;
            }

            const rowDate = new Date(row.date + 'T00:00:00').getTime();
            const matchDate = rowDate >= start && rowDate <= end;
            return matchDate;
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

    const operationalBaseData = useMemo(() => {
        const pnrGroups = new Map<string, {
            count: number,
            reverted: number,
            originalDriver: string,
            originalBase: string,
            date: string,
            totalValue: number,
            atDetails: Array<{ id: string, date: string, value: number, status: string }>
        }>();

        // Função interna para normalizar nome removendo o [ID] para fins de junção (join)
        const normalizeForJoin = (name: string) => name.replace(/\[.*?\]/g, '').trim().toUpperCase();

        filteredPnr.forEach(row => {
            const driverKey = normalizeForJoin(row.driver);
            const key = driverKey; // Agregação exclusiva por Motorista

            const current = pnrGroups.get(key) || {
                count: 0,
                reverted: 0,
                originalDriver: row.driver,
                originalBase: row.base || '-',
                date: row.date || '-',
                totalValue: 0,
                atDetails: []
            };

            // Adiciona detalhe da AT
            const atDetail = {
                id: row.assignmentTaskId,
                trackingNumber: row.trackingNumber,
                date: row.date || '-',
                value: row.numericValue,
                status: row.statusShopee
            };

            pnrGroups.set(key, {
                ...current,
                count: current.count + 1,
                reverted: current.reverted + (row.statusShopee.trim().toUpperCase() === 'REVERSED' ? 1 : 0),
                totalValue: current.totalValue + row.numericValue,
                atDetails: [...current.atDetails, atDetail]
            });
        });

        const deliveryGroups = new Map<string, { total: number, pending: number, coordinator: string }>();
        filteredDelivery.forEach(row => {
            const driverKey = normalizeForJoin(row.driver);
            const key = driverKey; // Agregação exclusiva por Motorista
            const current = deliveryGroups.get(key) || { total: 0, pending: 0, coordinator: row.coordinator || 'S/C' };
            deliveryGroups.set(key, {
                total: current.total + row.atQuantity,
                pending: current.pending + row.pending,
                coordinator: current.coordinator === 'S/C' ? (row.coordinator || 'S/C') : current.coordinator
            });
        });

        // O usuário quer exibir APENAS os dados da tabela PNR.
        const pnrKeys = Array.from(pnrGroups.keys());

        return pnrKeys.map(key => {
            const pnrEntry = pnrGroups.get(key)!;
            const deliveryEntry = deliveryGroups.get(key);

            const pnrCount = pnrEntry.count;
            const revertedCount = pnrEntry.reverted;
            const totalPackets = deliveryEntry?.total || 0;
            const pendingCount = deliveryEntry?.pending || 0;
            const coordinator = deliveryEntry?.coordinator || 'S/C';
            const totalValue = pnrEntry.totalValue;

            // Se houver mais de uma data, mostramos um aviso visual
            const dates = Array.from(new Set(pnrEntry.atDetails.map(d => d.date).filter(d => d !== '-')));
            const displayDate = dates.length > 1 ? `Multiplas (${dates.length})` : (dates[0] || '-');

            return {
                driver: pnrEntry.originalDriver,
                base: pnrEntry.originalBase,
                date: displayDate,
                coordinator,
                pnrCount,
                revertedCount,
                totalPackets,
                pendingCount,
                totalValue,
                atDetails: pnrEntry.atDetails,
                pnrPercentage: totalPackets > 0 ? (pnrCount / totalPackets) * 100 : 0
            };
        });
    }, [filteredPnr, filteredDelivery]);

    const coordinatorData = useMemo(() => {
        const statsMap = new Map<string, { pnrCount: number, totalPackets: number, totalValue: number }>();
        operationalBaseData.forEach(row => {
            if (chartFilterHub && row.base.trim().toUpperCase() !== chartFilterHub.trim().toUpperCase()) return;
            if (driverSearch && !row.driver.toLowerCase().includes(driverSearch.toLowerCase())) return;

            const coord = row.coordinator;
            const current = statsMap.get(coord) || { pnrCount: 0, totalPackets: 0, totalValue: 0 };
            statsMap.set(coord, {
                pnrCount: current.pnrCount + row.pnrCount,
                totalPackets: current.totalPackets + row.totalPackets,
                totalValue: current.totalValue + row.totalValue
            });
        });

        return Array.from(statsMap.entries())
            .map(([name, data]) => ({
                name,
                pnrCount: data.pnrCount,
                pnrRate: data.totalPackets > 0 ? (data.pnrCount / data.totalPackets) * 100 : 0,
                totalValue: data.totalValue
            }))
            .sort((a, b) => b.pnrCount - a.pnrCount);
    }, [operationalBaseData, chartFilterHub, driverSearch]);

    const hubPerformanceData = useMemo(() => {
        const statsMap = new Map<string, { pnrCount: number, totalPackets: number, totalValue: number }>();
        operationalBaseData.forEach(row => {
            if (chartFilterCoord && row.coordinator !== chartFilterCoord) return;
            if (driverSearch && !row.driver.toLowerCase().includes(driverSearch.toLowerCase())) return;

            const hub = row.base.trim().toUpperCase();
            const current = statsMap.get(hub) || { pnrCount: 0, totalPackets: 0, totalValue: 0 };
            statsMap.set(hub, {
                pnrCount: current.pnrCount + row.pnrCount,
                totalPackets: current.totalPackets + row.totalPackets,
                totalValue: current.totalValue + row.totalValue
            });
        });

        return Array.from(statsMap.entries())
            .map(([name, data]) => ({
                name,
                pnrCount: data.pnrCount,
                pnrRate: data.totalPackets > 0 ? (data.pnrCount / data.totalPackets) * 100 : 0,
                totalValue: data.totalValue
            }))
            .sort((a, b) => b.pnrCount - a.pnrCount)
            .slice(0, 10);
    }, [operationalBaseData, chartFilterCoord, driverSearch]);

    const operationalDetails = useMemo(() => {
        let filtered = operationalBaseData;
        if (driverSearch) {
            filtered = filtered.filter(d => d.driver.toLowerCase().includes(driverSearch.toLowerCase()));
        }
        if (chartFilterCoord) {
            filtered = filtered.filter(d => d.coordinator === chartFilterCoord);
        }
        if (chartFilterHub) {
            filtered = filtered.filter(d => d.base.trim().toUpperCase() === chartFilterHub.trim().toUpperCase());
        }
        return filtered
            .filter(d => d.pnrCount > 0)
            .sort((a, b) => b.pnrCount - a.pnrCount);
    }, [operationalBaseData, driverSearch, chartFilterCoord, chartFilterHub]);

    const stats = useMemo(() => {
        const totalShipments = operationalDetails.reduce((acc, row) => acc + row.totalPackets, 0);
        const totalFailures = operationalDetails.reduce((acc, row) => acc + row.pnrCount, 0);
        const totalReverted = operationalDetails.reduce((acc, row) => acc + row.revertedCount, 0);
        const totalPending = operationalDetails.reduce((acc, row) => acc + row.pendingCount, 0);
        const totalPNRValue = operationalDetails.reduce((acc, row) => acc + row.totalValue, 0);

        return {
            totalShipments,
            totalFailures,
            totalReverted,
            totalPending,
            totalPNRValue,
            pnrRate: totalShipments > 0 ? (totalFailures / totalShipments) * 100 : 0
        };
    }, [operationalDetails]);

    const riskData = useMemo(() => {
        const TRANSLATIONS: Record<string, string> = {
            'REVERSED': 'Revertido',
            'LOST': 'Extraviado',
            'DAMAGED': 'Avariado'
        };

        const statusCounts = new Map<string, number>();
        filteredPnr.forEach(row => {
            const raw = row.statusShopee.trim().toUpperCase();
            const translated = TRANSLATIONS[raw] || row.statusShopee;
            statusCounts.set(translated, (statusCounts.get(translated) || 0) + 1);
        });

        return Array.from(statusCounts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredPnr]);

    const RISK_COLORS = ['#BC4749', '#1B4332', '#F2A65A', '#774936', '#4A4E69', '#9A8C98'];

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
                    <p className="text-[#64748B] text-sm font-medium">Controle de PNR</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {chartFilterCoord && (
                        <div
                            onClick={() => setChartFilterCoord(null)}
                            className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-all"
                        >
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Coord: {chartFilterCoord}</span>
                            <span className="material-symbols-outlined text-blue-400 text-sm">close</span>
                        </div>
                    )}
                    {chartFilterHub && (
                        <div
                            onClick={() => setChartFilterHub(null)}
                            className="bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-purple-100 transition-all"
                        >
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-tight">Base: {chartFilterHub}</span>
                            <span className="material-symbols-outlined text-purple-400 text-sm">close</span>
                        </div>
                    )}
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <MetricCard
                    label="Total Pacotes"
                    value={stats.totalShipments.toLocaleString('pt-BR')}
                    icon="package_2"
                    gradient="from-blue-50 to-white"
                    borderColor="border-blue-100"
                    iconBg="bg-blue-500"
                />
                <MetricCard
                    label="PNR"
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
                <MetricCard
                    label="Valor Total PNR"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPNRValue)}
                    icon="payments"
                    gradient="from-amber-50 to-white"
                    borderColor="border-amber-100"
                    iconBg="bg-amber-500"
                />
            </section>

            {/* Top Charts: Coordinator & Risk */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
                {/* Coordenadores */}
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-deluna-primary text-base md:text-lg font-bold">Performance por Coordenador</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique para filtrar</span>
                    </div>
                    <div className="h-64 w-full [&_*:focus]:outline-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                style={{ outline: 'none' }}
                                data={coordinatorData}
                                onClick={(data: any) => {
                                    if (data && data.activeLabel) {
                                        setChartFilterCoord(data.activeLabel === chartFilterCoord ? null : data.activeLabel);
                                    }
                                }}
                            >
                                <defs>
                                    <linearGradient id="barGradientCoord" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#BC4749" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#BC4749" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" hide />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any, name: string, props: any) => {
                                        if (name === 'pnrRate') return [`${Number(value).toFixed(2)}%`, 'Taxa PNR'];
                                        if (name === 'pnrCount') {
                                            const totalValue = props.payload.totalValue || 0;
                                            return [
                                                <div key="custom-coord-tooltip" className="flex flex-col gap-1">
                                                    <span className="font-bold">{value} Pacotes</span>
                                                    <span className="text-red-500 font-extrabold text-[10px]">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                                    </span>
                                                </div>,
                                                'Detalhes PNR'
                                            ];
                                        }
                                        return [value, name];
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="pnrCount" radius={[6, 6, 0, 0]} barSize={32} name="pnrCount">
                                    {coordinatorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartFilterCoord === entry.name ? '#000' : 'url(#barGradientCoord)'} />
                                    ))}
                                    <LabelList dataKey="pnrCount" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#BC4749' }} />
                                </Bar>
                                <Bar yAxisId="right" dataKey="pnrRate" fill="#64748B" radius={[6, 6, 0, 0]} barSize={12} name="pnrRate" opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Concentração de Riscos */}
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-deluna-primary text-base md:text-lg font-bold">Concentração de Riscos</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PNR vs Revertidos</span>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center [&_*:focus]:outline-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart style={{ outline: 'none' }}>
                                <Pie
                                    data={riskData}
                                    innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Performance por Base: Full Width */}
            <section className="mb-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-deluna-primary text-base md:text-lg font-bold">Performance por Base</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 10 Bases / Hubs</span>
                    </div>
                    <div className="h-72 w-full [&_*:focus]:outline-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                style={{ outline: 'none' }}
                                data={hubPerformanceData}
                                onClick={(data: any) => {
                                    if (data && data.activeLabel) {
                                        setChartFilterHub(data.activeLabel === chartFilterHub ? null : data.activeLabel);
                                    }
                                }}
                            >
                                <defs>
                                    <linearGradient id="barGradientHub" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#386641" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#386641" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" hide />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any, name: string, props: any) => {
                                        if (name === 'pnrRate') return [`${Number(value).toFixed(2)}%`, 'Taxa PNR'];
                                        if (name === 'pnrCount') {
                                            const totalValue = props.payload.totalValue || 0;
                                            return [
                                                <div key="custom-pnr-tooltip" className="flex flex-col gap-1">
                                                    <span className="font-bold">{value} Pacotes</span>
                                                    <span className="text-red-500 font-extrabold text-[10px]">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                                    </span>
                                                </div>,
                                                'Detalhes PNR'
                                            ];
                                        }
                                        return [value, name];
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="pnrCount" radius={[6, 6, 0, 0]} barSize={48} name="pnrCount">
                                    {hubPerformanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartFilterHub === entry.name ? '#000' : 'url(#barGradientHub)'} />
                                    ))}
                                    <LabelList dataKey="pnrCount" position="top" style={{ fontSize: '11px', fontWeight: '900', fill: '#386641' }} />
                                </Bar>
                                <Bar yAxisId="right" dataKey="pnrRate" fill="#64748B" radius={[6, 6, 0, 0]} barSize={16} name="pnrRate" opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

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
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-[#F8FAFC]">
                            <tr className="text-[#64748B] text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Motorista Responsável</th>
                                <th className="px-8 py-5">Base / Hub</th>
                                <th className="px-8 py-5 text-center">Data do Extravio</th>
                                <th className="px-8 py-5 text-right">Pacotes (PNR)</th>
                                <th className="px-8 py-5 text-right">Total Pacotes</th>
                                <th className="px-8 py-5 text-right">Valor PNR</th>
                                <th className="px-8 py-5 text-right">PNR %</th>
                                <th className="px-8 py-5 text-center">Meta</th>
                                <th className="px-8 py-5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {loading ? (
                                <tr><td colSpan={9} className="px-8 py-20 text-center text-slate-400 font-bold">Carregando indicadores...</td></tr>
                            ) : paginatedTable.length === 0 ? (
                                <tr><td colSpan={9} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhum registro encontrado.</td></tr>
                            ) : (
                                paginatedTable.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-8 py-5 relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-deluna-primary text-white flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">
                                                    {row.driver.split(' ').map(n => n.includes('[') ? '' : n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col relative">
                                                    <span className="text-sm font-extrabold text-deluna-primary cursor-help">
                                                        {row.driver}
                                                    </span>

                                                    {/* Premium Popover no Hover */}
                                                    <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-[100] w-[85vw] sm:min-w-[420px] max-w-[450px] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in duration-200 overflow-x-auto custom-scrollbar">
                                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 min-w-[380px]">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo de ATs ({row.atDetails.length})</span>
                                                            <span className="text-[10px] font-bold text-deluna-primary bg-deluna-primary/5 px-2 py-0.5 rounded-full">Total: R$ {row.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                            {row.atDetails.map((at, idx) => (
                                                                <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors min-w-[380px]">
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-black text-slate-700">#{at.id}</span>
                                                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded italic">{at.trackingNumber}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-400 font-bold">{at.date !== '-' ? new Date(at.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'S/Data'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-black text-red-600">R$ {at.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${at.status.toUpperCase() === 'REVERSED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-deluna-primary/5 text-deluna-primary rounded-full text-[11px] font-bold border border-deluna-primary/10">
                                                {row.base}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-500">
                                            {row.date.includes('Multiplas') ? (
                                                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                    {row.date}
                                                </span>
                                            ) : (
                                                row.date && row.date !== '-' ? new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-right font-black text-red-600">{row.pnrCount}</td>
                                        <td className="px-8 py-5 text-sm text-right font-black text-slate-400">{row.totalPackets}</td>
                                        <td className="px-8 py-5 text-sm text-right font-black text-slate-600">
                                            {(() => {
                                                const val = row.totalValue;

                                                const formattedNum = new Intl.NumberFormat('pt-BR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }).format(val);

                                                return val > 0 ? `R$ ${formattedNum}` : 'R$ 0,00';
                                            })()}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${row.pnrPercentage > 0.50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {row.pnrPercentage.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">0.50%</td>
                                        <td className="px-8 py-5 text-center">
                                            {row.pnrPercentage <= 0.50 ? (
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
                <div className="px-8 py-5 bg-[#F8FAFC] border-t border-[#F1F5F9] flex justify-between items-center">
                    <p className="text-xs font-bold text-[#64748B]">Exibindo {paginatedTable.length} de {operationalDetails.length} registros</p>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black text-deluna-primary disabled:opacity-30">Anterior</button>
                        <div className="flex items-center px-4 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black">{currentPage} / {totalPages || 1}</div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-black text-deluna-primary disabled:opacity-30">Próximo</button>
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
