
import React, { useState } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onMenuClick: () => void;
}

// ----------------------------------------------------------------------
// COLOQUE O LINK DO SEU GOOGLE DRIVE AQUI DENTRO DAS ASPAS:
// Exemplo: "https://drive.google.com/file/d/123456789/view?usp=sharing"
const LOGO_URL = ""; 
// ----------------------------------------------------------------------

const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick }) => {
  const [imgError, setImgError] = useState(false);

  // Função para converter links de visualização do Drive em links diretos de imagem
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com') && url.includes('/file/d/')) {
      const id = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
    return url;
  };

  const finalLogoUrl = getOptimizedImageUrl(LOGO_URL);

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
        
        {/* Logo Container - Dark Brand Box */}
        <div className="flex items-center border-r border-slate-200 pr-4 mr-2">
           <div className="bg-deluna-primary h-12 min-w-[120px] px-3 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
             
             {/* Lógica: Se tiver URL e não tiver dado erro, tenta mostrar imagem. Senão, mostra Fallback. */}
             {finalLogoUrl && !imgError ? (
               <img 
                 src={finalLogoUrl} 
                 alt="Deluna Logo" 
                 className="h-full w-auto object-contain"
                 onError={() => setImgError(true)}
               />
             ) : (
               // Fallback Elegante (Logo CSS)
               <div className="flex items-center gap-2 animate-in fade-in duration-300">
                 <span className="material-symbols-outlined text-white text-[24px]">local_shipping</span>
                 <div className="flex flex-col">
                   <span className="text-white font-black text-sm leading-none tracking-tighter uppercase">Deluna</span>
                   <span className="text-[#95D5B2] font-bold text-[8px] leading-none tracking-widest uppercase mt-0.5">Logistics</span>
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
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <span className="material-symbols-outlined text-deluna-primary text-lg">calendar_month</span>
          <span className="text-xs font-bold text-deluna-primary">Janeiro 2025</span>
          <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
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
