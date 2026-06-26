import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { io } from "socket.io-client";

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

const MainLayout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socket.on("sync-completed", (data) => {
      alert(`🔔 ${data.message}`);
    });
    return () => {
      socket.disconnect();
    };
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
  const handleLogout = () => { authService.logout(); window.location.href = "/"; };

  const NavButton = ({ to, label, emoji }: { to: string; label: string; emoji: string }) => (
    <button onClick={() => { navigate(to); setIsOpen(false); }} className="w-full text-left font-bold uppercase text-xs p-3 rounded-lg border border-slate-800 hover:bg-slate-800">
      {emoji} {label}
    </button>
  );

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans relative overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-5 left-5 z-50 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-red-600 transition-all">
        <div className="w-6 h-5 flex flex-col justify-between items-center">
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "rotate-45 translate-y-2 bg-red-600" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-white transition-all ${isOpen ? "-rotate-45 -translate-y-2 bg-red-600" : ""}`} />
        </div>
      </button>

      <div className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 border-r border-slate-800 z-40 pt-24 px-6 transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="flex flex-col gap-3">
          <NavButton to="/dashboard" label="Accueil" emoji="🏠" />
          <NavButton to="/wiki" label="Wiki F1" emoji="📚" />
          <NavButton to="/calendar" label="Calendrier" emoji="📅" />
          <NavButton to="/history" label="Fantasy League" emoji="📜" />
          <NavButton to="/leaderboard" label="Classement" emoji="🏆" />
          <NavButton to="/contact" label="Contact" emoji="📩" />
          {userRole === "admin" && <NavButton to="/admin" label="Admin" emoji="⚙️" />}
          <button onClick={handleLogout} className="mt-10 w-full text-left font-bold text-xs p-3 text-red-500 border rounded-lg border-red-900/40 hover:bg-red-950/20">🚪 Déconnexion</button>
        </nav>
      </div>

      <div className="w-full pt-12">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/calendar" element={<GrandPrixSelector onSelectRound={(r) => navigate(`/results/${r}`)} onBack={() => navigate("/dashboard")} />} />
          <Route path="/results/:round" element={<RaceResultsWrapper />} />
          <Route path="/history" element={<HistoryPage onNavigateToTeam={(r) => navigate(`/team/${r}`)} onBack={() => navigate("/dashboard")} />} />
          <Route path="/team/:round" element={<MyTeamPageWrapper />} />
          <Route path="/wiki" element={<WikiPage onSelectDriver={(id) => navigate(`/wiki/${id}`)} />} />
          <Route path="/wiki/:driverId" element={<DriverDetailsWrapper />} />
          <Route path="/leaderboard" element={<LeaderboardPage onBack={() => navigate("/dashboard")} />} />
          <Route path="/leaderboard/:round" element={<LeaderboardPageWrapper />} />
          <Route path="/contact" element={<ContactPage onBack={() => navigate("/dashboard")} />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </div>
  );
};

const RaceResultsWrapper = () => { const { round } = useParams(); const navigate = useNavigate(); return <RaceResults initialRound={round!} onBack={() => navigate("/calendar")} />; };
const MyTeamPageWrapper = () => { const { round } = useParams(); const navigate = useNavigate(); return <MyTeamPage targetRound={round} onBack={() => navigate("/history")} />; };
const DriverDetailsWrapper = () => { const { driverId } = useParams(); const navigate = useNavigate(); return <DriverDetails driverId={driverId!} onBack={() => navigate("/wiki")} />; };
const LeaderboardPageWrapper = () => { const { round } = useParams(); const navigate = useNavigate(); return <LeaderboardPage onBack={() => navigate("/leaderboard")} />; };

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={localStorage.getItem("apex_token") ? <MainLayout /> : <AuthPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
