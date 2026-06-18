// frontend/src/pages/DriversWikiPage.tsx

import React, { useEffect, useState } from "react";
import { DRIVERS_CONFIG } from "../constants/drivers.js";

interface DriverHistoryStats {
  driverName: string;
  team: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnf: number;
  winDetails: string;
}

interface DriversWikiPageProps {
  onBack: () => void;
}

export const DriversWikiPage: React.FC<DriversWikiPageProps> = ({ onBack }) => {
  const [view, setView] = useState<'selection' | 'results'>('selection');
  const [stats, setStats] = useState<DriverHistoryStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const years = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => 2026 - i);

  const handleYearClick = (year: number) => {
    setSelectedSeason(year);
    setView('results');
  };

  useEffect(() => {
    if (view === 'results' && selectedSeason) {
      setLoading(true);
      fetch(`http://localhost:3000/api/wiki/history-stats?season=${selectedSeason}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors du chargement.");
          return res.json();
        })
        .then((data) => {
          setStats(data);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          console.error(err);
          setError("Impossible de contacter le serveur Wiki.");
          setLoading(false);
        });
    }
  }, [view, selectedSeason]);

  // VUE SÉLECTION
  if (view === 'selection') {
    return (
      <div className="w-full min-h-screen bg-slate-950 text-white p-10 font-sans">
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-white uppercase tracking-widest mb-10">
          ← RETOUR DASHBOARD
        </button>
        <h1 className="text-4xl font-black uppercase italic mb-10">Sélectionnez une saison</h1>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {years.map(year => (
            <button 
              key={year} 
              onClick={() => handleYearClick(year)}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-red-600 rounded font-black text-lg transition-all"
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // VUE RÉSULTATS
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-4 md:p-10 font-sans">
      <header className="flex justify-between items-center mb-8">
        <button onClick={() => setView('selection')} className="text-xs text-slate-400 hover:text-white uppercase tracking-widest">
          ← RETOUR SÉLECTION
        </button>
        <h1 className="text-3xl font-black uppercase italic">Archives {selectedSeason}</h1>
      </header>

      {loading && <p className="text-center text-slate-500 italic">Chargement des données {selectedSeason}...</p>}
      {error && <div className="text-red-500 text-center">{error}</div>}

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.length === 0 && !loading && <p className="col-span-full text-center text-slate-600">Aucune donnée trouvée.</p>}
        {stats.map((driver) => (
          <div key={`${driver.driverName}-${selectedSeason}`} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-xl font-black uppercase italic">{driver.driverName}</h3>
            <p className="text-xs text-slate-500 uppercase mb-4">{driver.team}</p>
            <div className="space-y-2 font-mono text-[11px] border-t border-slate-800 pt-4">
              <div className="flex justify-between"><span>POSITION :</span> <span>#{driver.position}</span></div>
              <div className="flex justify-between"><span>POINTS :</span> <span>{driver.points}</span></div>
              <div className="flex justify-between"><span>VICTOIRES :</span> <span className="text-yellow-500">{driver.wins}</span></div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};