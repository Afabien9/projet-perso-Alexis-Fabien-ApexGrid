// frontend/src/pages/LeaderboardPage.tsx

import React, { useEffect, useState } from "react";
import { authService } from "../services/api.js";

interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  driversLineUp: string[];
}

interface GrandPrixCalendar {
  round: string;
  name: string;
  location: string;
}

interface LeaderboardPageProps {
  onBack: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [calendar, setCalendar] = useState<GrandPrixCalendar[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("season"); // "season" ou numéro du round ("1", "2"...)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Chargement initial du calendrier pour alimenter le menu déroulant
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/calendar");
        if (res.ok) {
          const data = await res.json();
          setCalendar(data);
        }
      } catch (err) {
        console.error("Erreur chargement calendrier leaderboard :", err);
      }
    };
    fetchCalendar();
  }, []);

  // 2. Récupération des données du classement dès que le filtre change
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: LeaderboardEntry[] = [];

        if (selectedRound === "season") {
          // Appel de l'endpoint global (Cumul saison)
          data = await authService.getSeasonLeaderboard();
        } else {
          // Appel de l'endpoint spécifique filtré par round
          data = await authService.getRoundLeaderboard(selectedRound);
        }

        if (Array.isArray(data)) {
          setLeaderboard(data);
        } else {
          setLeaderboard([]);
        }
      } catch (err) {
        console.error("Erreur récupération leaderboard :", err);
        setError("Impossible de charger les scores de la ligue.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [selectedRound]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 md:p-12 font-sans">
      {/* RETOUR TECHNIQUE STYLE PADDOCK */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:border-red-600 hover:text-white transition-all cursor-pointer group skew-x-[-10deg]"
        >
          <span className="inline-block transform skew-x-[10deg]">
            ← RETOUR
          </span>
        </button>
      </div>

      {/* En-tête de page haut de gamme */}
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
            Classement{" "}
            <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">
              Général
            </span>
          </h1>
        </div>

        {/* Boutons d'activation rapides */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedRound("season")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border transition-all transform -skew-x-6 cursor-pointer ${
              selectedRound === "season"
                ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            🏆 Toute la saison
          </button>

          {/* Menu déroulant sélecteur de Grand Prix */}
          <div className="relative">
            <select
              value={selectedRound === "season" ? "" : selectedRound}
              onChange={(e) => {
                if (e.target.value) setSelectedRound(e.target.value);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-red-600 transition-colors cursor-pointer appearance-none pr-8"
            >
              <option value="" disabled>
                🏁 Par Grand Prix...
              </option>
              {calendar.map((gp) => (
                <option key={gp.round} value={gp.round}>
                  R{gp.round} — {gp.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </header>

      {/* Zone de notification d'erreur */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-center text-red-400 font-mono text-xs shadow-[0_0_20px_rgba(220,38,38,0.1)]">
          ⚠️ {error}
        </div>
      )}

      {/* Corps Principal : Tableau de classement technique */}
      <main className="max-w-6xl mx-auto bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
        {loading ? (
          /* Loader de télémétrie asynchrone */
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 italic animate-pulse">
              Synchronisation des scores de la ligue...
            </p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm font-mono text-slate-500 uppercase tracking-wider">
              Aucun score enregistré en base de données pour cette épreuve.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-900/80 bg-slate-900/40 text-[10px] font-mono text-slate-500 uppercase tracking-widest h-12">
                  <th className="pl-6 w-20">Rang</th>
                  <th>Manager / Joueur</th>
                  {selectedRound !== "season" && (
                    <th className="w-96">Line-up Actif</th>
                  )}
                  <th className="text-center w-28">Évolution</th>
                  <th className="text-right pr-8 w-40">Points Cumulés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 font-medium">
                {leaderboard.map((row) => (
                  <tr
                    key={row.username}
                    className="h-16 hover:bg-slate-900/30 transition-colors group"
                  >
                    <td className="pl-6 font-black font-mono italic text-lg text-slate-400 group-hover:text-white transition-colors">
                      #{row.rank}
                    </td>
                    <td className="text-base font-bold tracking-tight text-white group-hover:text-red-500 transition-colors">
                      {row.username}
                    </td>
                    {selectedRound !== "season" && (
                      <td>
                        <div className="flex items-center gap-1.5">
                          {row.driversLineUp && row.driversLineUp.length > 0 ? (
                            row.driversLineUp.map((driver) => (
                              <span
                                key={driver}
                                className="text-[9px] font-mono font-black px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded transform -skew-x-6 tracking-wide"
                              >
                                {driver.substring(0, 3).toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-mono italic text-slate-600">
                              Aucun alignement verrouillé
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="text-center">
                      {row.rank === 1 ? (
                        <span className="text-emerald-500 text-xs shadow-emerald-950 animate-pulse">
                          ▲
                        </span>
                      ) : row.rank % 2 === 0 ? (
                        <span className="text-red-500 text-xs">▼</span>
                      ) : (
                        <span className="text-emerald-500 text-xs">▲</span>
                      )}
                    </td>
                    <td className="text-right pr-8 font-mono font-black italic tracking-tight text-lg text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-all">
                      {row.points}{" "}
                      <span className="text-xs font-sans not-italic font-bold text-slate-500 uppercase tracking-wide ml-1">
                        Pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
