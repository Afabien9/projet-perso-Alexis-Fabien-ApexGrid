// frontend/src/services/api.ts

const API_URL = "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("apex_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

export const authService = {
  // --- AUTHENTIFICATION ---
  register: async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("apex_token", data.token);
      localStorage.setItem("apex_user", JSON.stringify(data));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("apex_token");
    localStorage.removeItem("apex_user");
  },

  // --- GESTION DES ÉQUIPES PAR ROUND ---
  saveTeam: async (driverIds: string[], round: string) => {
    const res = await fetch(`${API_URL}/save-team`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ driverIds, round }),
    });
    return res.json();
  },

  getMyTeam: async (round: string) => {
    const res = await fetch(`${API_URL}/my-team?round=${round}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getMyTeamsRounds: async () => {
    const res = await fetch(`${API_URL}/my-teams-rounds`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      console.warn("⚠️ Impossible de lire les rounds configurés de l'utilisateur.");
      return [];
    }
    return res.json();
  },

  // --- HISTORIQUE ET CLASSEMENTS ---
  getSelectedRanking: async () => {
    const res = await fetch(`${API_URL}/api/results/user/selected-ranking`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      console.warn("⚠️ Classement personnalisé indisponible.");
      return [];
    }
    return res.json();
  },

  getUserRoundDetails: async (round: string) => {
    const res = await fetch(`${API_URL}/api/results/user/round-details/${round}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    // Évite de bloquer l'application en cas de retour d'erreur (403, 404, 500)
    if (!res.ok) {
      console.error(`❌ Échec de la récupération des scores pour le Round ${round}`);
      return { totalScore: 0, driversDetails: [] };
    }
    
    return res.json();
  },

  // --- CLASSEMENTS UTILISATEURS (LEADERBOARD) ---
  getSeasonLeaderboard: async () => {
    const res = await fetch(`${API_URL}/api/results/leaderboard/season`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      console.error("❌ Échec de la récupération du classement général de la saison");
      return [];
    }
    return res.json();
  },

  getRoundLeaderboard: async (round: string) => {
    const res = await fetch(`${API_URL}/api/results/leaderboard/round/${round}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      console.error(`❌ Échec de la récupération du classement pour le Round ${round}`);
      return [];
    }
    return res.json();
  },

  // --- ADMIN ---
  syncF1Data: async (round: string) => {
    const res = await fetch(`${API_URL}/admin/sync-data`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ round }),
    });
    return res.json();
  }
};