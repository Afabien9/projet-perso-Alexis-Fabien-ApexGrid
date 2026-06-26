import React, { useEffect, useState } from "react";

export const DriversStatsPage = () => {
  const [pilotes, setPilotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/wiki/all-time-stats")
      .then((res) => res.json())
      .then((data) => setPilotes(data))
      .catch(console.error);
  }, []);

  const filtered = pilotes.filter((p) =>
    p.driver_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-10 bg-slate-950 min-h-screen text-white font-sans">
      <h1 className="text-4xl font-black uppercase italic mb-8">
        Légendes de la F1
      </h1>

      <input
        className="mb-6 p-2 bg-slate-900 border border-slate-800 rounded w-full md:w-1/3"
        placeholder="Rechercher un pilote..."
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 uppercase text-xs border-b border-slate-800">
              <th className="p-3">Pilote</th>
              <th className="p-3">Victoires</th>
              <th className="p-3">Poles</th>
              <th className="p-3">GP Disputés</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.driver_name}
                className="border-b border-slate-900 hover:bg-slate-900 transition-colors"
              >
                <td className="p-3 font-bold italic">{p.driver_name}</td>
                <td className="p-3 text-yellow-500">{p.total_wins}</td>
                <td className="p-3 text-blue-400">{p.total_poles}</td>
                <td className="p-3">{p.total_gps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
