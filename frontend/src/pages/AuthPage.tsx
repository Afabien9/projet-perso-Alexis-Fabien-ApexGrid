import React, { useState } from "react";
import { authService } from "../services/api";
import { supabase } from "../services/supabaseClient"; // Assure-toi d'importer ton client supabase

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Nouvelle fonction Magic Link
  const handleMagicLink = async () => {
    if (!formData.email) return alert("Veuillez entrer votre email");
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    
    setLoading(false);
    if (error) alert(error.message);
    else alert("Un lien de connexion a été envoyé à votre boîte mail !");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await authService.login(formData.email, formData.password);
        if (res.token) {
          window.location.reload();
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
      alert("Une erreur est survenue lors de la communication avec le serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        <div className="relative bg-red-600 p-8 text-center border-b-4 border-red-800 overflow-hidden">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            ApexGrid{" "}
            <span className="text-red-100 font-light not-italic text-2xl">
              {isLogin ? "Login" : "Register"}
            </span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* ... tes inputs restent identiques ... */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Pseudo"
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white font-mono text-sm"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white font-mono text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            required
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white font-mono text-sm"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-black uppercase py-4 rounded-lg italic tracking-tight text-lg shadow-lg"
          >
            {isLogin ? "Ouvrir la session 🏁" : "Enregistrer mon écurie 🏎️"}
          </button>
        </form>

        <div className="p-5 bg-slate-950 border-t border-slate-800/80 text-center flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-[10px] font-bold uppercase hover:text-red-400"
          >
            {isLogin ? "― Pas encore de compte ? Créer une écurie" : "― Déjà membre ? Se connecter"}
          </button>
          
          {isLogin && (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-red-600 text-[10px] font-bold uppercase hover:text-red-400 transition-colors tracking-widest"
            >
              {loading ? "Envoi en cours..." : "Mot de passe oublier"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}