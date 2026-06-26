import React from "react";
import { PointDetail } from "../../types/ScoreDetail";

interface ScoreCardProps {
  detail: PointDetail;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ detail }) => {
  const formatPoint = (value: number) => {
    if (value > 0) return `+${value}`;
    if (value < 0) return value.toString();
    return "+0";
  };

  const getPointColor = (value: number) => {
    if (value > 0) return "text-emerald-400";
    if (value < 0) return "text-red-500";
    return "text-slate-600";
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 text-white rounded-xl shadow-2xl overflow-hidden border border-slate-800 w-full max-w-md relative group hover:border-slate-700 transition-all duration-300">
      <div className="relative bg-gradient-to-r from-red-700 to-red-600 p-5 flex justify-between items-center overflow-hidden border-b-2 border-red-900">
        <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,#fff_5px,#fff_10px)]" />

        <div className="relative z-10 transform -skew-x-3">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            {detail.nom}
          </h2>
        </div>
        <div className="text-right relative z-10">
          <p className="text-[9px] uppercase tracking-widest text-red-200 font-mono font-black">
            Score
          </p>
          <span className="text-4xl font-mono font-black italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {detail.total}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-3.5 font-sans">
          {/* Ligne : Position course */}
          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900 group-hover:border-slate-800/60 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">
                Position de course
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Arrivée : P{detail.position}
              </span>
            </div>
            <span
              className={`text-lg font-mono font-black ${getPointColor(detail.points_base)}`}
            >
              {formatPoint(detail.points_base)}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900 group-hover:border-slate-800/60 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">
                Duel Coéquipier
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Performance{" "}
              </span>
            </div>
            <span
              className={`text-lg font-mono font-black ${getPointColor(detail.bonus_duel)}`}
            >
              {formatPoint(detail.bonus_duel)}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900 group-hover:border-slate-800/60 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">
                Bonus Dépassement
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Grille : P{detail.depart} → Final : P{detail.position}
              </span>
            </div>
            <span
              className={`text-lg font-mono font-black ${getPointColor(detail.bonus_depassement)}`}
            >
              {formatPoint(detail.bonus_depassement)}
            </span>
          </div>

          {/* Ligne : Bonus Exploit */}
          {detail.bonus_exploit !== undefined &&
            detail.bonus_exploit !== null &&
            Number(detail.bonus_exploit) > 0 && (
              <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase italic tracking-tight text-emerald-400">
                    Bonus Exploit
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600/80 uppercase font-black">
                    Top 10 Finisher
                  </span>
                </div>

                <span className="text-xl font-mono font-black text-emerald-400 transform skew-x-3">
                  {formatPoint(Number(detail.bonus_exploit))}
                </span>
              </div>
            )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-between items-center">
          <div className="flex space-x-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-3 bg-red-600 skew-x-[-25deg] shadow-[0_0_5px_rgba(220,38,38,0.5)]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
