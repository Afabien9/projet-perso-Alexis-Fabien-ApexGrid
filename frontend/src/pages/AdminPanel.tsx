import React, { useState, useEffect } from "react";

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<"sync" | "users" | "suggestions">(
    "sync",
  );
  const [round, setRound] = useState("1");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

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
    } else if (activeTab === "suggestions") {
      fetch("http://localhost:3000/admin/suggestions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
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

  const deleteUser = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

    try {
      const res = await fetch(`http://localhost:3000/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
      });

      if (res.ok) {
        alert("Utilisateur supprimé !");
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateSuggestionStatus = async (
    id: string,
    status: "validated" | "refused",
  ) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/suggestions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("apex_token")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setSuggestions(
          suggestions.map((s) => (s.id === id ? { ...s, status } : s)),
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
          { id: "suggestions", label: "Suggestions" },
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
                  <td className="p-2 flex gap-2">
                    <select
                      defaultValue={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-slate-800 text-white p-1 rounded text-xs uppercase font-bold cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs uppercase font-bold hover:bg-red-800"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "suggestions" && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4">
            Suggestions des Utilisateurs
          </h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Message</th>
                <th className="p-2">Date</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.id} className="border-b border-slate-800">
                  <td className="p-2 font-bold">{s.username}</td>
                  <td className="p-2 text-slate-300">{s.message}</td>
                  <td className="p-2 text-slate-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className={`p-2 font-bold ${
                      s.status === "validated"
                        ? "text-emerald-500"
                        : s.status === "refused"
                          ? "text-red-500"
                          : "text-amber-500"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </td>
                  <td className="p-2 flex gap-2">
                    {s.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            updateSuggestionStatus(s.id, "validated")
                          }
                          className="bg-emerald-900 text-emerald-300 px-2 py-1 rounded text-xs uppercase font-bold hover:bg-emerald-800"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() =>
                            updateSuggestionStatus(s.id, "refused")
                          }
                          className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs uppercase font-bold hover:bg-red-800"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
