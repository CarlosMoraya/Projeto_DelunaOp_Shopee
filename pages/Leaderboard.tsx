
import React, { useState, useMemo } from 'react';

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

const Leaderboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeaders = useMemo(() => {
    if (!searchTerm) return [];
    return CAMPANHA_DATA.filter(item =>
      item.lider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const podiumData = useMemo(() => {
    return [...CAMPANHA_DATA]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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
                <div className={`p-6 rounded-2xl flex items-center gap-4 border-l-8 ${leader.regraAcesso
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
                  }`}>
                  <span className="material-symbols-outlined text-3xl">
                    {leader.regraAcesso ? 'celebration' : 'warning'}
                  </span>
                  <p className="text-lg font-black uppercase tracking-tight">
                    {leader.regraAcesso
                      ? "Parabéns! Você está garantindo esse valor na sua conta virtual"
                      : "Olha quanto dinheiro você está perdendo! Corre! Ainda dá tempo"}
                  </p>
                </div>

                {/* Grid de Valores Detalhados */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <ValueCard label="Regra" value={leader.regraAcesso || "SEM META"} sub="Acesso" isText />
                  <ValueCard label="Carregamento" value={formatCurrency(leader.carregamento)} sub="Pilar 1" />
                  <ValueCard label="Q. Operacional" value={formatCurrency(leader.qOperacional)} sub="Pilar 2" />
                  <ValueCard label="Captação" value={formatCurrency(leader.esforcoCaptacao)} sub="Pilar 3" />
                  <ValueCard label="Perdas" value={formatCurrency(leader.controlePerdas)} sub="Pilar 4" />
                  <ValueCard label="Protagonismo" value={formatCurrency(leader.protagonismo)} sub="Pilar 5" />
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
                <th className="px-6 py-4 text-center">Regra</th>
                <th className="px-6 py-4 text-center">Carr.</th>
                <th className="px-6 py-4 text-center">Oper.</th>
                <th className="px-6 py-4 text-center">Captação</th>
                <th className="px-6 py-4 text-center">Perdas</th>
                <th className="px-6 py-4 text-center">Protago.</th>
                <th className="px-6 py-4 text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {CAMPANHA_DATA.sort((a, b) => b.total - a.total).map((row, i) => (
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
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${row.regraAcesso === 'META3' ? 'bg-green-100 text-green-700' :
                      row.regraAcesso === 'META2' ? 'bg-blue-100 text-blue-700' :
                        row.regraAcesso === 'META1' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                      {row.regraAcesso || "SEM META"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.carregamento)}</td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.qOperacional)}</td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.esforcoCaptacao)}</td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.controlePerdas)}</td>
                  <td className="px-6 py-4 text-center font-manrope">{formatCurrency(row.protagonismo)}</td>
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

const ValueCard: React.FC<{ label: string; value: string; sub: string; isText?: boolean }> = ({ label, value, sub, isText }) => (
  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col gap-1 transition-all hover:border-deluna-accent group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-sm font-black text-deluna-primary ${isText ? 'uppercase' : 'font-manrope'}`}>{value}</p>
    <p className="text-[8px] font-bold text-slate-300 uppercase mt-auto group-hover:text-deluna-accent">{sub}</p>
  </div>
);

export default Leaderboard;
