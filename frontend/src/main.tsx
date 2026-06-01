import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthPage from './pages/AuthPage.js';
import { RaceResults } from './pages/RaceResults';
import { GrandPrixSelector } from './pages/GrandPrixSelector';
import { HistoryPage } from './pages/HistoryPage';
import { Dashboard } from './pages/Dashboard'; 
import { MyTeamPage } from './pages/MyTeamPage';
import { LeaderboardPage } from './pages/LeaderboardPage'; // Ajout de l'import
import { authService } from './services/api';
import './index.css';

// Extension du type pour y inclure le classement général
type ActiveView = 'dashboard' | 'team' | 'results' | 'calendar' | 'history' | 'leaderboard';

const MainLayout = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRound, setSelectedRound] = useState<string>('1');
  const [activeTargetRound, setActiveTargetRound] = useState<string | undefined>(undefined);
  const [returnToView, setReturnToView] = useState<'calendar' | 'history' | 'dashboard' | 'leaderboard'>('dashboard');

  const handleSelectRoundFromCalendar = (roundNumber: string) => {
    setSelectedRound(roundNumber);
    setReturnToView('calendar');
    setCurrentView('results'); 
  };

  const handleNavigateToTeamWithContext = (roundNumber: string) => {
    setActiveTargetRound(roundNumber);
    setReturnToView('history');
    setCurrentView('team');
  };

  const handleDirectDashboardNavigate = (view: ActiveView) => {
    setReturnToView('dashboard');
    setCurrentView(view);
  };

  const handleLogout = () => {
    authService.logout(); 
    window.location.reload(); 
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans relative overflow-x-hidden">
      
      {/* BOUTON BURGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-5 left-5 z-50 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-red-600 transition-all focus:outline-none shadow-lg shadow-black/50"
        aria-label="Menu de navigation"
      >
        <div className="w-6 h-5 flex flex-col justify-between items-center relative">
          <span className={`h-0.5 w-6 bg-white rounded transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2 bg-red-600' : ''}`} />
          <span className={`h-0.5 w-6 bg-white rounded transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-white rounded transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2 bg-red-600' : ''}`} />
        </div>
      </button>

      {/* PANNEAU DU MENU LATÉRAL */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-40 pt-24 px-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="mb-8 border-b border-slate-800 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Navigation</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">ApexGrid Hub</p>
          </div>

          <nav className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setActiveTargetRound(undefined);
                setIsOpen(false);
              }}
              className={`w-full text-left font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-lg border transition-all ${
                currentView === 'dashboard'
                  ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              🏠 Accueil Dashboard
            </button>

            <button
              onClick={() => {
                setCurrentView('team');
                setActiveTargetRound(undefined);
                setIsOpen(false);
              }}
              className={`w-full text-left font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-lg border transition-all ${
                currentView === 'team'
                  ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              🏁 Mon Écurie
            </button>

            <button
              onClick={() => {
                setCurrentView('calendar');
                setActiveTargetRound(undefined);
                setIsOpen(false);
              }}
              className={`w-full text-left font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-lg border transition-all ${
                currentView === 'calendar'
                  ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              📅 Calendrier GP
            </button>

            <button
              onClick={() => {
                setCurrentView('history');
                setIsOpen(false);
              }}
              className={`w-full text-left font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-lg border transition-all ${
                currentView === 'history'
                  ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              📜 Mon Historique
            </button>

            {/* AJOUT DE L'ONGLET CLASSEMENT GÉNÉRAL */}
            <button
              onClick={() => {
                setCurrentView('leaderboard');
                setIsOpen(false);
              }}
              className={`w-full text-left font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-lg border transition-all ${
                currentView === 'leaderboard'
                  ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              🏆 Classement Général
            </button>
          </nav>
        </div>

        {/* SECTION FOOTER DU MENU AVEC BOUTON DÉCONNEXION */}
        <div className="mb-6 border-t border-slate-800 pt-4 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full text-center font-bold uppercase tracking-wider text-xs px-4 py-3 bg-red-950/20 hover:bg-red-600 border border-red-900/40 hover:border-red-600 text-red-400 hover:text-white rounded-lg transition-all shadow-lg shadow-black/30"
          >
            🚪 Déconnexion
          </button>
          <div className="opacity-20 text-center">
            <p className="text-[8px] uppercase font-bold tracking-widest text-slate-400">Engine v3.0 // 2026</p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
        />
      )}

      {/* ZONE DE CONTENU PRINCIPAL */}
      <div className="w-full pt-12">
        {currentView === 'dashboard' && (
          <Dashboard onNavigate={handleDirectDashboardNavigate} />
        )}
        {currentView === 'team' && (
          <MyTeamPage 
            targetRound={activeTargetRound} 
            onBack={() => setCurrentView(returnToView)}
          />
        )}
        {currentView === 'calendar' && (
          <GrandPrixSelector onSelectRound={handleSelectRoundFromCalendar} />
        )}
        {currentView === 'results' && (
          <RaceResults 
            initialRound={selectedRound} 
            onBack={() => setCurrentView(returnToView)}
          />
        )}
        {currentView === 'history' && (
          <HistoryPage onNavigateToTeam={handleNavigateToTeamWithContext} />
        )}
        {/* INTERPOLATION DE LA VUE LEADERBOARD */}
        {currentView === 'leaderboard' && (
          <LeaderboardPage />
        )}
      </div>
    </div>
  );
};

const token = localStorage.getItem("apex_token");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {token ? <MainLayout /> : <AuthPage />}
  </React.StrictMode>,
);