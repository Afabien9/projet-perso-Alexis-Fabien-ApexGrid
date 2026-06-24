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

  // Fonction pour formater la date en "18 mars 2007"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchDriverDetails = async () => {
      // 1. Profil pilote
      const { data: driver } = await supabase
        .from("drivers_wiki")
        .select("*")
        .eq("driver_id", driverId)
        .single();

      // 2. Stats
      const { data: stats } = await supabase
        .from("driver_stats_view")
        .select("*")
        .eq("driver_id", driverId)
        .maybeSingle();

      // 3. Carrière et statut
      const { data: career } = await supabase
        .from("driver_career_details")
        .select("*")
        .eq("driver_id", driverId)
        .maybeSingle();

      if (driver) {
        setDriver({
          ...driver,
          driver_stats_view: stats || {
            total_wins: 0,
            total_podiums: 0,
            total_points: 0,
            total_championships: 0,
          },
          career: career || {},
        });
      }
    };

    fetchDriverDetails();
  }, [driverId]);

  if (!driver) return <div className="text-white p-10">Chargement...</div>;

  return (
    <div className="p-10 text-white bg-slate-950 min-h-screen">
      <button
        onClick={onBack}
        className="text-slate-400 hover:text-white mb-6 font-bold uppercase text-xs tracking-widest flex items-center gap-2"
      >
        ← Retour au Wiki
      </button>

      <h1 className="text-5xl font-black italic uppercase mb-2">
        {driver.forename} {driver.surname}
      </h1>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-10">
        {driver.nationality}
      </p>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Victoires"
          value={driver.driver_stats_view.total_wins}
        />
        <StatCard
          label="Podiums"
          value={driver.driver_stats_view.total_podiums}
        />
        <StatCard
          label="Points"
          value={Math.round(driver.driver_stats_view.total_points)}
        />
        <StatCard
          label="Titres"
          value={driver.driver_stats_view.total_championships}
        />
      </div>

      {/* Détails Carrière unifiés */}
      <div className="bg-[#0B0E17] border border-[#1A1F2E] p-8 rounded-md mt-6">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-red-600 font-black uppercase text-sm tracking-[0.2em]">
            Détails Carrière
          </h2>
          <span
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${driver.career.status === "Retraité" ? "bg-red-900/20 text-red-500" : "bg-green-900/20 text-green-500"}`}
          >
            {driver.career.status || "Actif"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <InfoBlock
            label="1er GP"
            val={driver.career.first_gp_name}
            sub={formatDate(driver.career.first_gp_date)}
          />
          <InfoBlock label="1ère Victoire" val={driver.career.first_win_name} />
          <InfoBlock
            label="Dernier GP"
            val={driver.career.last_gp_name}
            sub={formatDate(driver.career.last_gp_date)}
          />
          <InfoBlock
            label="Dernière Victoire"
            val={driver.career.last_win_name}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-[#0B0E17] border border-[#1A1F2E] p-6 rounded-md">
    <p className="text-slate-500 uppercase text-[9px] font-black tracking-widest mb-1">
      {label}
    </p>
    <p className="text-3xl font-black text-white">{value}</p>
  </div>
);

const InfoBlock = ({
  label,
  val,
  sub,
}: {
  label: string;
  val: string;
  sub?: string;
}) => (
  <div>
    <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
    <p className="font-bold text-sm mt-1">{val || "N/A"}</p>
    {sub && <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>}
  </div>
);
