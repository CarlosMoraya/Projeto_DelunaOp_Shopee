
import React, { useState, useEffect, useMemo } from 'react';
import { ProtagonismoRow } from '../types';
import { fetchProtagonismoData } from '../services/api';

const getDirectImageLink = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : null;
    if (id) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w200`;
    }
  }
  return url;
};

const Protagonismo: React.FC = () => {
  const [allData, setAllData] = useState<ProtagonismoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<string>('Todos');

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProtagonismoData();
      setAllData(res);
    } catch (err: any) {
      console.error('Erro ao carregar Protagonismo:', err);
      setError(err.message || 'Falha ao carregar dados de protagonismo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const coordinators = useMemo(() => {
    const coords = new Set(allData.map(item => item.coord).filter(c => c && c !== 'undefined'));
    return ['Todos', ...Array.from(coords).sort()];
  }, [allData]);

  const filteredData = useMemo(() => {
    return selectedCoord === 'Todos'
      ? allData
      : allData.filter(item => item.coord === selectedCoord);
  }, [allData, selectedCoord]);

  const podiumData = useMemo(() => {
    return [...filteredData]
      .filter(item => item.resultado > 0)
      .sort((a, b) => b.resultado - a.resultado)
      .slice(0, 3);
  }, [filteredData]);

  return (
    <div className="p-4 md:p-10 flex flex-col gap-10 font-inter bg-[#F8FAFC] min-h-screen">

      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-deluna-primary uppercase tracking-tighter flex items-center gap-4">
            Performance de Protagonismo
            <button
              onClick={() => loadData(true)}
              className="bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              title="Atualizar Dados"
            >
              <span className={`material-symbols-outlined text-sm text-slate-400 ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Avaliação mensal de excelência por Base e Liderança.</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtrar por Coordenador</label>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto max-w-full md:max-w-md">
            {coordinators.map(coord => (
              <button
                key={coord}
                onClick={() => setSelectedCoord(coord)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${selectedCoord === coord
                  ? 'bg-deluna-primary text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {coord}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-deluna-primary/20 border-t-deluna-primary rounded-full animate-spin"></div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs tracking-[0.2em]">Consolidando Notas de Protagonismo...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-red-100 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-red-500">cloud_off</span>
          <div className="text-center">
            <p className="font-black text-red-600 uppercase text-sm mb-1">Erro na Integração</p>
            <p className="text-slate-500 text-xs">{error}</p>
          </div>
          <button onClick={() => loadData(true)} className="mt-4 px-8 py-2 bg-deluna-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-deluna-primary/20">Tentar Novamente</button>
        </div>
      ) : (
        <>
          {/* Pódio de Líderes */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-deluna-gold scale-125">military_tech</span>
              <h2 className="text-xl font-black text-deluna-primary uppercase tracking-tight">Pódio de Elite (Meta 1+)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {podiumData.length > 1 && (
                <PodiumCard
                  rank={2}
                  lider={podiumData[1].lider}
                  base={podiumData[1].base}
                  score={podiumData[1].resultado}
                  avatar={podiumData[1].avatar}
                  color="bg-slate-300"
                />
              )}
              {podiumData.length > 0 && (
                <PodiumCard
                  rank={1}
                  lider={podiumData[0].lider}
                  base={podiumData[0].base}
                  score={podiumData[0].resultado}
                  avatar={podiumData[0].avatar}
                  color="bg-deluna-gold"
                  primary
                />
              )}
              {podiumData.length > 2 && (
                <PodiumCard
                  rank={3}
                  lider={podiumData[2].lider}
                  base={podiumData[2].base}
                  score={podiumData[2].resultado}
                  avatar={podiumData[2].avatar}
                  color="bg-[#AD8A56]"
                />
              )}
              {podiumData.length === 0 && (
                <div className="col-span-3 py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="material-symbols-outlined text-4xl">sentiment_dissatisfied</span>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-widest">Pódio Vazio</p>
                    <p className="text-[10px] font-medium italic">Nenhum líder recebeu avaliações positivas no filtro selecionado.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Tabela de Dados Simplificada */}
          <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-deluna-primary text-white text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="px-6 py-6 border-r border-white/10 uppercase">Bases</th>
                    <th className="px-6 py-6 border-r border-white/10 uppercase">Localidade</th>
                    <th className="px-6 py-6 border-r border-white/10 uppercase">Líder Atual</th>
                    <th className="px-6 py-6 border-r border-white/10 uppercase">Sup / Coord</th>
                    <th className="px-6 py-6 text-center uppercase tracking-[0.2em] bg-deluna-primary/90">Resultado</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-medium text-slate-700">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">Nenhuma base cadastrada para este coordenador.</td>
                    </tr>
                  ) : (
                    filteredData.map((row, i) => (
                      <tr key={`${row.base}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                        <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100 uppercase">{row.base}</td>
                        <td className="px-6 py-4 font-bold text-slate-400 border-r border-slate-100 italic">{row.localidade}</td>
                        <td className="px-6 py-4 border-r border-slate-100 uppercase tracking-tight">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                              <img
                                src={getDirectImageLink(row.avatar || '')}
                                alt={row.lider}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${row.lider}&background=random`)}
                              />
                            </div>
                            <span className="font-semibold">{row.lider}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium border-r border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">{row.coord}</td>
                        <td className={`px-6 py-4 text-center font-black text-base ${(row as any)._debug_count > 0 ? 'bg-slate-100/50 text-deluna-primary' : 'bg-slate-50/30 text-slate-300'}`}>
                          {row.resultado.toFixed(1)}
                          {(row as any)._debug_count > 0 && (
                            <span className="block text-[8px] opacity-30 font-normal">{(row as any)._debug_count} avaliações</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Seção de Blog / Orientações */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <p className="text-deluna-accent text-[10px] font-black uppercase tracking-[0.4em] mb-2 leading-none">Qualidade Operacional</p>
          <h2 className="text-3xl font-black text-deluna-primary uppercase tracking-tight">Orientações Estratégicas</h2>
          <div className="h-1.5 w-16 bg-deluna-accent mt-4 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <TipCard
            title="Matinais Diárias"
            desc="Faça matinais com seu time todas as manhãs para alinhar metas e corrigir falhas do dia anterior."
            icon="sunny"
          />
          <TipCard
            title="Parceria Shopee"
            desc="Se aproxime do analista Shopee. A sinergia com o cliente é a chave para o sucesso operacional."
            icon="handshake"
          />
          <TipCard
            title="Comunicação Instantânea"
            desc="Se faça presente nos grupos de WhatsApp do cliente. Respostas rápidas evitam ruídos."
            icon="chat"
          />
          <TipCard
            title="Monitoramento Ativo"
            desc="Seja ativo nos grupos de monitoramento de sua base para antecipar problemas em tempo real."
            icon="visibility"
          />
        </div>
      </section>
    </div>
  );
};

const PodiumCard: React.FC<{ rank: number; lider: string; base: string; score: number; color: string; avatar?: string; primary?: boolean }> =
  ({ rank, lider, base, score, color, avatar, primary }) => (
    <div className={`flex flex-col items-center p-8 rounded-3xl border border-slate-100 bg-white shadow-xl transition-all hover:scale-105 group ${primary ? 'md:-mb-4 z-10 border-deluna-gold/20' : 'h-[360px]'}`}>
      <div className="relative mb-6">
        <div className={`rounded-full overflow-hidden border-4 ${primary ? 'size-24 border-deluna-gold' : 'size-20 border-slate-100'} shadow-xl bg-slate-50`}>
          <img
            src={getDirectImageLink(avatar || '')}
            alt={lider}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${lider}&background=random`)}
          />
        </div>
        <div className={`absolute -bottom-2 -right-2 size-9 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${color}`}>
          {rank}
        </div>
      </div>
      <div className="text-center flex-1">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{base}</p>
        <h3 className={`font-black text-deluna-primary uppercase ${primary ? 'text-2xl' : 'text-xl'}`}>{lider}</h3>
        <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Resultado Final</p>
          <p className={`text-4xl font-black tracking-tighter ${primary ? 'text-deluna-gold' : 'text-deluna-primary opacity-80'}`}>{score.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );

const TipCard: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-deluna-accent/30 hover:shadow-xl hover:shadow-deluna-accent/5 transition-all group overflow-hidden relative">
    <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-deluna-accent mb-6 group-hover:bg-deluna-accent group-hover:text-white transition-all shadow-sm">
      <span className="material-symbols-outlined text-3xl select-none">{icon}</span>
    </div>
    <h4 className="font-black text-deluna-primary uppercase text-sm mb-4 tracking-tight leading-tight">{title}</h4>
    <p className="text-slate-500 text-xs leading-relaxed font-medium">{desc}</p>
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      <span className="material-symbols-outlined text-6xl scale-150 rotate-12">{icon}</span>
    </div>
  </div>
);

export default Protagonismo;
