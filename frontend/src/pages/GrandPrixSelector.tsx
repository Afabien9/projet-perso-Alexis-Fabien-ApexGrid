// frontend/src/components/fantasy/GrandPrixSelector.tsx

import React, { useEffect, useState } from "react";

interface GrandPrix {
  round: string;
  name: string;
  circuit: string;
  date: string;
  location: string;
  trackImageUrl: string;
}

interface GrandPrixSelectorProps {
  onSelectRound: (roundNumber: string) => void;
  onBack: () => void;
}

export const GrandPrixSelector: React.FC<GrandPrixSelectorProps> = ({
  onSelectRound,
  onBack,
}) => {
  const [grandPrixList, setGrandPrixList] = useState<GrandPrix[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/calendar")
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Impossible de synchroniser le calendrier depuis le serveur.",
          );
        }
        return res.json();
      })
      .then((data: GrandPrix[]) => {
        setGrandPrixList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Erreur de liaison avec le Scoring Engine.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-950 text-white">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-slate-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-red-600 border-r-red-600 rounded-full animate-spin" />
        </div>
        <p className="italic font-mono text-slate-500 text-xs uppercase tracking-widest animate-pulse">
          Synchronisation Grid 2026...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-5 bg-red-950/30 border-2 border-red-900 rounded-xl text-center text-red-400 font-mono shadow-[0_0_30px_rgba(220,38,38,0.1)]">
        <p className="font-black uppercase tracking-widest text-sm mb-1.5">
          ⚠️ Défaut Réseau Telemetry
        </p>
        <p className="text-slate-400 text-xs bg-slate-950/60 p-2 rounded border border-slate-900">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 text-white p-4 md:p-10 font-sans">
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

      <header className="mb-12 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
          Calendrier{" "}
          <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            Grands Prix 2026
          </span>
        </h1>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {grandPrixList.map((gp) => (
            <button
              key={gp.round}
              onClick={() => onSelectRound(gp.round)}
              className="group text-left relative bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-red-600 hover:shadow-[0_0_25px_rgba(220,38,38,0.15)] transition-all duration-300 backdrop-blur-sm overflow-hidden focus:outline-none cursor-pointer"
            >
              <div className="absolute top-0 right-0 bg-slate-950 group-hover:bg-red-600 px-4 py-1.5 border-b border-l border-slate-800 group-hover:border-red-700 text-xs font-mono font-black text-red-500 group-hover:text-white transition-colors skew-x-[-10deg] origin-top-right transform translate-x-1 -translate-y-0.5">
                R{gp.round}
              </div>
              <div className="w-full pr-10">
                <span className="inline-block text-[9px] font-mono text-slate-500 font-black uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60 mb-3">
                  {gp.date}
                </span>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-white group-hover:text-red-500 transition-colors mb-1">
                  {gp.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-3">
                  <span className="text-red-500">📍</span> {gp.location}
                </p>
              </div>
              <div className="mt-4 aspect-[16/10] w-full bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-center relative overflow-hidden group-hover:border-slate-700 transition-colors">
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                <img
                  src={gp.trackImageUrl}
                  alt={`Tracé de ${gp.name}`}
                  className="max-h-full max-w-full object-contain filter invert opacity-30 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
              </div>
              <div className="w-full border-t border-slate-800/40 pt-3 mt-4 text-[9px] font-mono font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 flex items-center justify-between">
                <span>{gp.circuit}</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
