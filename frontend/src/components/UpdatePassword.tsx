import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

export const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Mot de passe mis à jour avec succès !");
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-[#0B0E17] border-t-4 border-t-red-600 border border-[#1A1F2E] p-8 rounded-sm shadow-2xl">
        <h2 className="text-white font-black italic uppercase text-2xl mb-6 tracking-tighter">Nouveau mot de passe</h2>
        
        <form onSubmit={handleUpdate}>
          <input 
            type="password" 
            placeholder="Nouveau mot de passe"
            required
            className="w-full bg-[#11141F] border border-red-900/50 p-4 text-white rounded-sm mb-6 focus:outline-none focus:border-red-600 transition-all font-mono"
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase py-4 rounded-sm transition-all tracking-widest italic"
          >
            {loading ? "Mise à jour..." : "Enregistrer le mot de passe"}
          </button>
        </form>

        {message && <p className="mt-4 text-slate-400 text-xs text-center uppercase tracking-widest">{message}</p>}
      </div>
    </div>
  );
};