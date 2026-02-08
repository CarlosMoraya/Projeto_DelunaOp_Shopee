
import React, { useState } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DeliverySuccess from './pages/DeliverySuccess';
import QLPManagement from './pages/QLPManagement';
import Protagonismo from './pages/Protagonismo';
import Leaderboard from './pages/Leaderboard';
import Comparativo from './pages/Comparativo';
import ComparativoATs from './pages/ComparativoATs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DELIVERY_SUCCESS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados globais de data
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case AppView.DELIVERY_SUCCESS:
        return <DeliverySuccess startDate={startDate} endDate={endDate} />;
      case AppView.COMPARATIVO:
        return <Comparativo startDate={startDate} endDate={endDate} />;
      case AppView.COMPARATIVO_ATS:
        return <ComparativoATs startDate={startDate} endDate={endDate} />;
      case AppView.QLP_MANAGEMENT:
        return <QLPManagement />;
      case AppView.PROTAGONISMO:
        return <Protagonismo />;
      case AppView.LEADERBOARD:
        return <Leaderboard startDate={startDate} endDate={endDate} />;
      default:
        return <DeliverySuccess />;
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Fecha a sidebar no mobile após navegar
  };

  return (
    <div className="flex h-screen overflow-hidden font-display">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC]">
        <Header
          currentView={currentView}
          onMenuClick={toggleSidebar}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
        <div className="flex-1">
          {renderView()}
        </div>
      </main>

      {/* Overlay para fechar sidebar no mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
