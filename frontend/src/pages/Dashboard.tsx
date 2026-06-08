// frontend/src/pages/Dashboard.tsx

import React from "react";

// Mise à jour du type pour remplacer la vue de gestion par le classement général global
type ActiveView = "leaderboard" | "calendar" | "history";

interface DashboardProps {
  onNavigate: (view: ActiveView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const modules = [
    {
      id: "leaderboard" as ActiveView,
      title: "Classement Général",
      description:
        "Suivez l'évolution des scores des managers en temps réel, analysez les performances globales et grimpez au sommet de la ligue.",
      icon: "🏆",
      badge: "Compétition",
      borderColor: "hover:border-red-600",
      glowColor: "group-hover:shadow-[0_0_30px_rgba(220,38,38,0.25)]",
      lineColor: "bg-red-600",
    },
    {
      id: "calendar" as ActiveView,
      title: "Calendrier GP",
      description:
        "Consultez le calendrier de la saison 2026 et analysez les résultats complets de chaque course directement sur les circuits.",
      icon: "📅",
      badge: "Saison 2026",
      borderColor: "hover:border-blue-600",
      glowColor: "group-hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]",
      lineColor: "bg-blue-600",
    },
    {
      id: "history" as ActiveView,
      title: "Mon Historique",
      description:
        "Analyse vos performances passées, suivez l'évolution de vos points marqués et comparez vos classements généraux.",
      icon: "📜",
      badge: "Statistiques",
      borderColor: "hover:border-emerald-600",
      glowColor: "group-hover:shadow-[0_0_30px_rgba(5,150,105,0.25)]",
      lineColor: "bg-emerald-600",
    },
  ];

  return (
    <div className="w-full bg-slate-950 text-white p-6 md:p-12 font-sans min-h-[calc(100vh-4rem)] flex flex-col justify-center relative overflow-hidden">
      {/* Éléments de fond asymétriques */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-10 bottom-10 w-80 h-80 bg-slate-900/40 rounded-full blur-2xl pointer-events-none" />

      {/* HEADER BIENVENUE STYLE TELEMETRIE */}
      <header className="mb-16 max-w-5xl mx-auto w-full text-center md:text-left border-b-2 border-slate-900 pb-8 relative">
        <div className="absolute bottom-0 left-0 md:left-0 mx-auto md:mx-0 w-24 h-[2px] bg-red-600" />
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
          ApexGrid{" "}
          <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            Fantasy F1
          </span>
        </h1>
      </header>

      {/* GRILLE DES MODULES AVEC EFFET PARALLELOGRAMME */}
      <main className="max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className={`group relative text-left bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between min-h-[240px] transition-all duration-300 backdrop-blur-sm focus:outline-none overflow-hidden cursor-pointer ${mod.borderColor} ${mod.glowColor}`}
            >
              

              {/* Fond de texture de pneu hachuré au survol */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,#fff_5px,#fff_10px)] transition-opacity duration-300 pointer-events-none" />

              {/* Haut de la Box */}
              <div className="w-full relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    {mod.icon}
                  </span>
                  <span className="bg-slate-950 px-3 py-1 rounded border border-slate-800 text-[9px] font-mono font-black tracking-widest text-slate-400 uppercase skew-x-[-10deg]">
                    {mod.badge}
                  </span>
                </div>

                {/* Titre & Description */}
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-white transition-colors mb-2.5">
                  {mod.title}
                </h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                  {mod.description}
                </p>
              </div>

              {/* Bas de la Box : Indicateur d'action Dynamique */}
              <div className="w-full pt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors relative z-10">
                <span className="flex items-center gap-1.5">
                 
                </span>
                <div className="bg-slate-950 p-2 rounded-md border border-slate-800 group-hover:border-slate-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="w-3 h-3 text-slate-400 group-hover:text-white transform group-hover:translate-x-1 transition-transform"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
