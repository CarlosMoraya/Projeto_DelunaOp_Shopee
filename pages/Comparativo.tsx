
import React, { useState, useMemo } from 'react';

type ComparisonContext = 'day' | 'week' | 'month';

interface RowData {
  base: string;
  local: string;
  lider: string;
  qlp: number;
  med: number;
  max: number;
  prevVal: number;
  currVal: number;
  trend: 'up' | 'down';
}

const DATA_SET: Record<ComparisonContext, { prevLabel: string, currLabel: string, data: RowData[] }> = {
  day: {
    prevLabel: 'Ontem',
    currLabel: 'Hoje',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 98.10, currVal: 99.20, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 96.50, currVal: 97.80, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 99.00, currVal: 98.40, trend: 'down' },
    ]
  },
  week: {
    prevLabel: 'Semana 1',
    currLabel: 'Semana 2',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 97.45, currVal: 98.90, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 96.20, currVal: 97.50, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 98.10, currVal: 99.05, trend: 'up' },
    ]
  },
  month: {
    prevLabel: 'Dezembro',
    currLabel: 'Janeiro',
    data: [
      { base: 'LRJ01', local: 'São João do Meriti', lider: 'Edimilson', qlp: 6, med: 2, max: 2, prevVal: 98.37, currVal: 99.55, trend: 'up' },
      { base: 'LRJ14', local: 'Duque de Caxias', lider: 'Edimilson', qlp: 3, med: 2, max: 4, prevVal: 97.63, currVal: 99.25, trend: 'up' },
      { base: 'LES03', local: 'Serra', lider: 'Caique', qlp: 7, med: 1, max: 2, prevVal: 98.79, currVal: 99.18, trend: 'up' },
      { base: 'LRJ08', local: 'São Gonçalo', lider: 'Larissa', qlp: 15, med: 2, max: 4, prevVal: 97.35, currVal: 98.30, trend: 'up' },
      { base: 'LES09', local: 'Viana', lider: 'Cristiane', qlp: 3, med: 1, max: 3, prevVal: 94.00, currVal: 99.30, trend: 'up' },
      { base: 'LRJ12', local: 'Nova Iguaçu', lider: 'Patrick', qlp: 35, med: 9, max: 16, prevVal: 98.71, currVal: 97.49, trend: 'down' },
      { base: 'LRJ04', local: 'Campo G', lider: 'Andreia', qlp: 33, med: 14, max: 27, prevVal: 96.74, currVal: 97.23, trend: 'up' },
      { base: 'LRJ23', local: 'São Gonçalo 2', lider: 'Rafael', qlp: 11, med: 3, max: 6, prevVal: 96.36, currVal: 98.03, trend: 'up' },
      { base: 'LRJ07', local: 'São Cristóvão', lider: 'Thais', qlp: 17, med: 3, max: 6, prevVal: 96.94, currVal: 97.50, trend: 'up' },
      { base: 'LBA14', local: 'Camaçari', lider: 'Lucineide', qlp: 13, med: 4, max: 6, prevVal: 97.24, currVal: 98.11, trend: 'up' },
    ]
  }
};

const COORD_DATA_SET: Record<ComparisonContext, RowData[]> = {
  day: [{ base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 98.1, currVal: 98.5, trend: 'up' }],
  week: [{ base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 97.5, currVal: 98.2, trend: 'up' }],
  month: [
    { base: 'Tainá', local: '', lider: '', qlp: 0, med: 30, max: 56, prevVal: 97.34, currVal: 97.78, trend: 'up' },
    { base: 'Rafael', local: '', lider: '', qlp: 0, med: 8, max: 15, prevVal: 95.88, currVal: 97.39, trend: 'up' },
    { base: 'Elaine', local: '', lider: '', qlp: 0, med: 20, max: 33, prevVal: 95.88, currVal: 96.57, trend: 'up' },
  ]
};

const Comparativo: React.FC = () => {
  const [context] = useState<ComparisonContext>('month');

  const currentView = useMemo(() => DATA_SET[context], [context]);
  const currentCoords = useMemo(() => COORD_DATA_SET[context], [context]);

  const totals = useMemo(() => {
    const sum = currentView.data.reduce((acc, curr) => ({
      qlp: acc.qlp + curr.qlp,
      med: acc.med + curr.med,
      max: acc.max + curr.max,
      prev: acc.prev + curr.prevVal,
      curr: acc.curr + curr.currVal,
    }), { qlp: 0, med: 0, max: 0, prev: 0, curr: 0 });

    const avgPrev = sum.prev / currentView.data.length;
    const avgCurr = sum.curr / currentView.data.length;

    return { ...sum, avgPrev, avgCurr };
  }, [currentView]);

  return (
    <div className="p-4 md:p-10 font-inter bg-[#F8FAFC] min-h-screen flex flex-col gap-6 md:gap-10">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-3xl font-black text-deluna-primary uppercase tracking-tighter">
          Cenários de Comparação Operacional
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Exibindo comparativo automático de <span className="text-deluna-primary font-bold uppercase">{currentView.prevLabel}</span> vs <span className="text-deluna-primary font-bold uppercase">{currentView.currLabel}</span>.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-deluna-primary text-white text-[11px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-5 border-r border-white/10">BASE | DS</th>
                <th className="px-6 py-5 border-r border-white/10">Localidade</th>
                <th className="px-6 py-5 border-r border-white/10">Líder</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">QLP</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Méd</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">Carr. Máx</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.prevLabel}</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">{currentView.currLabel}</th>
                <th className="px-6 py-5 text-center bg-black min-w-[130px]">Var %</th>
                <th className="px-6 py-5 text-center">Trend (W4)</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium text-slate-700">
              {currentView.data.map((row, i) => {
                const variance = row.prevVal > 0 ? row.currVal - row.prevVal : row.currVal;
                return (
                  <tr key={row.base} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-deluna-primary/5 transition-colors`}>
                    <td className="px-6 py-4 font-black text-deluna-primary border-r border-slate-100">{row.base}</td>
                    <td className="px-6 py-4 italic font-bold text-slate-500 border-r border-slate-100">{row.local}</td>
                    <td className="px-6 py-4 font-semibold border-r border-slate-100">{row.lider}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.qlp || '-'}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.med || '-'}</td>
                    <td className="px-6 py-4 text-center border-r border-slate-100 font-bold">{row.max || '-'}</td>
                    <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.prevVal > 0 && row.prevVal < 98 ? 'text-red-500' : ''}`}>
                      {row.prevVal > 0 ? `${row.prevVal.toFixed(2).replace('.', ',')}%` : '-'}
                    </td>
                    <td className={`px-6 py-4 text-center border-r border-slate-100 font-black ${row.currVal < 98 ? 'text-red-500' : ''}`}>
                      {row.currVal.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="px-6 py-4 text-center bg-slate-50/80 font-black">
                      <div className="flex items-center justify-center gap-2">
                        <span className={variance >= 0 ? 'text-slate-800' : 'text-red-600'}>
                          {variance.toFixed(2).replace('.', ',')}%
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
              <tr className="bg-white border-t-2 border-slate-900 font-black text-deluna-primary text-[10px] md:text-[12px]">
                <td colSpan={3} className="px-6 py-5 italic text-right border-r border-slate-100 uppercase tracking-widest">Total Geral</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.qlp || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.med || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100">{totals.max || '-'}</td>
                <td className="px-6 py-5 text-center border-r border-slate-100 text-red-500">{totals.avgPrev.toFixed(2).replace('.', ',')}%</td>
                <td className="px-6 py-5 text-center border-r border-slate-100 text-red-500">{totals.avgCurr.toFixed(2).replace('.', ',')}%</td>
                <td className="px-6 py-5 text-center bg-slate-100">
                  <div className="flex items-center justify-center gap-2">
                    <span className={(totals.avgCurr - totals.avgPrev) >= 0 ? 'text-deluna-primary' : 'text-red-600'}>
                      {(totals.avgCurr - totals.avgPrev).toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5"></td>
              </tr>
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
      <path d="M0 22 L14 18 L28 20 L42 14 L56 12 L70 4" fill="none" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M0 4 L14 8 L28 6 L42 16 L56 18 L70 22" fill="none" stroke="#BC4749" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

export default Comparativo;
