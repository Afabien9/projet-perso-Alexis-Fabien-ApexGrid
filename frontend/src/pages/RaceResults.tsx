// frontend/src/components/fantasy/RaceResults.tsx

import React, { useEffect, useState } from "react";

interface DriverResult {
  driverId: string;
  constructorId: string;
  position: string;
  grid: string;
  points: number;
}

interface GrandPrixInfo {
  round: string;
  name: string;
}

interface RaceResultsProps {
  initialRound?: string;
  onBack?: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  initialRound = "1",
  onBack,
}) => {
  const [results, setResults] = useState<DriverResult[]>([]);
  const [roundsList, setRoundsList] = useState<GrandPrixInfo[]>([]);
  const [currentRaceName, setCurrentRaceName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"position" | "points">("position");

  useEffect(() => {
    fetch("http://localhost:3000/api/calendar")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: GrandPrixInfo[]) => {
        setRoundsList(data);
      })
      .catch((err) =>
        console.error("Impossible de synchroniser le calendrier", err),
      );
  }, []);

  useEffect(() => {
    const fetchResultsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:3000/api/results/${initialRound}`,
        );
        if (!response.ok) {
          throw new Error(
            "Les résultats de ce round ne sont pas encore disponibles.",
          );
        }

        const data: DriverResult[] = await response.json();

        const sortedData = [...data].sort((a, b) => {
          if (sortBy === "points") {
            return b.points - a.points; 
          } else {
            return Number(a.position) - Number(b.position); 
          }
        });

        setResults(sortedData);

        const match = roundsList.find((r) => r.round === initialRound);
        setCurrentRaceName(match ? match.name : `Round ${initialRound}`);
      } catch (err: any) {
        setError(err.message || "Une erreur réseau est survenue.");
      } finally {
        setLoading(false);
      }
    };

    fetchResultsData();
  }, [initialRound, roundsList, sortBy]);

  return (
    <div className="w-full bg-slate-950 text-white p-4 md:p-10 font-sans">
      
      {/* SECTEUR DE TRI & BOUTON RETOUR CONTROLEUR */}
      <section className="mb-10 max-w-5xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:border-red-600 hover:text-white transition-all cursor-pointer skew-x-[-10deg]"
          >
            <span className="inline-block transform skew-x-10">← LEADERBOARD</span>
          </button>
        )}

        <div className="flex flex-col gap-1 w-full sm:w-auto items-start sm:items-end">
          <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-lg shadow-inner -skew-x-6">
            <button
              onClick={() => setSortBy("position")}
              className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded transition-all cursor-pointer ${
                sortBy === "position"
                  ? "bg-slate-800 text-white border border-slate-700/50 shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="inline-block transform skew-x-6">Position Course</span>
            </button>
            <button
              onClick={() => setSortBy("points")}
              className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded transition-all cursor-pointer ${
                sortBy === "points"
                  ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="inline-block transform skew-x-6">Points Marqués</span>
            </button>
          </div>
        </div>
      </section>

      {/* CLASSEMENT GÉNÉRAL TYPE STRATÉGIE DE COURSE */}
      <main className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
           <span className="text-slate-300 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">{currentRaceName}</span>
          </h2>
          
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 rounded-xl border border-dashed border-slate-900">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="italic font-mono text-slate-500 text-xs uppercase tracking-widest animate-pulse">
              Réorganisation des données ApexGrid...
            </p>
          </div>
        ) : error ? (
          <div className="p-16 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-xl text-center">
            <p className="text-red-500 font-bold uppercase tracking-widest text-sm mb-1.5">Aucune donnée disponible</p>
            <p className="text-slate-500 text-xs font-mono">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-800/80 rounded-xl bg-slate-900/20 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-900/60">
                    <th className="p-4 text-center w-20">POS</th>
                    <th className="p-4">PILOTE</th>
                    <th className="p-4">ÉCURIE</th>
                    <th className="p-4 text-center w-24">GRILLE</th>
                    <th
                      className={`p-4 text-center w-36 font-black border-l border-slate-900 transition-all ${
                        sortBy === "points"
                          ? "bg-red-600/20 text-red-400"
                          : "bg-slate-900/80 text-red-500"
                      }`}
                    >
                      POINTS FANTASY
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs md:text-sm text-slate-300 font-medium whitespace-nowrap">
                  {results.map((driver) => (
                    <tr
                      key={driver.driverId}
                      className="hover:bg-slate-900/40 transition-colors duration-150 group relative"
                    >
                      {/* Position Course massive et italique */}
                      <td className="p-2 md:p-4 text-center font-black italic text-lg md:text-xl text-white group-hover:text-red-500 transition-colors">
                        {driver.position}
                      </td>
                      {/* Nom du pilote */}
                      <td className="p-2 md:p-4 font-black text-white tracking-wide uppercase text-[10px] md:text-sm">
                        {driver.driverId.replace("_", " ")}
                      </td>
                      {/* Constructeur */}
                      <td className="p-2 md:p-4 text-slate-400 uppercase text-[9px] md:text-xs tracking-wider font-semibold">
                        {driver.constructorId}
                      </td>
                      {/* Position de départ */}
                      <td className="p-2 md:p-4 text-center text-slate-500 font-mono font-black text-[10px] md:text-xs">
                        P{driver.grid}
                      </td>
                      {/* Points avec background distinct */}
                      <td
                        className={`p-2 md:p-4 text-center font-mono font-black border-l border-slate-900/40 transition-all ${
                          sortBy === "points"
                            ? "bg-red-600/10 text-red-400 text-sm md:text-base shadow-[inner_0_0_10px_rgba(220,38,38,0.05)]"
                            : "bg-red-600/2 text-red-500 text-xs md:text-sm"
                        }`}
                      >
                        {driver.points > 0 ? `+${driver.points}` : driver.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};