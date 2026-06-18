import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

interface Driver {
  driver_id: string;
  forename: string;
  surname: string;
}

export const SearchBar = ({ onSelectDriver }: { onSelectDriver: (id: string) => void }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Driver[]>([]);

  const handleSearch = async (value: string) => {
    setQuery(value);

    // On ne lance la recherche qu'à partir de 2 caractères pour ne pas surcharger la BDD
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    // Requête Supabase : cherche les noms ou prénoms commençant par la valeur saisie
    const { data, error } = await supabase
      .from("drivers_wiki")
      .select("driver_id, forename, surname")
      .or(`surname.ilike.${value}%,forename.ilike.${value}%`)
      .limit(5);

    if (!error && data) {
      setSuggestions(data);
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
      
      {/* Affichage des suggestions en dessous de l'input */}
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
          {suggestions.map((driver) => (
            <li
              key={driver.driver_id}
              onClick={() => {
                onSelectDriver(driver.driver_id);
                setSuggestions([]); // On vide la liste après clic
                setQuery("");       // On vide l'input
              }}
              className="p-4 hover:bg-red-600 cursor-pointer text-white border-b border-slate-700 last:border-0 transition-colors"
            >
              <span className="font-bold">{driver.surname}</span> {driver.forename}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};