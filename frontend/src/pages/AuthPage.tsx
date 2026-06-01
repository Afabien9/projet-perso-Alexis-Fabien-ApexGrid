import React, { useState } from "react";
import { authService } from "../services/api";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await authService.login(formData.email, formData.password);

        if (res.token) {
          console.log("Connexion réussie, redirection...");
          window.location.href = "/";
        } else {
          alert(res.message || "Identifiants incorrects.");
        }
      } else {
        const res = await authService.register(
          formData.username,
          formData.email,
          formData.password,
        );

        if (res.message) {
          alert("Compte créé avec succès ! Connectez-vous maintenant.");
          setIsLogin(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'authentification :", error);
      alert(
        "Une erreur est survenue lors de la communication avec le serveur.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Arrière-plan thématique : Grille de lignes de course dynamiques */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-300 hover:border-slate-700">
        {/* En-tête aérodynamique asymétrique */}
        <div className="relative bg-red-600 p-8 text-center border-b-4 border-red-800 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]" />
          <div className="relative transform -skew-x-6">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              ApexGrid{" "}
              <span className="text-red-100 font-light not-italic text-2xl block sm:inline sm:text-4xl sm:font-black sm:italic">
                {isLogin ? "Login" : "Register"}
              </span>
            </h2>
            <p className="text-red-100 text-[10px] font-black uppercase tracking-[0.25em] mt-2 bg-red-950/40 inline-block px-3 py-1 rounded">
              {isLogin
                ? "Accéder à votre écurie"
                : "Créer votre structure de course"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Champ Pseudo */}
          {!isLogin && (
            <div className="space-y-1.5 group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest transition-colors group-focus-within:text-red-500">
                Pseudo Team Manager
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-focus-within:bg-red-600 transition-colors rounded-l-lg" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Team_CodBar"
                  className="w-full bg-slate-950 border border-slate-800 pl-4 pr-3 py-3 rounded-lg text-white placeholder-slate-700 outline-none transition-all font-medium font-mono text-sm focus:border-slate-700 focus:bg-slate-950/80 focus:shadow-[0_0_15px_rgba(220,38,38,0.05)]"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Champ Email */}
          <div className="space-y-1.5 group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest transition-colors group-focus-within:text-red-500">
              Adresse Email
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-focus-within:bg-red-600 transition-colors rounded-l-lg" />
              <input
                type="email"
                required
                placeholder="manager@apexgrid.com"
                className="w-full bg-slate-950 border border-slate-800 pl-4 pr-3 py-3 rounded-lg text-white placeholder-slate-700 outline-none transition-all font-medium font-mono text-sm focus:border-slate-700 focus:bg-slate-950/80 focus:shadow-[0_0_15px_rgba(220,38,38,0.05)]"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-1.5 group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest transition-colors group-focus-within:text-red-500">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-focus-within:bg-red-600 transition-colors rounded-l-lg" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 pl-4 pr-3 py-3 rounded-lg text-white placeholder-slate-700 outline-none transition-all font-medium font-mono text-sm focus:border-slate-700 focus:bg-slate-950/80 focus:shadow-[0_0_15px_rgba(220,38,38,0.05)]"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          {/* Bouton d'action principal "Launch Control" */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full relative group/btn overflow-hidden bg-red-600 hover:bg-red-500 text-white font-black uppercase py-4 rounded-lg transition-all shadow-lg shadow-red-950/50 active:scale-[0.98] italic tracking-tight text-lg cursor-pointer"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:animate-[shimmer_0.75s_ease-out]" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLogin ? "Ouvrir la session 🏁" : "Enregistrer mon écurie 🏎️"}
              </span>
            </button>
          </div>
        </form>

        {/* Pied de carte séquentiel */}
        <div className="p-5 bg-slate-950 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="inline-block text-slate-400 text-xs hover:text-red-400 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isLogin
              ? "― Pas encore de compte ? Créer une écurie"
              : "― Déjà membre ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
