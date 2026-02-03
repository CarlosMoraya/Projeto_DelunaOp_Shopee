
import React, { useState, useMemo } from 'react';

interface ProtagonismoRow {
  base: string;
  localidade: string;
  lider: string;
  coord: string;
  resultado: number;
}

const DATA: ProtagonismoRow[] = [
  { base: 'LES03', localidade: 'Serra', lider: 'Caique', coord: 'Tainá', resultado: 3 },
  { base: 'LES09', localidade: 'Viana', lider: 'Cristiane', coord: 'Tainá', resultado: 3 },
  { base: 'LRJ01', localidade: 'São João do Meriti', lider: 'Edimilson', coord: 'Tainá', resultado: 3 },
  { base: 'LRJ04', localidade: 'Campo G', lider: 'Andreia', coord: 'Tainá', resultado: 3 },
  { base: 'LRJ07', localidade: 'São Cristóvão', lider: 'Thais', coord: 'Tainá', resultado: 3 },
  { base: 'LRJ12', localidade: 'Nova Iguaçu', lider: 'Patrick', coord: 'Tainá', resultado: 3 },
  { base: 'LRJ14', localidade: 'Duque de Caxias', lider: 'Edimilson', coord: 'Tainá', resultado: 3 },
  { base: 'LBA14', localidade: 'Camaçari', lider: 'Lucineide', coord: 'Rafael', resultado: 3 },
  { base: 'LBA17', localidade: 'Simões Filho', lider: 'Luiza', coord: 'Rafael', resultado: 3 },
  { base: 'LBA18', localidade: 'Salvador', lider: 'Adriana', coord: 'Rafael', resultado: 3 },
  { base: 'LBA19', localidade: 'Salvador', lider: 'Luiza', coord: 'Rafael', resultado: 3 },
  { base: 'LRJ02', localidade: 'Nova Friburgo', lider: 'Cristiane', coord: 'Elaine', resultado: 3 },
  { base: 'LRJ05', localidade: 'Macaé', lider: 'Rafael', coord: 'Elaine', resultado: 3 },
  { base: 'LRJ08', localidade: 'São Gonçalo', lider: 'Kaio', coord: 'Elaine', resultado: 3 },
  { base: 'LRJ15', localidade: 'Magé', lider: 'Poliana', coord: 'Elaine', resultado: 3 },
  { base: 'LRJ21', localidade: 'Cabo Frio', lider: 'Eduardo', coord: 'Elaine', resultado: 3 },
  { base: 'LRJ23', localidade: 'São Gonçalo 2', lider: 'Iago', coord: 'Elaine', resultado: 3 },
];

const Protagonismo: React.FC = () => {
  const [selectedCoord, setSelectedCoord] = useState<string>('Todos');

  const filteredData = useMemo(() => {
    return selectedCoord === 'Todos' 
      ? DATA 
      : DATA.filter(item => item.coord === selectedCoord);
  }, [selectedCoord]);

  const podiumData = useMemo(() => {
    return [...filteredData]
      .filter(item => item.resultado >= 1)
      .sort((a, b) => b.resultado - a.resultado)
      .slice(0, 3);
  }, [filteredData]);

  const coordinators = ['Todos', 'Tainá', 'Rafael', 'Elaine'];

  return (
    <div className="p-4 md:p-10 flex flex-col gap-10 font-inter bg-[#F8FAFC] min-h-screen">
      
      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-deluna-primary uppercase tracking-tighter">Performance de Protagonismo</h1>
          <p className="text-sm text-slate-500 font-medium">Avaliação mensal de excelência por Base e Liderança.</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtrar por Coordenador</label>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
            {coordinators.map(coord => (
              <button
                key={coord}
                onClick={() => setSelectedCoord(coord)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                  selectedCoord === coord 
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

      {/* Pódio de Líderes */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-deluna-gold">military_tech</span>
          <h2 className="text-xl font-black text-deluna-primary uppercase tracking-tight">Pódio de Elite (Meta 1+)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {podiumData.length > 1 && (
            <PodiumCard 
              rank={2} 
              lider={podiumData[1].lider} 
              base={podiumData[1].base} 
              score={podiumData[1].resultado} 
              color="bg-slate-300"
            />
          )}
          {podiumData.length > 0 && (
            <PodiumCard 
              rank={1} 
              lider={podiumData[0].lider} 
              base={podiumData[0].base} 
              score={podiumData[0].resultado} 
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
              color="bg-[#AD8A56]"
            />
          )}
          {podiumData.length === 0 && (
            <div className="col-span-3 py-10 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
              <p className="font-bold text-sm">Nenhum líder atingiu a Meta 1 no período selecionado.</p>
            </div>
          )}
        </div>
      </section>

      {/* Tabela de Dados Simplificada */}
      <section className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-deluna-primary text-white text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-5 border-r border-white/10">Bases</th>
                <th className="px-6 py-5 border-r border-white/10">Localidade</th>
                <th className="px-6 py-5 border-r border-white/10">Líder Atual</th>
                <th className="px-6 py-5 border-r border-white/10">Sup / Coord</th>
                <th className="px-6 py-5 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {filteredData.map((row, i) => (
                <tr key={`${row.base}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                  <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100 uppercase">{row.base}</td>
                  <td className="px-6 py-4 font-bold text-slate-500 border-r border-slate-100 italic">{row.localidade}</td>
                  <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.lider}</td>
                  <td className="px-6 py-4 font-medium border-r border-slate-100">{row.coord}</td>
                  <td className="px-6 py-4 text-center font-black bg-slate-100/50">{row.resultado.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seção de Blog / Orientações */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <p className="text-deluna-accent text-xs font-black uppercase tracking-[0.3em] mb-3">Qualidade Operacional</p>
          <h2 className="text-2xl font-black text-deluna-primary uppercase">Orientações Estratégicas</h2>
          <div className="h-1.5 w-12 bg-deluna-accent mt-4 mx-auto rounded-full"></div>
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

const PodiumCard: React.FC<{ rank: number; lider: string; base: string; score: number; color: string; primary?: boolean }> = 
({ rank, lider, base, score, color, primary }) => (
  <div className={`flex flex-col items-center p-6 rounded-2xl border border-slate-200 bg-white transition-all hover:scale-105 ${primary ? 'shadow-2xl h-[280px] z-10 border-deluna-gold/30' : 'shadow-md h-[240px]'}`}>
    <div className={`size-12 rounded-full flex items-center justify-center text-white font-black text-xl mb-4 ${color}`}>
      {rank}
    </div>
    <div className="text-center flex-1">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{base}</p>
      <h3 className={`font-black text-deluna-primary ${primary ? 'text-xl' : 'text-lg'}`}>{lider}</h3>
      <div className="mt-4 flex flex-col items-center">
        <p className="text-xs font-bold text-slate-500 uppercase">Resultado Final</p>
        <p className={`text-4xl font-black ${primary ? 'text-deluna-gold' : 'text-deluna-primary'}`}>{score.toFixed(1)}</p>
      </div>
    </div>
  </div>
);

const TipCard: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-deluna-accent transition-all group overflow-hidden">
    <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-deluna-accent mb-4 group-hover:bg-deluna-accent group-hover:text-white transition-all">
      <span className="material-symbols-outlined text-2xl select-none">{icon}</span>
    </div>
    <h4 className="font-black text-deluna-primary uppercase text-sm mb-3 tracking-tight">{title}</h4>
    <p className="text-slate-500 text-xs leading-relaxed font-medium">{desc}</p>
  </div>
);

export default Protagonismo;
