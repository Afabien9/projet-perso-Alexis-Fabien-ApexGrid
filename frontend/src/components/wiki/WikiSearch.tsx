// frontend/src/components/wiki/WikiSearch.tsx
import React, { useState } from 'react';

export const WikiSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [type, setType] = useState<'driver' | 'race'>('driver');

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) return; // Sécurité : recherche à partir de 2 lettres

    const res = await fetch(`http://localhost:3000/api/wiki/search?query=${val}&type=${type}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <div className="flex gap-4 mb-4">
        <select onChange={(e) => setType(e.target.value as any)} className="bg-slate-800 p-2 rounded">
          <option value="driver">Pilote</option>
          <option value="race">Course</option>
        </select>
        <input 
          type="text" 
          placeholder="Rechercher..." 
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-slate-950 p-2 rounded border border-slate-700"
        />
      </div>
      
      {/* Liste des résultats */}
      <div className="grid gap-2">
        {results.map((item) => (
          <div key={item.id} className="p-3 bg-slate-950 rounded border border-slate-800">
            {item.driver_name || item.name}
          </div>
        ))}
      </div>
    </div>
  );
};