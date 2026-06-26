import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

interface Driver {
  driver_id: string;
  forename: string;
  surname: string;
  driver_stats_view: { total_championships: number }[];
}

// recherche pilotes suggestion temps réel
export const SearchBar = ({
  onSelectDriver,
}: {
  onSelectDriver: (id: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Driver[]>([]);

  const handleSearch = async (value: string) => {
    setQuery(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from("drivers_wiki")
      .select(
        "driver_id, forename, surname, driver_stats_view(total_championships)",
      )
      .or(`surname.ilike.${value}%,forename.ilike.${value}%`)
      .limit(5);

    if (!error && data) {
      setSuggestions(data as any);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Rechercher un pilote (ex: Ham...)"
        className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-xl focus:outline-none focus:border-red-600 transition-colors"
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
          {suggestions.map((driver) => {
            const championships =
              driver.driver_stats_view?.[0]?.total_championships || 0;
            return (
              <li
                key={driver.driver_id}
                onClick={() => {
                  onSelectDriver(driver.driver_id);
                  setSuggestions([]);
                  setQuery("");
                }}
                className="p-4 hover:bg-red-600 cursor-pointer text-white border-b border-slate-700 last:border-0 transition-colors flex justify-between items-center"
              >
                <span>
                  <span className="font-bold">{driver.surname}</span>{" "}
                  {driver.forename}
                </span>
                {championships > 0 && (
                  <span className="text-[10px] bg-red-900 text-white px-2 py-0.5 rounded-full font-black">
                    {championships} TITRE{championships > 1 ? "S" : ""}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
