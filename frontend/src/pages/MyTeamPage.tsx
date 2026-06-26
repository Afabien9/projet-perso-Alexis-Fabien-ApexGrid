import { useEffect, useState } from "react";
import { DRIVERS_CONFIG } from "../constants/drivers.js";
import { authService } from "../services/api.js";

interface MyTeamPageProps {
  targetRound?: string;
  onBack: () => void;
}

interface GrandPrixInfo {
  round: string;
  name: string;
}

export function MyTeamPage({ targetRound, onBack }: MyTeamPageProps) {
  const currentRound = targetRound || "6";

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [raceName, setRaceName] = useState<string>(
    `GRAND PRIX ${currentRound}`,
  );

  const BUDGET_MAX = 100;
  const PILOTES_MAX = 5;

  const [myTeam, setMyTeam] = useState<string[]>([]);

  const budgetConsomme = myTeam.reduce((total, id) => {
    const driver = DRIVERS_CONFIG.find((d) => d.id === id);
    return total + (driver?.price || 0);
  }, 0);

  useEffect(() => {
    setLoading(true);
    setSaveSuccess(false);

    // 1. Chargement de la Line-up utilisateur et du calendrier
    Promise.all([
      authService.getMyTeam(currentRound),
      fetch("http://localhost:3000/api/calendar").then((res) => res.json()),
    ])
      .then(([teamData, calendarData]: [any, GrandPrixInfo[]]) => {
        if (teamData && teamData.driver_ids) {
          setMyTeam(teamData.driver_ids);
        } else {
          setMyTeam([]);
        }

        // Recherche du nom du Grand Prix dans le calendrier de la BDD
        const currentRace = calendarData.find(
          (gp) => gp.round === currentRound,
        );
        if (currentRace) {
          setRaceName(currentRace.name);
        }
      })
      .catch((err) => {
        console.error(
          "Erreur lors de la synchronisation des données d'ingénierie :",
          err,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentRound]);

  const toggleDriver = (id: string) => {
    setSaveSuccess(false);
    const isSelected = myTeam.includes(id);
    const driver = DRIVERS_CONFIG.find((d) => d.id === id);

    let updatedTeam = [...myTeam];

    if (isSelected) {
      updatedTeam = updatedTeam.filter((driverId) => driverId !== id);
    } else {
      if (myTeam.length >= PILOTES_MAX) {
        alert(`Équipe complète : maximum ${PILOTES_MAX} pilotes.`);
        return;
      }
      if (budgetConsomme + (driver?.price || 0) > BUDGET_MAX) {
        alert("Budget insuffisant ! Pas assez de crédits.");
        return;
      }
      updatedTeam.push(id);
    }
    setMyTeam(updatedTeam);
  };

  const handleValidateTeam = async () => {
    if (myTeam.length !== PILOTES_MAX) {
      alert(
        `Attention : Vous devez sélectionner exactement ${PILOTES_MAX} pilotes avant de valider.`,
      );
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const normalizedLineUp = myTeam.map((id) => id.toLowerCase());

      await authService.saveTeam(normalizedLineUp, currentRound);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la validation de l'équipe :", err);
      alert("Une erreur est survenue lors de la validation sur Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-slate-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-red-600 border-r-red-600 rounded-full animate-spin" />
        </div>
        <p className="italic font-mono text-slate-500 text-xs uppercase tracking-widest animate-pulse">
          Chargement de l'ingénierie du GP...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 font-sans relative">
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:border-red-600 hover:text-white transition-all cursor-pointer group skew-x-[-10deg]"
        >
          <span className="inline-block transform skew-x-10">← RETOUR</span>
        </button>
      </div>

      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
        <div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            ApexGrid{" "}
          </h1>
        </div>
        <div className="flex items-center">
          <span className="bg-linear-to-r from-emerald-600 to-emerald-500 border border-emerald-400 text-slate-950 text-[10px] font-mono font-black px-4 py-2 rounded uppercase tracking-widest skew-x-[-10deg] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="inline-block transform skew-x-10">{raceName}</span>
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <div className="bg-linear-to-br from-slate-900 to-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap justify-between items-end gap-2 text-xs font-mono font-black uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-500">BUDGET DISPONIBLE:</span>
                <span
                  className={`text-xl ${budgetConsomme > 90 ? "text-red-500 animate-pulse" : "text-emerald-400"}`}
                >
                  {BUDGET_MAX - budgetConsomme}M{" "}
                  <span className="text-xs text-slate-600 font-sans font-normal">
                    / {BUDGET_MAX}M
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-500">LINE-UP EFFECTIF:</span>
                <span
                  className={`text-xl ${myTeam.length === PILOTES_MAX ? "text-emerald-400" : "text-white"}`}
                >
                  {myTeam.length}{" "}
                  <span className="text-xs text-slate-600 font-sans font-normal">
                    / {PILOTES_MAX} DRIVERS
                  </span>
                </span>
              </div>
            </div>

            <div className="h-3 bg-slate-950 border border-slate-800 rounded-md overflow-hidden p-0.5">
              <div
                className="h-full rounded bg-emerald-500 shadow-inner transition-all duration-500"
                style={{ width: `${(budgetConsomme / BUDGET_MAX) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {saveSuccess && (
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-4 py-3.5 rounded-lg w-full text-center sm:w-auto">
                ✓ STRUCTURE VERROUILLÉE
              </span>
            )}

            <button
              onClick={handleValidateTeam}
              disabled={isSaving}
              className={`w-full sm:w-auto px-8 py-4 rounded-lg text-sm font-black uppercase tracking-wider italic transition-all shadow-lg active:scale-[0.98] cursor-pointer skew-x-[-8deg] ${
                myTeam.length === PILOTES_MAX
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40"
                  : "bg-slate-800 text-slate-600 border border-slate-700/60 cursor-not-allowed"
              }`}
            >
              <span className="inline-block transform skew-x-[8deg]">
                {isSaving ? "TRANSMISSION..." : `VALIDER L'ÉQUIPE`}
              </span>
            </button>
          </div>
        </div>

        <section>
          <div className="border-b border-slate-900 pb-3 mb-6 flex justify-between items-center">
            <h2 className="text-xs font-mono font-black uppercase tracking-widest text-slate-500">
              // Pilotes disponibles au paddock
            </h2>
            <span className="text-[9px] font-mono text-slate-600">
              Sélectionnez {PILOTES_MAX} profils
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {DRIVERS_CONFIG.map((driver) => {
              const isChosen = myTeam.includes(driver.id);
              return (
                <div
                  key={driver.id}
                  onClick={() => toggleDriver(driver.id)}
                  className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isChosen
                      ? "border-red-600 bg-linear-to-b from-red-950/40 to-slate-900/90 shadow-[0_0_20px_rgba(220,38,38,0.25)]"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="absolute top-1 left-1 z-10 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-slate-800/60 text-[8px] font-mono font-black text-slate-400 group-hover:text-white transition-colors">
                    {driver.price}M
                  </div>

                  <div className="aspect-4/5 w-full overflow-hidden rounded-lg mb-2 relative bg-slate-950 border border-slate-800/40">
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent opacity-80 z-1" />
                    <img
                      src={driver.image}
                      alt={driver.name}
                      className={`w-full h-full object-cover transition-all duration-300 transform ${
                        isChosen
                          ? "grayscale-0 scale-105"
                          : "grayscale opacity-50 group-hover:opacity-100 group-hover:scale-105"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col items-center text-center w-full relative z-10">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wide leading-none truncate w-full ${
                        isChosen
                          ? "text-red-500 italic"
                          : "text-white group-hover:text-red-400"
                      }`}
                    >
                      {driver.name.split(" ").pop()}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase font-bold mt-1 tracking-wider">
                      {driver.team.substring(0, 8)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
