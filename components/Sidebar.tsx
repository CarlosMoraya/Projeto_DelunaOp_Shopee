
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: AppView.DELIVERY_SUCCESS, icon: 'dashboard', label: 'Delivery Success' },
    { id: AppView.COMPARATIVO, icon: 'compare_arrows', label: 'Comparativo DS' },
    { id: AppView.COMPARATIVO_ATS, icon: 'bar_chart', label: 'Comparativo ATs' },
    { id: AppView.QLP_MANAGEMENT, icon: 'analytics', label: 'QLP Atual' },
    { id: AppView.PROTAGONISMO, icon: 'military_tech', label: 'Protagonismo' },
    { id: AppView.PNR_STUCK, icon: 'error_outline', label: 'PNR & Stuck' },
    { id: AppView.LEADERBOARD, icon: 'format_list_numbered', label: 'Campanha Acelera +30' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-deluna-primary flex flex-col justify-between py-8 transform transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-white">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-sm font-black leading-tight uppercase tracking-tighter">Operação Shopee</h1>
              <p className="text-[#95D5B2] text-[8px] font-semibold tracking-widest uppercase">Excellence Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded text-sm transition-all text-left ${currentView === item.id
                ? 'bg-white/10 text-white border-l-4 border-deluna-accent'
                : 'text-[#95D5B2] hover:bg-white/5 hover:text-white'
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className={currentView === item.id ? 'font-semibold' : 'font-medium'}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-deluna-accent"
            style={{ backgroundImage: `url('https://picsum.photos/seed/admin/100/100')` }}
          ></div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-bold truncate text-white">Admin Deluna</p>
            <p className="text-[10px] text-[#95D5B2] font-medium uppercase tracking-wider">Base Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
