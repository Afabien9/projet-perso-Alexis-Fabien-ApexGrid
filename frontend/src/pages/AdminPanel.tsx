// frontend/src/pages/AdminPanel.tsx
import React, { useState, useEffect } from "react";

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<"sync" | "users" | "scores">(
    "sync",
  );
  const [round, setRound] = useState("1");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "users") {
      fetch("http://localhost:3000/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(console.error);
    }
  }, [activeTab]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(
        `http://localhost:3000/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (res.ok) {
        alert("Rôle mis à jour !");
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/admin/sync-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
        body: JSON.stringify({ round }),
      });
      if (response.ok) alert("Synchronisation lancée avec succès !");
      else alert("Erreur lors de la synchronisation");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-slate-950 min-h-screen text-white font-sans">
      <h1 className="text-4xl font-black uppercase italic mb-8 border-b border-slate-800 pb-4">
        Panel d'Administration
      </h1>

      <div className="flex gap-4 mb-8">
        {[
          { id: "sync", label: "Synchronisation F1" },
          { id: "users", label: "Gestion Utilisateurs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2 rounded font-black uppercase text-xs transition-all ${activeTab === tab.id ? "bg-red-600 shadow-lg shadow-red-900/50" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sync" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <label className="block mb-2 text-sm font-bold">
            Round à synchroniser :
          </label>
          <input
            type="number"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="bg-slate-950 border border-slate-700 p-2 rounded w-20 mb-4"
          />
          <button
            onClick={handleSync}
            disabled={loading}
            className="block bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-black uppercase"
          >
            {loading ? "Synchronisation en cours..." : "Lancer Sync"}
          </button>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4">Liste des Managers</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="p-2">Pseudo</th>
                <th className="p-2">Email</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800">
                  <td className="p-2 font-bold">{u.username}</td>
                  <td className="p-2 text-slate-400">{u.email}</td>
                  <td className="p-2 text-emerald-500">{u.role}</td>
                  <td className="p-2">
                    <select
                      defaultValue={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-slate-800 text-white p-1 rounded text-xs uppercase font-bold cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "scores" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4">Ajustement Manuel</h2>
          <p className="text-slate-400 text-sm">
            Fonctionnalité disponible : Veuillez mapper vos routes POST
            /admin/adjust-score.
          </p>
        </div>
      )}
    </div>
  );
};
