import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export const DriverDetails = ({
  driverId,
  onBack,
}: {
  driverId: string;
  onBack: () => void;
}) => {
  const [driver, setDriver] = useState<any>(null);

 useEffect(() => {
  const fetchDriverDetails = async () => {
    // 1. Récupération du profil du pilote
    const { data: driver, error: driverError } = await supabase
      .from("drivers_wiki")
      .select("*")
      .eq("driver_id", driverId)
      .single();

    // 2. Récupération forcée des stats depuis la vue (séparément)
    const { data: stats, error: statsError } = await supabase
      .from("driver_stats_view")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle(); // Utilise maybeSingle pour éviter les erreurs si aucune stat n'existe

    // 3. Récupération des résultats (pour les titres)
    const { data: results, error: resError } = await supabase
      .from("results_wiki")
      .select("position_order, races_wiki(year)")
      .eq("driver_id", driverId);

    if (driver) {
      setDriver({
        ...driver,
        driver_stats_view: stats || { total_wins: 0, total_podiums: 0, total_points: 0, total_dnf: 0, total_championships: 0 },
        results_wiki: results || []
      });
    }
  };

  fetchDriverDetails();
}, [driverId]);

  if (!driver) return <div className="text-white p-10">Chargement...</div>;

  // Calcul dynamique des années de titres pour l'affichage textuel
  const championshipYears = (driver.results_wiki || [])
    .filter((r: any) => r.position_order === 1 && r.races_wiki?.year)
    .map((r: any) => r.races_wiki.year)
    .filter(
      (year: any, index: number, self: any[]) => self.indexOf(year) === index,
    )
    .sort();

  return (
    <div className="p-10 text-white bg-slate-950 min-h-screen">
      <button
        onClick={onBack}
        className="text-red-600 hover:text-red-400 mb-6 font-bold uppercase text-xs tracking-widest"
      >
        ← Retour au Wiki
      </button>

      <h1 className="text-5xl font-black italic uppercase mb-2">
        {driver.forename} {driver.surname}
      </h1>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">
        {driver.nationality}
      </p>

      {/* Statistiques depuis la vue SQL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Victoires"
          value={driver.driver_stats_view?.total_wins || 0}
        />
        <StatCard
          label="Podiums"
          value={driver.driver_stats_view?.total_podiums || 0}
        />
        <StatCard
          label="Points"
          value={driver.driver_stats_view?.total_points || 0}
        />
      </div>

      {/* Palmarès Championnat */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h2 className="text-xl font-black uppercase italic mb-4">
          Palmarès Championnat
        </h2>
        <p className="text-3xl font-black text-red-600 mb-2">
          {driver.driver_stats_view?.total_championships || 0} Titre(s)
        </p>
      
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">
      {label}
    </p>
    <p className="text-2xl font-black">{value}</p>
  </div>
);
