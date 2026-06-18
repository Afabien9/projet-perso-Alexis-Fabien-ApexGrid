import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export const WikiPage = ({ 
  onSelectDriver, 
  onBack 
}: { 
  onSelectDriver: (id: string) => void, 
  onBack?: () => void 
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [champions, setChampions] = useState<any[]>([]);

  useEffect(() => {
    const fetchChampions = async () => {
      const { data } = await supabase
        .from("driver_stats_view")
        .select(`driver_id, total_championships, total_wins, total_points, drivers_wiki(forename, surname)`)
        .gt("total_championships", 0)
        .order("total_championships", { ascending: false });
      if (data) setChampions(data);
    };
    fetchChampions();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("drivers_wiki")
      .select("driver_id, forename, surname, nationality")
      .or(`forename.ilike.${val}%,surname.ilike.${val}%`)
      .limit(10);
    setResults(data || []);
  };

  return (
    
      
   <div className="w-full bg-slate-950 text-white p-4 md:p-10 font-sans">
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
     <header className="mb-12 max-w-6xl mx-auto border-l-4 border-red-600 pl-5">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
          Wiki {" "}
          <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            Pilotes
          </span>
        </h1>
      </header>

      {/* Barre de recherche */}
      <div className="max-w-4xl mx-auto mb-16">
        <input 
          type="text" 
          placeholder="Rechercher un pilote (ex: Hamilton)..." 
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-[#0B0E17] border border-red-900/50 p-5 rounded-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
        />
      </div>

      {/* Grille de Champions */}
      {query.length < 2 && (
        <section className="max-w-6xl mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 ml-1">Légendes du Championnat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {champions.map((item) => (
              <div 
                key={item.driver_id}
                onClick={() => onSelectDriver(item.driver_id)}
                className="group flex items-center bg-[#0B0E17] border border-[#1A1F2E] rounded-md p-6 cursor-pointer hover:border-red-600/50 hover:bg-[#11141F] transition-all duration-300"
              >
                <div className="flex flex-col items-center mr-8 w-12">
                  <span className="text-4xl font-black text-red-600 group-hover:scale-110 transition-transform">
                    {item.total_championships}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                    TITRE{item.total_championships > 1 ? 'S' : ''}
                  </span>
                </div>

                <div className="border-l border-[#1A1F2E] pl-6 flex-1">
                  <h3 className="text-md font-bold uppercase tracking-wide text-white mb-1">
                    {item.drivers_wiki.forename} {item.drivers_wiki.surname}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {item.total_wins} Victoires • {Math.round(item.total_points)} Pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Résultats de recherche */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((item) => (
          <div 
            key={item.driver_id} 
            onClick={() => onSelectDriver(item.driver_id)}
            className="bg-[#0B0E17] border border-[#1A1F2E] rounded-md p-6 cursor-pointer hover:border-red-600/50 transition-all"
          >
            <h3 className="text-md font-bold uppercase text-white mb-1">{item.forename} {item.surname}</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{item.nationality}</p>
          </div>
        ))}
      </div>
    </div>
  );
};