
import React, { useState } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onMenuClick: () => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

// ----------------------------------------------------------------------
// COLOQUE O LINK DO SEU GOOGLE DRIVE AQUI DENTRO DAS ASPAS:
// Exemplo: "https://drive.google.com/file/d/123456789/view?usp=sharing"
const LOGO_URL = "https://drive.google.com/file/d/1VrxeUSRRimoxb8PF6_OqneEwoYwXlpf-/view?usp=drive_link";
// ----------------------------------------------------------------------

const Header: React.FC<HeaderProps> = ({
  currentView,
  onMenuClick,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}) => {
  const [imgError, setImgError] = useState(false);

  // Função para converter links de visualização do Drive em links diretos de imagem
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return '';

    // Suporte para links do Google Drive
    if (url.includes('drive.google.com')) {
      let id = '';
      if (url.includes('/file/d/')) {
        // Formato: https://drive.google.com/file/d/ID/view...
        id = url.split('/file/d/')[1].split('/')[0].split('?')[0];
      } else if (url.includes('id=')) {
        // Formato: https://drive.google.com/open?id=ID
        id = url.split('id=')[1].split('&')[0];
      }

      if (id) {
        // Usamos o endpoint de thumbnail com tamanho grande (sz=w1000) 
        // pois é mais resiliente a bloqueios de "aviso de vírus" do Drive
        return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
      }
    }
    return url;
  };

  const finalLogoUrl = React.useMemo(() => getOptimizedImageUrl(LOGO_URL), [LOGO_URL]);

  const getTitle = () => {
    switch (currentView) {
      case AppView.DELIVERY_SUCCESS: return <>Sucesso de Entrega <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Operação Global</span></>;
      case AppView.COMPARATIVO: return <>Cenários de Comparação DS <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Operação Global</span></>;
      case AppView.COMPARATIVO_ATS: return <>Comparativo de Volume ATs <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Operação Global</span></>;
      case AppView.QLP_MANAGEMENT: return <>Gestão de QLP <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Hub Operacional</span></>;
      case AppView.PROTAGONISMO: return <>Performance de Protagonismo <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Base 4</span></>;
      case AppView.LEADERBOARD: return <>Campanha Acelera 30+ <span className="hidden sm:inline text-[#64748B] font-light ml-1">/ Base 5</span></>;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-[#E2E8F0] px-4 md:px-10 py-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center h-10 w-10 border border-[#E2E8F0] rounded-lg text-deluna-primary"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="flex items-center border-r border-slate-200 pr-4 mr-2">
          <div className="h-12 min-w-[160px] px-3 flex items-center justify-center overflow-hidden">

            {/* Lógica: Se tiver URL e não tiver dado erro, tenta mostrar imagem. Senão, mostra Fallback. */}
            {finalLogoUrl && !imgError ? (
              <img
                src={finalLogoUrl}
                alt="Deluna Logo"
                className="h-full w-auto object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              // Fallback Elegante (Logo CSS) - Ajustado para fundo claro
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-deluna-primary text-[24px]">local_shipping</span>
                <div className="flex flex-col">
                  <span className="text-deluna-primary font-black text-sm leading-none tracking-tighter uppercase">Deluna</span>
                  <span className="text-deluna-accent font-bold text-[8px] leading-none tracking-widest uppercase mt-0.5">Logistics</span>
                </div>
              </div>
            )}

          </div>
        </div>

        <h2 className="text-base md:text-xl font-extrabold text-deluna-primary tracking-tight truncate max-w-[200px] md:max-w-none">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-deluna-primary outline-none focus:ring-0 border-none cursor-pointer p-0"
            />
          </div>
          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-deluna-primary outline-none focus:ring-0 border-none cursor-pointer p-0"
            />
          </div>
        </div>
        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-2"></div>
        <button className="flex items-center justify-center rounded-lg h-9 w-9 md:h-10 md:w-10 border border-[#E2E8F0] text-deluna-primary hover:bg-[#F8FAFC]">
          <span className="material-symbols-outlined text-[18px] md:text-[20px]">notifications</span>
        </button>
        <button className="flex items-center justify-center rounded-lg h-9 w-9 md:h-10 md:w-10 border border-[#E2E8F0] text-deluna-primary hover:bg-[#F8FAFC]">
          <span className="material-symbols-outlined text-[18px] md:text-[20px]">settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
