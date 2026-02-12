import React, { useState, useEffect, useMemo } from 'react';
import { VirtualBankData, DeliveryData, MetaGoalData, MetaDSData, QLPData, MetaCaptacaoData, MetaProtagonismoData, ProtagonismoRow, PNRRow, MetaPerdasData } from '../types';
import { fetchVirtualBankData, fetchDeliveryData, fetchMetasData, fetchMetasDSData, fetchQLPData, fetchMetasCaptacaoData, fetchMetaProtagonismoData, fetchProtagonismoData, fetchPNRData, fetchMetaPerdasData } from '../services/api';

interface VirtualBankProps {
    startDate: string;
    endDate: string;
}

const VirtualBank: React.FC<VirtualBankProps> = ({ startDate, endDate }) => {
    const [bankData, setBankData] = useState<VirtualBankData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para cálculo dinâmico (Mesmos do Leaderboard)
    const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
    const [metasData, setMetasData] = useState<MetaGoalData[]>([]);
    const [metasDSData, setMetasDSData] = useState<MetaDSData[]>([]);
    const [qlpData, setQlpData] = useState<QLPData[]>([]);
    const [metasCaptacaoData, setMetasCaptacaoData] = useState<MetaCaptacaoData[]>([]);
    const [protagonismoData, setProtagonismoData] = useState<ProtagonismoRow[]>([]);
    const [metasProtagonismoData, setMetasProtagonismoData] = useState<MetaProtagonismoData[]>([]);
    const [pnrData, setPnrData] = useState<PNRRow[]>([]);
    const [metasPerdasData, setMetasPerdasData] = useState<MetaPerdasData[]>([]);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                const [
                    bankRes,
                    deliveryRes,
                    metasRes,
                    metasDSRes,
                    qlpRes,
                    metasCaptacaoRes,
                    protRes,
                    metasProtRes,
                    pnrRes,
                    metaPerdasRes
                ] = await Promise.all([
                    fetchVirtualBankData(),
                    fetchDeliveryData(),
                    fetchMetasData(),
                    fetchMetasDSData(),
                    fetchQLPData(),
                    fetchMetasCaptacaoData(),
                    fetchProtagonismoData(),
                    fetchMetaProtagonismoData(),
                    fetchPNRData(),
                    fetchMetaPerdasData()
                ]);

                setBankData(bankRes);
                setDeliveryData(deliveryRes);
                setMetasData(metasRes);
                setMetasDSData(metasDSRes);
                setQlpData(qlpRes);
                setMetasCaptacaoData(metasCaptacaoRes);
                setProtagonismoData(protRes);
                setMetasProtagonismoData(metasProtRes);
                setPnrData(pnrRes);
                setMetasPerdasData(metaPerdasRes);

                setError(null);
            } catch (err) {
                setError('Erro ao carregar os dados financeiros.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    // Função de parsing idêntica ao DeliverySuccess para evitar problemas de timezone
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date(NaN);
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Lógica de cálculo de faturamento (Copiada do Leaderboard)
    const calculatedRewards = useMemo(() => {
        const rewardsMap = new Map<string, number>();

        if (deliveryData.length === 0 || metasData.length === 0) return rewardsMap;

        const startTimestamp = parseLocalDate(startDate).getTime();
        const endTimestamp = parseLocalDate(endDate).getTime();

        const periodData = deliveryData.filter(row => {
            const rowDate = parseLocalDate(row.date).getTime();
            return rowDate >= startTimestamp && rowDate <= endTimestamp;
        });

        const normalize = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');
        const removeAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Agrupar ATs por base e dia
        const basesMap = new Map<string, Map<string, Set<string>>>();
        periodData.forEach(row => {
            const base = normalize(row.hub);
            if (!basesMap.has(base)) basesMap.set(base, new Map());
            const days = basesMap.get(base)!;
            const dayKey = row.date;
            const dayATs = days.get(dayKey) || new Set<string>();
            if (row.atCode) dayATs.add(row.atCode);
            else dayATs.add(`fallback-${row.id}-${Math.random()}`);
            days.set(dayKey, dayATs);
        });

        const startObj = parseLocalDate(startDate);
        const endObj = parseLocalDate(endDate);
        const diffDays = Math.ceil(Math.abs(endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const currentMonthName = monthsNames[startObj.getMonth()];
        const normalizedMonth = removeAccents(currentMonthName).toLowerCase();

        protagonismoData.forEach(row => {
            const normalizedBase = normalize(row.base);
            const daysData = basesMap.get(normalizedBase);

            let currTotalATs = 0;
            let totalDelivered = 0;
            let totalRemessas = 0;

            if (daysData) {
                daysData.forEach(set => currTotalATs += set.size);
                const basePeriodData = periodData.filter(d => normalize(d.hub) === normalizedBase);
                totalRemessas = basePeriodData.reduce((sum, d) => sum + d.atQuantity, 0);
                totalDelivered = basePeriodData.reduce((sum, d) => sum + d.delivered, 0);
            }

            const dsRate = totalRemessas > 0 ? (totalDelivered / totalRemessas) * 100 : 0;
            const basePnrData = pnrData.filter(p => {
                const pDate = parseLocalDate(p.date).getTime();
                return normalize(p.base) === normalizedBase && pDate >= startTimestamp && pDate <= endTimestamp;
            });
            const pnrRate = totalRemessas > 0 ? (basePnrData.length / totalRemessas) * 100 : 0;

            const getMetaForType = (type: number) => metasData.find(m =>
                normalize(m.base) === normalizedBase &&
                removeAccents(m.periodo).toLowerCase() === normalizedMonth &&
                m.tipoMeta === type
            );

            const meta1 = getMetaForType(1);
            const target1 = meta1 ? Math.round(meta1.valorMetaDia * diffDays) : 0;
            const isAccess = currTotalATs >= target1 && target1 > 0;

            let totalReward = 0;

            if (isAccess) {
                // Pilar 1: Carregamento
                const meta2 = getMetaForType(2);
                const meta3 = getMetaForType(3);
                const target2 = meta2 ? Math.round(meta2.valorMetaDia * diffDays) : 0;
                const target3 = meta3 ? Math.round(meta3.valorMetaDia * diffDays) : 0;

                if (meta3 && currTotalATs >= target3) totalReward += meta3.valorPremio;
                else if (meta2 && currTotalATs >= target2) totalReward += meta2.valorPremio;
                else if (meta1) totalReward += meta1.valorPremio;

                // Pilar 2: Operacional
                const getMetaDS = (type: number) => metasDSData.find(m => normalize(m.base) === normalizedBase && m.tipoMeta === type);
                const mds1 = getMetaDS(1);
                const mds2 = getMetaDS(2);
                const mds3 = getMetaDS(3);

                if (mds3 && dsRate >= mds3.valorMetaDS) totalReward += mds3.valorPremio;
                else if (mds2 && dsRate >= mds2.valorMetaDS) totalReward += mds2.valorPremio;
                else if (mds1 && dsRate >= mds1.valorMetaDS) totalReward += mds1.valorPremio;

                // Pilar 3: Captação
                const isApto = (status: string) => {
                    const s = String(status || '').toUpperCase().trim();
                    return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
                };
                const baseAptos = qlpData.filter(r =>
                    normalize(r.base) === normalizedBase &&
                    isApto(r.situacaoCnh) && isApto(r.situacaoMotorista) && isApto(r.situacaoGrPlaca)
                ).length;
                const metaCapt = metasCaptacaoData.find(m => normalize(m.base) === normalizedBase);
                if (metaCapt && baseAptos >= metaCapt.valorMetaQLP) totalReward += metaCapt.valorPremio;

                // Pilar 4: Perdas
                const baseMetasPerdas = metasPerdasData
                    .filter(m => normalize(m.base) === normalizedBase)
                    .sort((a, b) => a.valorMetaPNR - b.valorMetaPNR);
                const metaPerdaAtingida = baseMetasPerdas.find(m => pnrRate < m.valorMetaPNR);
                if (metaPerdaAtingida) totalReward += metaPerdaAtingida.valorPremio;

                // Pilar 5: Protagonismo
                const protResult = protagonismoData.find(p => normalize(p.base) === normalizedBase);
                const notaProt = protResult ? protResult.resultado : 0;
                const getMetaProt = (type: number) => metasProtagonismoData.find(m =>
                    normalize(m.base) === normalizedBase && m.tipoMeta === type &&
                    (removeAccents(m.periodo).toLowerCase() === normalizedMonth || m.periodo === '')
                );
                const mp1 = getMetaProt(1);
                const mp2 = getMetaProt(2);
                const mp3 = getMetaProt(3);

                if (mp3 && notaProt >= mp3.valorMetaProtagonismo) totalReward += mp3.valorPremio;
                else if (mp2 && notaProt >= mp2.valorMetaProtagonismo) totalReward += mp2.valorPremio;
                else if (mp1 && notaProt >= mp1.valorMetaProtagonismo) totalReward += mp1.valorPremio;
            }

            rewardsMap.set(normalizedBase, totalReward);
        });

        return rewardsMap;
    }, [deliveryData, metasData, metasDSData, qlpData, metasCaptacaoData, protagonismoData, metasProtagonismoData, pnrData, metasPerdasData, startDate, endDate]);

    const finalData = useMemo(() => {
        const normalize = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');

        return bankData.map(item => ({
            ...item,
            previsao_bonus: calculatedRewards.get(normalize(item.base)) || 0
        })).filter(item =>
            item.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lider.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.coordinator.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bankData, calculatedRewards, searchTerm]);

    const totalAcumulado = useMemo(() => {
        return finalData.reduce((acc, curr) => acc + curr.atualmente_acumulado, 0);
    }, [finalData]);

    const totalPrevisao = useMemo(() => {
        return finalData.reduce((acc, curr) => acc + curr.previsao_bonus, 0);
    }, [finalData]);

    return (
        <div className="p-4 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-3xl p-8 text-white shadow-xl shadow-deluna-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
                    </div>
                    <div className="relative">
                        <p className="text-[#95D5B2] text-xs font-black uppercase tracking-[0.2em] mb-2">Saldo Total Estimado</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 flex items-baseline gap-2">
                            <span className="text-2xl font-bold opacity-60">R$</span>
                            {(totalAcumulado + totalPrevisao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h2>
                        <div className="flex gap-4">
                            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 transition-all hover:bg-white/30">
                                <p className="text-[10px] font-bold text-[#95D5B2] uppercase mb-1">Previsão do Período</p>
                                <p className="text-2xl font-black italic">R$ {totalPrevisao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[9px] opacity-60 mt-1 uppercase font-bold tracking-wider">Baseado no Leaderboard</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 transition-all hover:bg-white/30">
                                <p className="text-[10px] font-bold text-[#95D5B2] uppercase mb-1">Valor Garantido</p>
                                <p className="text-2xl font-black italic">R$ {totalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[9px] opacity-60 mt-1 uppercase font-bold tracking-wider">Acumulado na Planilha</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="size-8 rounded-lg bg-deluna-gold/10 flex items-center justify-center text-deluna-gold">
                                <span className="material-symbols-outlined text-xl">account_balance</span>
                            </div>
                            <h3 className="text-deluna-primary font-bold">Resumo Financeiro</h3>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            <strong className="text-deluna-primary italic">Previsão do Período</strong> reflete o cálculo exato da página Acelera + 30 para o intervalo de datas selecionado acima.
                        </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Aba</span>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-deluna-primary uppercase">Banco_Virtual OK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-black text-deluna-primary uppercase tracking-tight italic">Relatório de Ganhos</h3>
                        <p className="text-xs font-medium text-slate-500">Sincronizado com Leaderboard dinâmico</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por base ou líder..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-deluna-primary placeholder:text-slate-400 focus:ring-2 focus:ring-deluna-primary/10 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-10 h-10 border-4 border-deluna-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando faturamento...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-red-400 text-5xl mb-4">database_off</span>
                            <p className="text-red-500 font-bold">{error}</p>
                        </div>
                    ) : finalData.length === 0 ? (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">search_off</span>
                            <p className="text-slate-400 font-bold italic">Nenhuma base encontrada para "{searchTerm}"</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-8 py-5">Base / Hub</th>
                                    <th className="px-8 py-5">Motorista / Líder</th>
                                    <th className="px-8 py-5 text-center">Meses Campanha</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Previsão do Período</th>
                                    <th className="px-8 py-5 text-right">Valor Garantido</th>
                                    <th className="px-8 py-5 text-right">Saldo Estimado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {finalData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-2xl bg-deluna-primary/5 flex items-center justify-center text-deluna-primary transition-all group-hover:bg-deluna-primary group-hover:text-white">
                                                    <span className="material-symbols-outlined text-xl">hub</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-deluna-primary tracking-tight">{item.base}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{item.coordinator}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-slate-700 uppercase italic">{item.lider}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-xs font-black text-slate-600 block text-center">{item.qtde_meses} <span className="text-[9px] font-bold text-slate-300">mês/meses</span></span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full border flex items-center gap-1.5 shadow-sm transition-all duration-300 ${item.meta_alcancada
                                                    ? 'bg-[#B7E4C7] text-[#1B4332] border-[#74C69D] shadow-[0_0_15px_rgba(183,228,199,0.4)] animate-pulse-subtle'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[12px]">
                                                        {item.meta_alcancada ? 'verified' : 'pending'}
                                                    </span>
                                                    {item.status_texto}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right bg-deluna-primary/[0.02]">
                                            <p className="text-sm font-bold text-deluna-primary italic">R$ {item.previsao_bonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-tight">Leaderboard</p>
                                        </td>
                                        <td className="px-8 py-5 text-right font-manrope">
                                            <p className="text-base font-black text-slate-800 tracking-tight">R$ {item.atualmente_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right bg-deluna-primary/[0.05] rounded-r-2xl">
                                            <p className="text-base font-black text-deluna-primary tracking-tight">R$ {(item.atualmente_acumulado + item.previsao_bonus).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[8px] font-black text-deluna-primary/40 uppercase tracking-tight">Total Geral</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default VirtualBank;
