// frontend/src/pages/HistoryPage.tsx

import React, { useEffect, useState } from "react";
import { authService } from "../services/api.js";
import ScoreCard from "../components/fantasy/ScoreCard.js";
import { PointDetail } from "../types/ScoreDetail.js";

interface GrandPrixCalendar {
  round: string;
  name: string;
  circuit: string;
  date: string;
  location: string;
  trackImageUrl: string;
}

interface RoundScoreResponse {
  totalScore: number;
  driversDetails: PointDetail[];
}

interface HistoryPageProps {
  onNavigateToTeam: (roundNumber: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigateToTeam }) => {
  const [calendar, setCalendar] = useState<GrandPrixCalendar[]>([]);
  const [configuredRounds, setConfiguredRounds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedGP, setSelectedGP] = useState<GrandPrixCalendar | null>(null);
  const [roundScores, setRoundScores] = useState<RoundScoreResponse | null>(null);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);

  const LAST_SYNCED_ROUND = 5; 

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("apex_token");

      try {
        const resCalendar = await fetch("http://localhost:3000/api/calendar");
        if (resCalendar.ok) {
          const calendarData = await resCalendar.json();
          setCalendar(calendarData);
        } else {
          throw new Error("Erreur calendrier");
        }
      } catch (err) {
        console.error("Erreur récupération calendrier:", err);
        setError("Impossible de charger le calendrier des circuits.");
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const resRounds = await fetch("http://localhost:3000/my-teams-rounds", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          if (resRounds.ok) {
            const roundsData = await resRounds.json();
            if (Array.isArray(roundsData)) {
              const parsedRounds = roundsData.map(r => parseInt(r, 10)).filter(num => !isNaN(num));
              setConfiguredRounds(parsedRounds);
            }
          }
        } catch (err) {
          console.error("Erreur lors de la lecture des rounds configurés:", err);
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleGPClick = async (gp: GrandPrixCalendar) => {
    const roundInt = parseInt(gp.round, 10);

    if (roundInt <= LAST_SYNCED_ROUND) {
      setSelectedGP(gp);
      setLoadingModal(true);
      try {
        const scores = await authService.getUserRoundDetails(gp.round);
        setRoundScores(scores);
      } catch (err) {
        console.error(err);
        setRoundScores({ totalScore: 0, driversDetails: [] });
      } finally {
        setLoadingModal(false);
      }
    } else {
      onNavigateToTeam(gp.round);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-950 text-white">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-slate-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-red-600 border-r-red-600 rounded-full animate-spin" />
        </div>
        <p className="italic font-mono text-slate-500 text-xs uppercase tracking-widest animate-pulse">
          Calcul de la télémétrie de saison...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 text-white p-4 md:p-10 font-sans">
      <header className="mb-12 max-w-6xl mx-auto border-l-4 border-red-600 pl-5">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
          Suivi de Saison <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">Course par Course</span>
        </h1> 
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">// Archives de scores & Alignements futurs</p>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-center text-red-400 font-mono text-xs shadow-[0_0_20px_rgba(220,38,38,0.1)]">
          ⚠️ {error}
        </div>
      )}

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {calendar.map((item) => {
            const currentRoundInt = parseInt(item.round, 10);
            const isPassed = currentRoundInt <= LAST_SYNCED_ROUND;
            const isAlreadySelected = configuredRounds.includes(currentRoundInt);
            
            let cardStyle = "border-slate-800/80 hover:border-red-600 hover:shadow-[0_0_25px_rgba(220,38,38,0.15)]";
            let badgeStyle = "bg-slate-950 border-slate-800 text-red-500 group-hover:border-red-600";
            let badgeText = "🏁 RECAP POINTS";

            if (!isPassed) {
              if (isAlreadySelected) {
                cardStyle = "border-blue-500/50 hover:border-blue-400 bg-gradient-to-b from-blue-950/20 to-slate-900/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]";
                badgeStyle = "bg-blue-600 border-blue-500 text-white group-hover:bg-blue-500 font-black";
                badgeText = "🔹 LOCK ED";
              } else {
                cardStyle = "border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-b from-emerald-950/10 to-slate-900/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]";
                badgeStyle = "bg-emerald-500 border-emerald-400 text-slate-950 group-hover:bg-emerald-400 font-black";
                badgeText = "➕ ALIGNER";
              }
            }

            return (
              <div
                key={item.round}
                onClick={() => handleGPClick(item)}
                className={`group text-left relative bg-slate-900/40 border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm overflow-hidden cursor-pointer w-full ${cardStyle}`}
              >
                {/* En-tête de carte type Box de Télémétrie */}
                <div className="w-full flex justify-between items-start gap-4 border-b border-slate-800/60 pb-4 mb-4 relative z-10">
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block text-[9px] font-mono text-slate-500 font-black uppercase tracking-wider">
                      ROUND {item.round} — {item.date}
                    </span>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white group-hover:text-red-500 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium block">📍 {item.location}</span>
                  </div>

                  <div className={`whitespace-nowrap flex-shrink-0 px-2.5 py-1.5 rounded text-[9px] font-mono font-black tracking-widest uppercase transition-all skew-x-[-10deg] border ${badgeStyle}`}>
                    {badgeText}
                  </div>
                </div>

                {/* Encadré Circuit */}
                <div className="aspect-[21/9] w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800/40 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.01] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_4px)]" />
                  <img
                    src={item.trackImageUrl}
                    alt={`Circuit de ${item.name}`}
                    className="max-h-full max-w-full object-contain filter invert opacity-80"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL SCORES ULTRA-DYNAMIQUE */}
      {selectedGP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg transition-all duration-300">
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-[modalEnter_0.2s_ease-out]">
        <button 
              onClick={() => { setSelectedGP(null); setRoundScores(null); }}
              className="absolute top-0 right-0 p-6 z-50 text-slate-400 font-black text-xs uppercase tracking-wider transition-all cursor-pointer group select-none"
            >
              <div className="bg-slate-900 border border-slate-800 group-hover:border-red-600 group-hover:text-white rounded-lg px-4 py-2 skew-x-[-10deg] pointer-events-none">
                ✕ Fermer Window
              </div>
            </button>
            

            <div className="border-b-2 border-slate-900 pb-5 mb-8 relative">
              <div className="absolute bottom-0 left-0 w-16 h-[2px] bg-red-600" />
              <span className="text-[10px] font-mono text-red-500 font-black uppercase tracking-widest bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">Official Results Overview</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mt-2 text-white">{selectedGP.name}</h2>
              {roundScores && (
                <div className="mt-4 inline-flex items-center bg-red-600 text-white px-5 py-2 rounded-lg font-black italic tracking-tight shadow-lg shadow-red-950/50 transform -skew-x-6">
                  <span className="text-xs uppercase font-bold tracking-wider text-red-100 not-italic mr-2">Total Week-end : </span>
                  <span className="text-xl font-mono">{roundScores.totalScore} PTS</span>
                </div>
              )}
            </div>

            {loadingModal ? (
              <div className="py-24 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-mono uppercase tracking-widest text-slate-500 italic animate-pulse">Calcul de vos points Fantasy...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {roundScores?.driversDetails.map((detail) => (
                  <ScoreCard key={detail.nom} detail={detail} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};