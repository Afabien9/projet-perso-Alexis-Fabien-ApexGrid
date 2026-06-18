import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

export const ForgotPassword = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) setMessage("Erreur : " + error.message);
    else setMessage("Un lien a été envoyé sur votre adresse e-mail.");
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 p-6 md:p-16 flex flex-col items-center justify-center">
      <button
        onClick={onBack}
        className="mb-8 px-6 py-3 bg-[#11141F] border border-[#1A1F2E] text-white font-bold tracking-widest uppercase transition-all hover:border-red-600 flex items-center gap-2"
        style={{ transform: "skewX(-15deg)", borderRadius: "4px" }}
      >
        <span style={{ transform: "skewX(15deg)", display: "inline-block" }}>
          ← RETOUR
        </span>
      </button>

      <div className="w-full max-w-md bg-[#0B0E17] border border-[#1A1F2E] p-8 rounded-sm">
        <h2 className="text-white font-black italic uppercase text-2xl mb-6">
          Mot de passe oublié
        </h2>
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Ton adresse email"
            required
            className="w-full bg-[#11141F] border border-red-900/50 p-4 text-white rounded-sm mb-6 focus:outline-none focus:border-red-600"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-sm uppercase tracking-widest"
          >
            {loading ? "Envoi..." : "Recevoir le lien"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-slate-400 text-sm text-center">{message}</p>
        )}
      </div>
    </div>
  );
};
