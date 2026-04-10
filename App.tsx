import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DeliverySuccess from './pages/DeliverySuccess';
import QLPManagement from './pages/QLPManagement';
import Protagonismo from './pages/Protagonismo';
import Leaderboard from './pages/Leaderboard';
import Comparativo from './pages/Comparativo';
import ComparativoATs from './pages/ComparativoATs';
import PNRStuck from './pages/PNRStuck';
import Login from './pages/Login';
import VirtualBank from './pages/VirtualBank';
import Monitoramento from './pages/Monitoramento';
import CapacityManagement from './pages/CapacityManagement';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DELIVERY_SUCCESS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('deluna_user_email');
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('deluna_user_email'));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('deluna_user_name'));
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Verificação de nome de usuário (caso falte no cache)
  useEffect(() => {
    if (isAuthenticated && !userName && userEmail) {
      import('./services/api').then(({ fetchAccessData }) => {
        fetchAccessData().then(accessData => {
          const match = accessData.find(item => item.email === userEmail.toLowerCase().trim());
          if (match && match.user) {
            setUserName(match.user);
            localStorage.setItem('deluna_user_name', match.user);
          }
        });
      });
    }
  }, [isAuthenticated, userEmail, userName]);

  const handleLoginSuccess = (email: string, name: string) => {
    setUserEmail(email);
    setUserName(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('deluna_user_email');
    localStorage.removeItem('deluna_user_name');
    setUserEmail(null);
    setUserName(null);
    setIsAuthenticated(false);
  };

  // Estados globais de data
  const [isSyncingDate, setIsSyncingDate] = useState(() => {
    const cached = sessionStorage.getItem('deluna_sync_end_date');
    const cachedVersion = sessionStorage.getItem('deluna_data_version');
    return !(cached && cachedVersion === 'v6');
  });

  const [startDate, setStartDate] = useState(() => {
    const cached = sessionStorage.getItem('deluna_sync_end_date');
    const cachedVersion = sessionStorage.getItem('deluna_data_version');
    return (cached && cachedVersion === 'v6') ? cached : '';
  });
  const [endDate, setEndDate] = useState(() => {
    const cached = sessionStorage.getItem('deluna_sync_end_date');
    const cachedVersion = sessionStorage.getItem('deluna_data_version');
    return (cached && cachedVersion === 'v6') ? cached : '';
  });

  // Sincronização definitiva: Busca a data mais recente e define um período completo
  const syncDatesWithLatestData = async () => {
    // Previne múltiplas chamadas
    const syncLock = sessionStorage.getItem('deluna_sync_lock');
    if (syncLock === 'true') {
      setIsSyncingDate(false);
      return;
    }

    try {
      // Define lock para evitar loop
      sessionStorage.setItem('deluna_sync_lock', 'true');

      const { fetchDeliveryData } = await import('./services/api');
      const data = await fetchDeliveryData();

      if (data && data.length > 0) {
        // Dados já vêm ordenados por data decrescente (mais recente primeiro)
        const latestDate = data[0].date;
        const oldestDate = data[data.length - 1].date;

        if (latestDate) {
          // Define o período completo (da data mais antiga à mais recente)
          setStartDate(oldestDate);
          setEndDate(latestDate);
          sessionStorage.setItem('deluna_sync_end_date', latestDate);
          sessionStorage.setItem('deluna_data_version', 'v6');
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar datas:", err);
    } finally {
      // Remove o lock e finaliza a sincronização
      sessionStorage.removeItem('deluna_sync_lock');
      setIsSyncingDate(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSyncingDate) {
      syncDatesWithLatestData();
    }
  }, [isAuthenticated, isSyncingDate]);

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
      case AppView.PNR_STUCK:
        return <PNRStuck startDate={startDate} endDate={endDate} />;
      case AppView.BANCO_VIRTUAL:
        return <VirtualBank startDate={startDate} endDate={endDate} />;
      case AppView.MONITORAMENTO:
        return <Monitoramento />;
      case AppView.CAPACITY_MANAGEMENT:
        return <CapacityManagement startDate={startDate} endDate={endDate} />;
      default:
        return <DeliverySuccess />;
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Fecha a sidebar no mobile após navegar
  };

  if (checkingAuth || (isAuthenticated && isSyncingDate)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-deluna-primary border-t-transparent rounded-full animate-spin"></div>
          {isSyncingDate && <p className="text-sm text-slate-500 font-medium animate-pulse">Sincronizando dados mais recentes...</p>}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden font-display">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userEmail={userEmail}
        userName={userName}
        onLogout={handleLogout}
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
