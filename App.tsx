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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DELIVERY_SUCCESS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verificação inicial de autenticação
  useEffect(() => {
    const savedEmail = localStorage.getItem('deluna_user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('deluna_user_email');
    setUserEmail(null);
    setIsAuthenticated(false);
  };

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
      case AppView.PNR_STUCK:
        return <PNRStuck startDate={startDate} endDate={endDate} />;
      default:
        return <DeliverySuccess />;
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Fecha a sidebar no mobile após navegar
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-deluna-primary border-t-transparent rounded-full animate-spin"></div>
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
