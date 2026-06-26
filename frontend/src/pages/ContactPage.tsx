import React, { useState } from "react";

export const ContactPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        alert("Suggestion envoyée ! Merci.");
        setMessage("");
      } else {
        alert("Erreur lors de l'envoi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-slate-950 min-h-screen text-white font-sans max-w-2xl mx-auto">
      <h1 className="text-4xl font-black uppercase italic mb-8 border-b border-slate-800 pb-4">
        Nous Contacter
      </h1>
      <button onClick={onBack} className="text-slate-400 hover:text-white mb-4">
        ← Retour
      </button>
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 p-6 rounded-xl border border-slate-800"
      >
        <label className="block mb-2 text-sm font-bold">
          Votre suggestion :
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded mb-4 h-32"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-black uppercase"
        >
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
};
