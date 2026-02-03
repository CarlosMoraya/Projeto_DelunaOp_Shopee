
import React, { useMemo } from 'react';

interface QLPRow {
  base: string;
  lider: string;
  ativos: number;
  inativos: number;
  categoria: 'Pequena' | 'Média' | 'Grande';
  meta1: number;
  meta2: number;
  meta3: number;
  qlpAtual: number;
  resultadoMeta: number;
}

const QLP_DATA: QLPRow[] = [
  { base: 'LRJ01', lider: 'Edimilson', ativos: 6, inativos: 50, categoria: 'Pequena', meta1: 8, meta2: 10, meta3: 12, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ14', lider: 'Edimilson', ativos: 3, inativos: 28, categoria: 'Pequena', meta1: 4, meta2: 5, meta3: 6, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ08', lider: 'Kaio', ativos: 15, inativos: 108, categoria: 'Média', meta1: 18, meta2: 23, meta3: 27, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LES09', lider: 'Cristiane', ativos: 3, inativos: 65, categoria: 'Pequena', meta1: 4, meta2: 5, meta3: 6, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LES03', lider: 'Caique', ativos: 7, inativos: 39, categoria: 'Pequena', meta1: 9, meta2: 11, meta3: 14, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ12', lider: 'Patrick', ativos: 35, inativos: 121, categoria: 'Grande', meta1: 39, meta2: 46, meta3: 56, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ07', lider: 'Nilton', ativos: 17, inativos: 121, categoria: 'Média', meta1: 20, meta2: 26, meta3: 31, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ05', lider: 'Rafael', ativos: 13, inativos: 40, categoria: 'Média', meta1: 16, meta2: 20, meta3: 23, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ23', lider: 'Iago', ativos: 11, inativos: 26, categoria: 'Média', meta1: 13, meta2: 17, meta3: 29, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ21', lider: 'Eduardo', ativos: 29, inativos: 91, categoria: 'Grande', meta1: 32, meta2: 28, meta3: 46, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LBA14', lider: 'Lucineide', ativos: 13, inativos: 23, categoria: 'Média', meta1: 16, meta2: 20, meta3: 23, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ04', lider: 'Andreia', ativos: 33, inativos: 174, categoria: 'Grande', meta1: 36, meta2: 43, meta3: 53, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LBA18', lider: 'Adriana', ativos: 6, inativos: 78, categoria: 'Pequena', meta1: 8, meta2: 10, meta3: 12, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ15', lider: 'Poliana', ativos: 13, inativos: 53, categoria: 'Média', meta1: 16, meta2: 20, meta3: 23, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LRJ02', lider: 'Cristiane', ativos: 9, inativos: 33, categoria: 'Pequena', meta1: 12, meta2: 14, meta3: 18, qlpAtual: 100, resultadoMeta: 3 },
  { base: 'LBA17', lider: 'Luiza', ativos: 10, inativos: 35, categoria: 'Média', meta1: 12, meta2: 15, meta3: 18, qlpAtual: 100, resultadoMeta: 3 },
];

const QLPManagement: React.FC = () => {
  const totals = useMemo(() => {
    return QLP_DATA.reduce((acc, curr) => ({
      ativos: acc.ativos + curr.ativos,
      inativos: acc.inativos + curr.inativos,
      meta1: acc.meta1 + curr.meta1,
      meta2: acc.meta2 + curr.meta2,
      meta3: acc.meta3 + curr.meta3,
    }), { ativos: 0, inativos: 0, meta1: 0, meta2: 0, meta3: 0 });
  }, []);

  const totalMotoristas = totals.ativos + totals.inativos;

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 font-inter bg-[#F8FAFC] min-h-screen">
      
      {/* Visões Gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard 
          title="Total de Motoristas" 
          value={totalMotoristas.toLocaleString('pt-BR')} 
          icon="groups" 
          color="text-deluna-primary"
          bg="bg-slate-100"
        />
        <SummaryCard 
          title="Motoristas Ativos" 
          value={totals.ativos.toLocaleString('pt-BR')} 
          icon="person_check" 
          color="text-green-600"
          bg="bg-green-50"
          sub={`${((totals.ativos / totalMotoristas) * 100).toFixed(1)}% do total`}
        />
        <SummaryCard 
          title="Motoristas Inativos" 
          value={totals.inativos.toLocaleString('pt-BR')} 
          icon="person_off" 
          color="text-red-600"
          bg="bg-red-50"
          sub={`${((totals.inativos / totalMotoristas) * 100).toFixed(1)}% do total`}
        />
      </div>

      {/* Tabela Principal */}
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-deluna-primary text-white text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-5 border-r border-white/10">BASE | QLP</th>
                <th className="px-6 py-5 border-r border-white/10">Líder</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Ativos</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Inativos</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Categoria</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Meta 1</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Meta 2</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Meta 3</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">QLP Atual</th>
                <th className="px-6 py-5 text-center">Resultado Meta</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {QLP_DATA.map((row, i) => (
                <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                  <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100 uppercase">{row.base}</td>
                  <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.lider}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.ativos}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-bold text-slate-400">{row.inativos}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 italic">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      row.categoria === 'Grande' ? 'bg-indigo-100 text-indigo-700' :
                      row.categoria === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.meta1}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.meta2}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.meta3}</td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-black text-deluna-primary">{row.qlpAtual}</td>
                  <td className="px-6 py-4 text-center font-black bg-slate-100/50">{row.resultadoMeta}</td>
                </tr>
              ))}
              {/* Rodapé Totalizador */}
              <tr className="bg-deluna-primary text-white font-black">
                <td colSpan={2} className="px-6 py-5 text-right uppercase tracking-widest text-[11px]">Total Geral</td>
                <td className="px-6 py-5 text-center">{totals.ativos}</td>
                <td className="px-6 py-5 text-center">{totals.inativos}</td>
                <td className="px-6 py-5 text-center italic text-[10px]">GRANDE</td>
                <td className="px-6 py-5 text-center">{totals.meta1}</td>
                <td className="px-6 py-5 text-center">{totals.meta2}</td>
                <td className="px-6 py-5 text-center">{totals.meta3}</td>
                <td colSpan={2} className="px-6 py-5"></td>
              </tr>
            </tbody>
          </table>
        </div>
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
