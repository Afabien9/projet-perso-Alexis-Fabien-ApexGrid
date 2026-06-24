import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";

// Pages & Components
import AuthPage from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { GrandPrixSelector } from "./pages/GrandPrixSelector";
import { RaceResults } from "./pages/RaceResults";
import { HistoryPage } from "./pages/HistoryPage";
import { MyTeamPage } from "./pages/MyTeamPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { WikiPage } from "./pages/WikiPage";
import { DriverDetails } from "./pages/DriverDetails";
import { AdminPanel } from "./pages/AdminPanel";
import { ContactPage } from "./pages/ContactPage";

import { authService } from "./services/api";
import "./index.css";

type ActiveView =
  | "dashboard"
  | "results"
  | "calendar"
  | "history"
  | "leaderboard"
  | "wiki"
  | "contact"
  | "admin";

const MainLayout = () => {
  const [currentView, setCurrentView] = useState<ActiveView>("dashboard");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRound, setSelectedRound] = useState<string>("1");
  const [activeTargetRound, setActiveTargetRound] = useState<string | undefined>(undefined);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socket.on("sync-completed", (data) => {
      alert(`🔔 ${data.message}`);
    });
    return () => { socket.disconnect(); };
  }, []);

  const getUserRole = () => {
    const token = localStorage.getItem("apex_token");
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const payload = JSON.parse(window.atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
      return payload.role;
    } catch { return null; }
  };

  const userRole = getUserRole();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans relative overflow-hidden">
      {/* Bouton Burger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-5 left-5 z-50 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-red-600 transition-all"
      >
        <div className="w-6 h-5 flex flex-col justify-between items-center">
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "rotate-45 translate-y-2 bg-red-600" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "-rotate-45 -translate-y-2 bg-red-600" : ""}`} />
        </div>
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 border-r border-slate-800 z-40 pt-24 px-6 transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="flex flex-col gap-3">
          <button onClick={() => { setCurrentView("dashboard"); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">🏠 Accueil</button>
          <button onClick={() => { setCurrentView("wiki"); setSelectedDriverId(null); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">📚 Wiki F1</button>
          <button onClick={() => { setCurrentView("calendar"); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">📅 Calendrier</button>
          <button onClick={() => { setCurrentView("history"); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">📜 Historique</button>
          <button onClick={() => { setCurrentView("leaderboard"); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">🏆 Classement</button>
          <button onClick={() => { setCurrentView("contact"); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">📩 Contact</button>

          {userRole === "admin" && (
            <button onClick={() => { setCurrentView("admin"); setIsOpen(false); }} className="w-full text-left font-bold text-xs p-3 rounded-lg border border-amber-900 text-amber-500 hover:bg-amber-900/20">⚙️ Admin</button>
          )}

          <button onClick={handleLogout} className="mt-10 w-full text-left font-bold text-xs p-3 text-red-500 border border-red-900/40 hover:bg-red-950/20">🚪 Déconnexion</button>
        </nav>
      </div>

      {/* Contenu Principal */}
      <div className="w-full pt-12">
        {currentView === "dashboard" && <Dashboard onNavigate={(v) => setCurrentView(v)} />}
        
        {currentView === "calendar" && (
          <GrandPrixSelector 
            onSelectRound={(r) => { setSelectedRound(r); setCurrentView("results"); }} 
            onBack={() => setCurrentView("dashboard")} 
          />
        )}
        
        {currentView === "results" && (
          <RaceResults initialRound={selectedRound} onBack={() => setCurrentView("calendar")} />
        )}
        
        {currentView === "history" && (
          <HistoryPage 
            onNavigateToTeam={(round) => {
              setActiveTargetRound(round);
              setCurrentView("team");
            }}
            onBack={() => setCurrentView("dashboard")} 
          />
        )}

        {/* Note: 'team' view is accessed via 'history' */}
        {currentView === "team" && (
          <MyTeamPage 
            targetRound={activeTargetRound} 
            onBack={() => setCurrentView("history")} 
          />
        )}

        {currentView === "wiki" && selectedDriverId === null && <WikiPage onSelectDriver={setSelectedDriverId} />}
        {currentView === "wiki" && selectedDriverId !== null && <DriverDetails driverId={selectedDriverId} onBack={() => setSelectedDriverId(null)} />}
        
        {currentView === "leaderboard" && <LeaderboardPage onBack={() => setCurrentView("dashboard")} />}
        {currentView === "contact" && <ContactPage onBack={() => setCurrentView("dashboard")} />}


        {currentView === "admin" && <AdminPanel />}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={localStorage.getItem("apex_token") ? <MainLayout /> : <AuthPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);