
import React, { useState, useMemo } from 'react';

type ComparisonContext = 'day' | 'week' | 'month';

interface RowDataAt {
  base: string;
  local: string;
  lider: string;
  qlp: number;
  med: number;
  max: number;
  prevVal: number; // Volume total de ATs
  currVal: number; // Volume total de ATs
  trend: 'up' | 'down';
}

const DATA_SET_ATS: Record<ComparisonContext, { prevLabel: string, currLabel: string, data: RowDataAt[] }> = {
  day: {
    prevLabel: 'Ontem',
    currLabel: 'Hoje',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 1240, currVal: 1350, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 890, currVal: 940, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 1100, currVal: 1050, trend: 'down' },
    ]
  },
  week: {
    prevLabel: 'Semana 1',
    currLabel: 'Semana 2',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 8400, currVal: 9100, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 6200, currVal: 6500, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 7800, currVal: 7950, trend: 'up' },
    ]
  },
  month: {
    prevLabel: 'Dezembro',
    currLabel: 'Janeiro',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 34500, currVal: 38200, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 22100, currVal: 24500, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 28900, currVal: 31200, trend: 'up' },
      { base: 'LRJ08', local: 'São Gonçalo', lider: 'Larissa', qlp: 15, med: 2, max: 4, prevVal: 45000, currVal: 42300, trend: 'down' },
      { base: 'LES09', local: 'Viana', lider: 'Cristiane', qlp: 3, med: 1, max: 3, prevVal: 12000, currVal: 15600, trend: 'up' },
      { base: 'LRJ12', local: 'Nova Iguaçu', lider: 'Patrick', qlp: 35, med: 9, max: 16, prevVal: 85000, currVal: 92400, trend: 'up' },
      { base: 'LRJ04', local: 'Campo G', lider: 'Andreia', qlp: 33, med: 14, max: 27, prevVal: 78900, currVal: 81200, trend: 'up' },
      { base: 'LRJ23', local: 'São Gonçalo 2', lider: 'Rafael', qlp: 11, med: 3, max: 6, prevVal: 25600, currVal: 28400, trend: 'up' },
      { base: 'LRJ07', local: 'São Cristóvão', lider: 'Thais', qlp: 17, med: 3, max: 6, prevVal: 31200, currVal: 34500, trend: 'up' },
      { base: 'LBA14', local: 'Camaçari', lider: 'Lucineide', qlp: 13, med: 4, max: 6, prevVal: 28400, currVal: 29100, trend: 'up' },
    ]
  }
};

const COORD_DATA_SET_ATS: Record<ComparisonContext, RowDataAt[]> = {
  day: [{ base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 4500, currVal: 4800, trend: 'up' }],
  week: [{ base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 28400, currVal: 31200, trend: 'up' }],
  month: [
    { base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 124500, currVal: 135800, trend: 'up' },
    { base: 'Rafael', local: '', lider: '', qlp: 0, med: 8, max: 15, prevVal: 45600, currVal: 48900, trend: 'up' },
    { base: 'Elaine', local: '', lider: '', qlp: 0, med: 20, max: 33, prevVal: 89400, currVal: 92100, trend: 'up' },
  ]
};

const ComparativoATs: React.FC = () => {
  const [context] = useState<ComparisonContext>('month');

  const currentView = useMemo(() => DATA_SET_ATS[context], [context]);
  const currentCoords = useMemo(() => COORD_DATA_SET_ATS[context], [context]);

  const totals = useMemo(() => {
    return currentView.data.reduce((acc, curr) => ({
      qlp: acc.qlp + curr.qlp,
      med: acc.med + curr.med,
      max: acc.max + curr.max,
      prev: acc.prev + curr.prevVal,
      curr: acc.curr + curr.currVal,
    }), { qlp: 0, med: 0, max: 0, prev: 0, curr: 0 });
  }, [currentView]);

  const formatNum = (val: number) => val.toLocaleString('pt-BR');

  const calcVarPercent = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  return (
    <div className="p-10 font-inter bg-[#F8FAFC] min-h-screen flex flex-col gap-10">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-deluna-primary uppercase tracking-tighter">
          Comparativo de Volume de ATs
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Exibindo comparativo de volume total de <span className="text-deluna-primary font-bold uppercase">{currentView.prevLabel}</span> vs <span className="text-deluna-primary font-bold uppercase">{currentView.currLabel}</span>.
        </p>
      </div>

      {/* Tabela de Hubs */}
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-deluna-primary text-white text-[11px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-5 border-r border-white/10">BASE | DS</th>
                <th className="px-6 py-5 border-r border-white/10">Localidade</th>
                <th className="px-6 py-5 border-r border-white/10">Líder</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">QLP</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Méd</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Máx</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.prevLabel} (ATs)</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.currLabel} (ATs)</th>
                <th className="px-6 py-5 text-center bg-black min-w-[130px]">Var %</th>
                <th className="px-6 py-5 text-center">Trend (W4)</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {currentView.data.map((row, i) => {
                const variance = calcVarPercent(row.currVal, row.prevVal);
                return (
                  <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                    <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100">{row.base}</td>
                    <td className="px-6 py-4 italic font-bold text-slate-500 border-r border-slate-100">{row.local}</td>
                    <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.lider}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.qlp || '-'}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.med || '-'}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.max || '-'}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-black">
                      {formatNum(row.prevVal)}
                    </td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-black">
                      {formatNum(row.currVal)}
                    </td>
                    <td className="px-6 py-4 text-center bg-slate-50/80 font-black">
                      <div className="flex items-center justify-center gap-2">
                        <span className={variance >= 0 ? 'text-slate-800' : 'text-red-600'}>
                          {variance.toFixed(1).replace('.', ',')}%
                        </span>
                        <span className={`material-symbols-outlined text-[16px] ${variance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {variance >= 0 ? 'change_history' : 'stat_minus_1'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center h-5">
                        <SimpleSparkline trend={row.trend} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Rodapé Totalizador */}
              <tr className="bg-white border-t-2 border-slate-900 font-black text-deluna-primary">
                <td colSpan={3} className="px-6 py-5 italic text-right border-r border-slate-100 uppercase tracking-widest text-[11px]">Total Volume ATs</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.qlp || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.med || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.max || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100 font-black">{formatNum(totals.prev)}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100 font-black">{formatNum(totals.curr)}</td>
                <td className="px-6 py-5 text-center bg-slate-100">
                  <div className="flex items-center justify-center gap-2">
                    {(() => {
                        const totalVar = calcVarPercent(totals.curr, totals.prev);
                        return (
                          <>
                            <span className={totalVar >= 0 ? 'text-deluna-primary' : 'text-red-600'}>
                                {totalVar.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className={`material-symbols-outlined text-[16px] ${totalVar >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {totalVar >= 0 ? 'change_history' : 'stat_minus_1'}
                            </span>
                          </>
                        );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-5"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Coordenadores */}
      <div className="max-w-5xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-deluna-primary text-white text-[11px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-5 border-r border-white/10 min-w-[200px]">COORD | DS</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Cap. Méd</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Máx</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.prevLabel} (ATs)</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.currLabel} (ATs)</th>
                <th className="px-6 py-5 text-center bg-black">Var %</th>
                <th className="px-6 py-5 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-bold text-slate-700 italic">
              {currentCoords.map((row, i) => {
                const variance = calcVarPercent(row.currVal, row.prevVal);
                return (
                  <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100`}>
                    <td className="px-6 py-4 text-deluna-primary border-r border-slate-100 font-black">{row.base}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100">{row.med}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100">{row.max}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100">{formatNum(row.prevVal)}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100">{formatNum(row.currVal)}</td>
                    <td className="px-6 py-4 text-center bg-slate-50/80">
                      <div className="flex items-center justify-center gap-2 font-black text-slate-800">
                        <span>{variance.toFixed(1).replace('.', ',')}%</span>
                        <span className="material-symbols-outlined text-[16px] text-green-700">change_history</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center h-5">
                        <SimpleSparkline trend={row.trend} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SimpleSparkline: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => (
  <svg width="70" height="24" viewBox="0 0 70 24" preserveAspectRatio="none" className="overflow-visible">
    {trend === 'up' ? (
      <path 
        d="M0 22 L14 18 L28 20 L42 14 L56 12 L70 4" 
        fill="none" 
        stroke="#1B4332" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    ) : (
      <path 
        d="M0 4 L14 8 L28 6 L42 16 L56 18 L70 22" 
        fill="none" 
        stroke="#BC4749" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    )}
  </svg>
);

export default ComparativoATs;
