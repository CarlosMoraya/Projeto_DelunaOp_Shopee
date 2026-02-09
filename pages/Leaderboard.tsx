import React, { useState, useEffect, useMemo } from 'react';
import { DeliveryData, MetaGoalData, MetaDSData, QLPData, MetaCaptacaoData, MetaProtagonismoData, ProtagonismoRow } from '../types';
import { fetchDeliveryData, fetchMetasData, fetchMetasDSData, fetchQLPData, fetchMetasCaptacaoData, fetchMetaProtagonismoData, fetchProtagonismoData } from '../services/api';

interface LeaderboardProps {
  startDate: string;
  endDate: string;
}

interface CampanhaRow {
  base: string;
  localidade: string;
  lider: string;
  avatar: string; // Novo campo para link da foto
  regraAcesso: string; // "META1", "META2", "META3" ou ""
  carregamento: number;
  qOperacional: number;
  esforcoCaptacao: number;
  controlePerdas: number;
  protagonismo: number;
  total: number;
}

const CAMPANHA_DATA: CampanhaRow[] = [
  { base: 'LRJ01', localidade: 'São João do Meriti', lider: 'Edimilson', avatar: 'https://picsum.photos/seed/edimilson/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 100, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 950 },
  { base: 'LRJ14', localidade: 'Duque de Caxias', lider: 'Edimilson', avatar: 'https://picsum.photos/seed/edimilson2/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 100, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 950 },
  { base: 'LES03', localidade: 'Serra', lider: 'Caique', avatar: 'https://picsum.photos/seed/caique/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 100, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 950 },
  { base: 'LRJ08', localidade: 'São Gonçalo', lider: 'Larissa', avatar: 'https://picsum.photos/seed/larissa/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 25, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 875 },
  { base: 'LES09', localidade: 'Viana', lider: 'Cristiane', avatar: 'https://picsum.photos/seed/cristiane/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 100, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 950 },
  { base: 'LRJ12', localidade: 'Nova Iguaçu', lider: 'Patrick', avatar: 'https://picsum.photos/seed/patrick/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ04', localidade: 'Campo G', lider: 'Andreia', avatar: 'https://picsum.photos/seed/andreia/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ23', localidade: 'São Gonçalo 2', lider: 'Rafael', avatar: '/avatars/Rafael.jpeg', regraAcesso: 'META3', carregamento: 500, qOperacional: 25, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 875 },
  { base: 'LRJ07', localidade: 'São Cristóvão', lider: 'Thais', avatar: '/avatars/Thais.jpeg', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LBA14', localidade: 'Camaçari', lider: 'Lucineide', avatar: 'https://picsum.photos/seed/lucineide/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 25, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 875 },
  { base: 'LRJ05', localidade: 'Macaé', lider: 'Rafael', avatar: 'https://picsum.photos/seed/rafael2/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ02', localidade: 'Nova Friburgo', lider: 'Cristiane', avatar: '/avatars/Christiane.jpeg', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ21', localidade: 'Cabo Frio', lider: 'Eduardo', avatar: '/avatars/Eduardo.jpeg', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ15', localidade: 'Magé', lider: 'Poliana', avatar: 'https://picsum.photos/seed/poliana/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LBA18', localidade: 'Salvador', lider: 'Adriana', avatar: 'https://picsum.photos/seed/adriana/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LBA17', localidade: 'Simões Filho', lider: 'Luiza', avatar: 'https://picsum.photos/seed/luiza/200/200', regraAcesso: 'META3', carregamento: 500, qOperacional: 0, esforcoCaptacao: 100, controlePerdas: 200, protagonismo: 50, total: 850 },
  { base: 'LRJ99', localidade: 'Teste', lider: 'Líder Sem Meta', avatar: 'https://picsum.photos/seed/semmeta/200/200', regraAcesso: '', carregamento: 0, qOperacional: 0, esforcoCaptacao: 0, controlePerdas: 0, protagonismo: 0, total: 0 },
];

const getDirectImageLink = (url: string) => {
  if (!url) return '';
  // Se o link já for um caminho local (começando com /)
  if (url.startsWith('/')) return url;

  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : null;
    if (id) {
      // Este endpoint é o que o navegador usou no teste anterior e funcionou.
      // Ele gera uma imagem real que o navegador aceita renderizar.
      return `https://drive.google.com/thumbnail?id=${id}&sz=w200`;
    }
  }
  return url;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [metasData, setMetasData] = useState<MetaGoalData[]>([]);
  const [metasDSData, setMetasDSData] = useState<MetaDSData[]>([]);
  const [qlpData, setQlpData] = useState<QLPData[]>([]);
  const [metasCaptacaoData, setMetasCaptacaoData] = useState<MetaCaptacaoData[]>([]);
  const [protagonismoData, setProtagonismoData] = useState<ProtagonismoRow[]>([]);
  const [metasProtagonismoData, setMetasProtagonismoData] = useState<MetaProtagonismoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deliveryRes, metasRes, metasDSRes, qlpRes, metasCaptacaoRes, protRes, metasProtRes] = await Promise.all([
          fetchDeliveryData(),
          fetchMetasData(),
          fetchMetasDSData(),
          fetchQLPData(),
          fetchMetasCaptacaoData(),
          fetchProtagonismoData(),
          fetchMetaProtagonismoData()
        ]);
        setDeliveryData(deliveryRes);
        setMetasData(metasRes);
        setMetasDSData(metasDSRes);
        setQlpData(qlpRes);
        setMetasCaptacaoData(metasCaptacaoRes);
        setProtagonismoData(protRes);
        setMetasProtagonismoData(metasProtRes);
      } catch (err) {
        console.error('Erro ao carregar dados no Leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Lógica de cálculo de performance (similar ao ComparativoATs)
  const dynamicStatus = useMemo(() => {
    const statusMap = new Map<string, {
      isAccess: boolean;
      rewardValue: number | string;
      operationalReward: number | string;
      captacaoReward: number | string;
      protagonismoReward: number | string;
    }>();

    if (deliveryData.length === 0 || metasData.length === 0) return statusMap;

    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    const periodData = deliveryData.filter(row => {
      const rowDate = new Date(row.date).getTime();
      return rowDate >= startTime && rowDate <= endTime;
    });

    const normalize = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');

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

    // Calcular período
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const removeAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthName = monthsNames[start.getMonth()];
    const normalizedMonth = removeAccents(currentMonthName).toLowerCase();

    CAMPANHA_DATA.forEach(row => {
      const normalizedBase = normalize(row.base);
      const daysData = basesMap.get(normalizedBase);

      let currTotal = 0;
      let totalDelivered = 0;
      let totalRemessas = 0;

      if (daysData) {
        daysData.forEach(set => currTotal += set.size);

        // Calcular DS (Delivery Success %) para a base no período
        const basePeriodData = periodData.filter(d => normalize(d.hub) === normalizedBase);
        totalRemessas = basePeriodData.reduce((sum, d) => sum + d.atQuantity, 0);
        totalDelivered = basePeriodData.reduce((sum, d) => sum + d.delivered, 0);
      }

      const dsRate = totalRemessas > 0 ? (totalDelivered / totalRemessas) * 100 : 0;

      if (normalizedBase === 'LRJ04' || normalizedBase === 'LRJ05') { // Bases de exemplo do print
        console.log(`DEBUG DS [${normalizedBase}]: DS_Calculado=${dsRate.toFixed(2)}% | Remessas=${totalRemessas} | Entregues=${totalDelivered}`);
      }

      // Buscar metas de volume (Meta 1, 2, 3)
      const getMetaForType = (type: number) => metasData.find(m =>
        normalize(m.base) === normalizedBase &&
        removeAccents(m.periodo).toLowerCase() === normalizedMonth &&
        m.tipoMeta === type
      );

      const meta1 = getMetaForType(1);
      const meta2 = getMetaForType(2);
      const meta3 = getMetaForType(3);

      const target1 = meta1 ? Math.round(meta1.valorMetaDia * diffDays) : 0;
      const target2 = meta2 ? Math.round(meta2.valorMetaDia * diffDays) : 0;
      const target3 = meta3 ? Math.round(meta3.valorMetaDia * diffDays) : 0;

      const isAccess = currTotal >= target1 && target1 > 0;

      // Regra de Negócio: Coluna Carregamento (Carr.)
      let rewardValue: number | string = '-';
      if (isAccess) {
        if (meta3 && currTotal >= target3) rewardValue = meta3.valorPremio;
        else if (meta2 && currTotal >= target2) rewardValue = meta2.valorPremio;
        else if (meta1) rewardValue = meta1.valorPremio;
      }

      // NOVO: Regra de Negócio para Coluna Operacional (Oper.)
      let operationalReward: number | string = '-';
      if (isAccess) {
        // Buscar metas de DS para esta base
        const getMetaDS = (type: number) => metasDSData.find(m => normalize(m.base) === normalizedBase && m.tipoMeta === type);

        const mds1 = getMetaDS(1);
        const mds2 = getMetaDS(2);
        const mds3 = getMetaDS(3);

        if (normalizedBase === 'LRJ04' || normalizedBase === 'LRJ05') {
          console.log(`DEBUG METAS [${normalizedBase}]: M1=${mds1?.valorMetaDS}% M2=${mds2?.valorMetaDS}% M3=${mds3?.valorMetaDS}%`);
        }

        // Comparação explícita
        if (mds3 && dsRate >= mds3.valorMetaDS) operationalReward = mds3.valorPremio;
        else if (mds2 && dsRate >= mds2.valorMetaDS) operationalReward = mds2.valorPremio;
        else if (mds1 && dsRate >= mds1.valorMetaDS) operationalReward = mds1.valorPremio;
        else {
          operationalReward = 0;
          if (normalizedBase === 'LRJ04' || normalizedBase === 'LRJ05') console.log(`DEBUG RESULT [${normalizedBase}]: Meta não atingida.`);
        }
      }

      // NOVO: Regra de Negócio para Coluna Captação (Pilar 3)
      let captacaoReward: number | string = '-';
      if (isAccess) {
        // Lógica de "Apto" do QLPManagement
        const isApto = (status: string) => {
          const s = String(status || '').toUpperCase().trim();
          return s === 'APTO' || (s.includes('APTO') && !s.includes('INAPTO'));
        };

        const baseAptos = qlpData.filter(r =>
          normalize(r.base) === normalizedBase &&
          isApto(r.situacaoCnh) &&
          isApto(r.situacaoMotorista) &&
          isApto(r.situacaoGrPlaca)
        ).length;

        const metaCapt = metasCaptacaoData.find(m => normalize(m.base) === normalizedBase);
        if (metaCapt && baseAptos >= metaCapt.valorMetaQLP) {
          captacaoReward = metaCapt.valorPremio;
        } else {
          captacaoReward = 0;
        }
      }

      // NOVO: Regra de Negócio para Coluna Protagonismo (Pilar 5)
      let protagonismoReward: number | string = '-';
      if (isAccess) {
        const protResult = protagonismoData.find(p => normalize(p.base) === normalizedBase);
        const notaProt = protResult ? protResult.resultado : 0;

        const getMetaProt = (type: number) => metasProtagonismoData.find(m =>
          normalize(m.base) === normalizedBase &&
          m.tipoMeta === type &&
          (removeAccents(m.periodo).toLowerCase() === normalizedMonth || m.periodo === '')
        );

        const mp1 = getMetaProt(1);
        const mp2 = getMetaProt(2);
        const mp3 = getMetaProt(3);

        if (normalizedBase === 'LRJ04' || normalizedBase === 'LRJ05') {
          console.log(`DEBUG PROTAG [${normalizedBase}]: Nota=${notaProt.toFixed(2)} | Metas: M1=${mp1?.valorMetaProtagonismo} M2=${mp2?.valorMetaProtagonismo} M3=${mp3?.valorMetaProtagonismo}`);
        }

        if (mp3 && notaProt >= mp3.valorMetaProtagonismo) protagonismoReward = mp3.valorPremio;
        else if (mp2 && notaProt >= mp2.valorMetaProtagonismo) protagonismoReward = mp2.valorPremio;
        else if (mp1 && notaProt >= mp1.valorMetaProtagonismo) protagonismoReward = mp1.valorPremio;
        else {
          protagonismoReward = 0;
          if (normalizedBase === 'LRJ04' || normalizedBase === 'LRJ05') console.log(`DEBUG RESULT PROTAG [${normalizedBase}]: Meta não atingida.`);
        }
      }

      statusMap.set(row.base, { isAccess, rewardValue, operationalReward, captacaoReward, protagonismoReward });
    });

    return statusMap;
  }, [deliveryData, metasData, metasDSData, qlpData, metasCaptacaoData, protagonismoData, metasProtagonismoData, startDate, endDate]);

  // Cálculo de dados finais combinando campos estáticos com prêmios dinâmicos
  const finalLeaderboardData = useMemo(() => {
    return CAMPANHA_DATA.map(row => {
      const status = dynamicStatus.get(row.base);
      const dynamicReward = (status && typeof status.rewardValue === 'number') ? status.rewardValue : 0;
      const operReward = (status && typeof status.operationalReward === 'number') ? status.operationalReward : 0;
      const captReward = (status && typeof status.captacaoReward === 'number') ? status.captacaoReward : 0;
      const protReward = (status && typeof status.protagonismoReward === 'number') ? status.protagonismoReward : 0;

      // Novo total: Carr. dinâmico + Oper. dinâmico + Captação dinâmico + Perdas estático + Protagonismo dinâmico
      const currentTotal = dynamicReward + operReward + captReward + row.controlePerdas + protReward;

      return {
        ...row,
        carregamento: dynamicReward,
        qOperacional: operReward,
        esforcoCaptacao: captReward,
        protagonismo: protReward, // Sobrescreve com o dinâmico de Protagonismo
        total: currentTotal
      };
    }).sort((a, b) => b.total - a.total);
  }, [dynamicStatus]);

  const filteredLeaders = useMemo(() => {
    if (!searchTerm) return [];
    return finalLeaderboardData.filter(item =>
      item.lider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, finalLeaderboardData]);

  const podiumData = useMemo(() => {
    return finalLeaderboardData.slice(0, 3);
  }, [finalLeaderboardData]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-deluna-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">CARREGANDO DADOS DA CAMPANHA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto py-10 px-4 md:px-8 font-inter bg-[#F8FAFC] min-h-screen">

      {/* Header da Campanha */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-3">
          <span className="bg-deluna-primary text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Temporada Ativa</span>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Incentivo Operacional • Base 5</p>
        </div>
        <h1 className="text-deluna-primary text-4xl md:text-5xl font-black tracking-tighter uppercase">Campanha Acelera +30</h1>
        <p className="text-slate-500 text-lg font-semibold italic">
          Acompanhe aqui, quanto você já está faturando com essa campanha!
        </p>
      </div>

      {/* Pódio de Carregamento (Meta alcançada) */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-deluna-gold">payments</span>
          <h2 className="text-xl font-black text-deluna-primary uppercase tracking-tight">Top Faturamento Acumulado</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {podiumData.length >= 2 && <PodiumCard rank={2} data={podiumData[1]} color="bg-slate-300" border="border-slate-200" />}
          {podiumData.length >= 1 && <PodiumCard rank={1} data={podiumData[0]} color="bg-deluna-gold" border="border-deluna-gold/50" primary />}
          {podiumData.length >= 3 && <PodiumCard rank={3} data={podiumData[2]} color="bg-[#AD8A56]" border="border-[#AD8A56]/30" />}
        </div>
      </section>

      {/* Busca de Resultados */}
      <section className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-10 mb-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
        </div>

        <div className="max-w-2xl">
          <h3 className="text-deluna-primary text-2xl font-black uppercase mb-6">Consultar Meus Resultados</h3>
          <div className="relative group">
            <input
              type="text"
              placeholder="Digite seu nome para consultar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 border-slate-100 focus:border-deluna-accent focus:ring-0 transition-all text-lg font-bold text-deluna-primary placeholder:text-slate-300"
            />
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-deluna-accent text-2xl">search</span>
          </div>
        </div>

        {searchTerm && filteredLeaders.length > 0 ? (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredLeaders.map((leader, idx) => (
              <div key={idx} className="flex flex-col gap-6">
                {/* Mensagem Condicional */}
                <div className={`p-6 rounded-2xl flex items-center gap-4 border-l-8 ${dynamicStatus.get(leader.base)?.isAccess
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
                  }`}>
                  <span className="material-symbols-outlined text-3xl">
                    {dynamicStatus.get(leader.base)?.isAccess ? 'celebration' : 'warning'}
                  </span>
                  <p className="text-lg font-black uppercase tracking-tight">
                    {dynamicStatus.get(leader.base)?.isAccess
                      ? "Parabéns! Você está garantindo esse valor na sua conta virtual"
                      : "Olha quanto dinheiro você está perdendo! Corre! Ainda dá tempo"}
                  </p>
                </div>

                {/* Grid de Valores Detalhados */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <ValueCard
                    label="Meta 1"
                    value={dynamicStatus.get(leader.base)?.isAccess ? "ACESSO" : "FORA"}
                    sub="Acesso"
                    isText
                    statusColor={dynamicStatus.get(leader.base)?.isAccess ? 'text-green-600' : 'text-red-600'}
                  />
                  <ValueCard
                    label="Carregamento"
                    value={typeof dynamicStatus.get(leader.base)?.rewardValue === 'number'
                      ? formatCurrency(dynamicStatus.get(leader.base)!.rewardValue as number)
                      : dynamicStatus.get(leader.base)?.rewardValue as string}
                    sub="Pilar 1"
                  />
                  <ValueCard
                    label="Operativo"
                    value={typeof dynamicStatus.get(leader.base)?.operationalReward === 'number'
                      ? formatCurrency(dynamicStatus.get(leader.base)!.operationalReward as number)
                      : dynamicStatus.get(leader.base)?.operationalReward as string}
                    sub="Pilar 2"
                  />
                  <ValueCard
                    label="Captação"
                    value={typeof dynamicStatus.get(leader.base)?.captacaoReward === 'number'
                      ? formatCurrency(dynamicStatus.get(leader.base)!.captacaoReward as number)
                      : dynamicStatus.get(leader.base)?.captacaoReward as string}
                    sub="Pilar 3"
                  />
                  <ValueCard label="Perdas" value={formatCurrency(leader.controlePerdas)} sub="Pilar 4" />
                  <ValueCard
                    label="Protagonismo"
                    value={typeof dynamicStatus.get(leader.base)?.protagonismoReward === 'number'
                      ? formatCurrency(dynamicStatus.get(leader.base)!.protagonismoReward as number)
                      : dynamicStatus.get(leader.base)?.protagonismoReward as string}
                    sub="Pilar 5"
                  />
                </div>

                <div className="bg-deluna-primary p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center text-white mt-4 shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="size-20 rounded-full overflow-hidden border-4 border-white/20 bg-slate-800">
                      <img
                        src={getDirectImageLink(leader.avatar)}
                        alt={leader.lider}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${leader.lider}&background=random`)}
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-center md:text-left mb-4 md:mb-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Acumulado na Campanha</p>
                      <h4 className="text-4xl font-black font-manrope">{formatCurrency(leader.total)}</h4>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs font-bold text-[#95D5B2] uppercase">{leader.base} • {leader.localidade}</p>
                    <p className="text-xl font-black uppercase">{leader.lider}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="mt-10 py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">person_search</span>
            <p className="font-bold">Nenhum líder encontrado com esse nome.</p>
          </div>
        ) : (
          <div className="mt-10 py-20 text-center text-slate-300">
            <p className="font-black uppercase tracking-widest text-sm">Aguardando sua consulta...</p>
          </div>
        )}
      </section>

      {/* Tabela Geral */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-deluna-primary font-black uppercase text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">list_alt</span> Ranking Completo da Operação
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados Atualizada</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Base | Líder</th>
                <th className="px-6 py-4 text-center">Meta 1</th>
                <th className="px-6 py-4 text-center">Carr.</th>
                <th className="px-6 py-4 text-center">Oper.</th>
                <th className="px-6 py-4 text-center">Captação</th>
                <th className="px-6 py-4 text-center">Perdas</th>
                <th className="px-6 py-4 text-center">Protago.</th>
                <th className="px-6 py-4 text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {finalLeaderboardData.map((row, i) => (
                <tr key={`${row.base}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={getDirectImageLink(row.avatar)}
                          alt={row.lider}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${row.lider}&background=random`)}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-deluna-primary">{row.lider}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{row.base} - {row.localidade}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${dynamicStatus.get(row.base)?.isAccess
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                      {dynamicStatus.get(row.base)?.isAccess ? "Acesso a campanha" : "Fora do Jogo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-manrope font-bold">
                    {typeof dynamicStatus.get(row.base)?.rewardValue === 'number'
                      ? formatCurrency(dynamicStatus.get(row.base)!.rewardValue as number)
                      : dynamicStatus.get(row.base)?.rewardValue}
                  </td>
                  <td className="px-6 py-4 text-center font-manrope">
                    {typeof dynamicStatus.get(row.base)?.operationalReward === 'number'
                      ? formatCurrency(dynamicStatus.get(row.base)!.operationalReward as number)
                      : dynamicStatus.get(row.base)?.operationalReward}
                  </td>
                  <td className="px-6 py-4 text-center font-manrope">
                    {typeof dynamicStatus.get(row.base)?.captacaoReward === 'number'
                      ? formatCurrency(dynamicStatus.get(row.base)!.captacaoReward as number)
                      : dynamicStatus.get(row.base)?.captacaoReward}
                  </td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.controlePerdas)}</td>
                  <td className="px-6 py-4 text-center font-manrope">
                    {typeof dynamicStatus.get(row.base)?.protagonismoReward === 'number'
                      ? formatCurrency(dynamicStatus.get(row.base)!.protagonismoReward as number)
                      : dynamicStatus.get(row.base)?.protagonismoReward}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-deluna-primary font-manrope">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const PodiumCard: React.FC<{ rank: number; data: CampanhaRow; color: string; border: string; primary?: boolean }> = ({ rank, data, color, border, primary }) => (
  <div className={`bg-white rounded-[2rem] border-2 ${border} p-6 text-center shadow-xl transition-all hover:-translate-y-4 flex flex-col items-center group ${primary ? 'h-[420px] z-10 scale-105 md:scale-110' : 'h-[340px]'}`}>

    <div className="relative mb-6">
      <div className={`rounded-full overflow-hidden border-4 ${primary ? 'size-32 border-deluna-gold' : 'size-24 border-slate-200'} shadow-2xl bg-slate-100`}>
        <img
          src={getDirectImageLink(data.avatar)}
          alt={data.lider}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${data.lider}&background=random`)}
        />
      </div>
      <div className={`absolute -bottom-2 right-0 size-10 rounded-full flex items-center justify-center text-white font-black text-lg border-4 border-white shadow-lg ${color}`}>
        {rank}
      </div>
    </div>

    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.base}</p>
    <h4 className={`text-deluna-primary font-black uppercase tracking-tight mb-4 ${primary ? 'text-xl' : 'text-base'}`}>{data.lider}</h4>
    <p className="text-[10px] font-bold text-slate-400 italic mb-4">{data.localidade}</p>

    <div className={`flex flex-col gap-1 w-full p-4 rounded-2xl mt-auto ${primary ? 'bg-deluna-primary text-white' : 'bg-slate-50 text-deluna-primary'}`}>
      <p className={`text-[9px] font-black uppercase ${primary ? 'text-[#95D5B2]' : 'text-slate-400'}`}>Total Acumulado</p>
      <p className={`text-2xl font-black font-manrope`}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
      </p>
    </div>
  </div>
);

const ValueCard: React.FC<{ label: string; value: string; sub: string; isText?: boolean; statusColor?: string }> = ({ label, value, sub, isText, statusColor }) => (
  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col gap-1 transition-all hover:border-deluna-accent group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-sm font-black ${statusColor || 'text-deluna-primary'} ${isText ? 'uppercase' : 'font-manrope'}`}>{value}</p>
    <p className="text-[8px] font-bold text-slate-300 uppercase mt-auto group-hover:text-deluna-accent">{sub}</p>
  </div>
);

export default Leaderboard;
