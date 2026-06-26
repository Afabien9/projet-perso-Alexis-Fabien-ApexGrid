import React from "react";

type ActiveView =
  | "leaderboard"
  | "calendar"
  | "history"
  | "wiki"
  | "contact"
  | "admin";

interface DashboardProps {
  onNavigate: (view: ActiveView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const modules = [
    {
      id: "leaderboard" as ActiveView,
      title: "Classement",
      description:
        "Consultez les scores en temps réel de tous les utilisateur.",
      icon: "🏆",
      borderColor: "hover:border-red-600",
    },
    {
      id: "calendar" as ActiveView,
      title: "Calendrier",
      description:
        "Visualisez le calendrier de la saison 2026 et accédez aux résultats.",
      icon: "📅",
      borderColor: "hover:border-blue-600",
    },
    {
      id: "history" as ActiveView,
      title: "Fantasy League",
      description:
        "Analysez vos performances passées. C'est ici que vous gérez vos équipes pour les différents Grands Prix.",
      icon: "📜",
      borderColor: "hover:border-amber-600",
    },
    {
      id: "wiki" as ActiveView,
      title: "Wiki F1",
      description:
        "Accédez aux statistiques et informations détaillées sur les pilotes.",
      icon: "📚",
      borderColor: "hover:border-purple-600",
    },
    {
      id: "contact" as ActiveView,
      title: "Contact",
      description: "Suggérez des modifications ou contactez l'équipe.",
      icon: "✉️",
      borderColor: "hover:border-teal-600",
    },
  ];

  return (
    <div className="w-full bg-slate-950 text-white p-6 md:p-12 font-sans min-h-screen">
      <header className="mb-16 max-w-4xl mx-auto text-center border-b border-slate-800 pb-12 flex flex-col items-center">
        <h1 className="text-6xl font-black italic uppercase text-white mb-6 tracking-tighter">
          ApexGrid
        </h1>
        <div className="text-lg text-slate-300 leading-relaxed space-y-6 max-w-2xl">
          <p>
            <strong className="text-red-500 italic">ApexGrid</strong> est le pit
            wall de votre ascension. Pilotez votre écurie depuis les coulisses,
            analysez les données en temps réel et défiez les meilleurs
            stratèges. Ici, chaque décision façonne votre héritage.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            className={`group bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all ${mod.borderColor} hover:scale-105`}
          >
            <div className="text-4xl mb-4">{mod.icon}</div>
            <h2 className="text-xl font-black uppercase italic mb-2">
              {mod.title}
            </h2>
            <p className="text-xs text-slate-400">{mod.description}</p>
          </button>
        ))}
      </main>
    </div>
  );
};
