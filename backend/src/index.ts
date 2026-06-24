// backend/src/index.ts

import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { exec } from "child_process";
import resultsRoutes from "./root/resultsRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Imports des contrôleurs et middlewares
import { register, login } from "./controllers/authController.js";
import { verifyToken, isAdmin } from "./middleware/authMiddleware.js";
import { db } from "./config/ds.js";

// Imports du moteur de calcul
import {
  calculateUserPoints,
  calculateTeamMateBonus,
  calculateOvertakeBonus,
  calculateUnderdogBonus,
} from "./services/ScoringEngine.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use("/api/results", resultsRoutes);

// --- Authentification ---
app.post("/register", register);
app.post("/login", login);

// --- Webhook pour notifier la synchro ---
app.post("/api/sync-notify", (req: Request, res: Response) => {
  const { round } = req.body;
  console.log(`📡 Notification de synchronisation reçue pour le round ${round}`);
  io.emit("sync-completed", { round, message: `Synchronisation du Round ${round} terminée` });
  res.sendStatus(200);
});

// --- Route Contact : Soumettre une suggestion ---
app.post("/api/contact", verifyToken, async (req: any, res: Response) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ message: "Le message est requis." });
  }

  try {
    await db.query(
      "INSERT INTO public.suggestions (user_id, message, created_at) VALUES ($1, $2, NOW())",
      [userId, message]
    );
    console.log(`📩 Suggestion reçue de l'utilisateur ${userId}: ${message}`);
    res.json({ message: "Suggestion envoyée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la suggestion :", error);
    console.log(`📩 [LOG ONLY] Suggestion reçue de l'utilisateur ${userId}: ${message}`);
    res.json({ message: "Suggestion reçue (stockée en log)." });
  }
});

/**
 * Fonction utilitaire interne pour charger la configuration de saison depuis la BDD
 */
async function getSeasonConfig(round: string) {
  const configResult = await db.query(
    "SELECT key, value FROM public.season_config WHERE round = $1",
    [round],
  );

  let eliteIds: string[] = [];
  let bottomIds: string[] = [];

  configResult.rows.forEach((row) => {
    // Lecture directe puisque season_config utilise aussi des tableaux de texte natifs
    if (row.key === "elite_ids") {
      eliteIds = row.value;
    } else if (row.key === "bottom_ids") {
      bottomIds = row.value;
    }
  });

  return {
    eliteIds: Array.isArray(eliteIds) ? eliteIds : [],
    bottomIds: Array.isArray(bottomIds) ? bottomIds : [],
  };
}

/**
 * @route   GET /api/last-synced-round
 * @desc    Récupère dynamiquement le dernier round synchronisé en BDD
 */
app.get("/api/last-synced-round", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      "SELECT MAX(round::integer) as max_round FROM public.race_results",
    );
    res.json({ lastSyncedRound: result.rows[0].max_round || 0 });
  } catch (error) {
    console.error("Erreur récupération last-synced-round :", error);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

/**
 * @route   GET /api/calendar
 * @desc    Récupère le calendrier complet de la saison 2026 depuis la table Supabase
 * @access  Public
 */
app.get("/api/calendar", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT round, name, circuit, date, location, track_image_url AS "trackImageUrl" FROM public.calendar ORDER BY CAST(round AS INTEGER) ASC',
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur récupération calendrier BDD :", error);
    res.status(500).json({
      message: "Impossible de charger le calendrier depuis la base de données.",
    });
  }
});

// --- Gestion des Scores de l'Équipe via la BDD ---
app.get("/team-scores", async (req: Request, res: Response) => {
  try {
    const idsString = req.query.ids as string;
    const round = (req.query.round as string) || "5";
    const ids = idsString
      ? idsString.split(",").map((id) => id.toLowerCase())
      : [];

    // 1. Récupération des données de configuration et de grille depuis la BDD
    const { eliteIds, bottomIds } = await getSeasonConfig(round);
    const dbResults = await db.query(
      'SELECT driver_id AS "driverId", constructor_id AS "constructorId", grid, position, status, is_points AS "isPoints" FROM public.race_results WHERE round = $1',
      [round],
    );

    if (dbResults.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Résultats indisponibles pour ce round." });
    }

    const raceResults = dbResults.rows;

    // 2. Calcul des points
    const teamDetails = ids
      .map((driverId) => {
        const driverData = raceResults.find(
          (r: any) => r.driverId.toLowerCase() === driverId,
        );
        if (!driverData) return null;

        const basePoints = calculateUserPoints(driverData, eliteIds);
        const bonusDuel = calculateTeamMateBonus(driverData, raceResults);
        const bonusOvertake = calculateOvertakeBonus(driverData);
        const bonusUnderdog = calculateUnderdogBonus(driverData, bottomIds);

        const scorePilote =
          basePoints + bonusDuel + bonusOvertake + bonusUnderdog;

        return {
          nom: driverId,
          score: scorePilote,
          details: {
            position: Number(driverData.position),
            depart: Number(driverData.grid),
            points_base: basePoints,
            bonus_duel: bonusDuel,
            bonus_depassement: bonusOvertake,
            bonus_exploit: bonusUnderdog,
          },
        };
      })
      .filter(Boolean);

    const sommeBrute = teamDetails.reduce(
      (sum, p) => sum + (p ? p.score : 0),
      0,
    );
    const grandTotal = Math.max(0, sommeBrute);

    res.json({ grandTotal, pilotes: teamDetails });
  } catch (error) {
    console.error("Erreur /team-scores :", error);
    res
      .status(500)
      .json({ message: "Erreur lors du calcul des scores de l'équipe." });
  }
});

// --- Score Individuel par Pilote via la BDD ---
app.get("/score/:driverId", async (req: Request, res: Response) => {
  try {
    // 🏁 Correction 1 : Cast explicite pour rassurer TypeScript
    const driverId = ((req.params.driverId as string) || "").toLowerCase();

    // 🏁 Correction 2 : Cast explicite du paramètre de requête ou valeur par défaut
    const round = (req.query.round as string) || "2";
    const { eliteIds, bottomIds } = await getSeasonConfig(round);
    const dbResults = await db.query(
      'SELECT driver_id AS "driverId", constructor_id AS "constructorId", grid, position, status, is_points AS "isPoints" FROM public.race_results WHERE round = $1',
      [round],
    );

    const raceResults = dbResults.rows;
    const driverData = raceResults.find(
      (r: any) => r.driverId.toLowerCase() === driverId,
    );

    if (!driverData)
      return res
        .status(404)
        .json({ message: "Pilote non trouvé pour ce round." });

    const basePoints = calculateUserPoints(driverData, eliteIds);
    const bonusDuel = calculateTeamMateBonus(driverData, raceResults);
    const bonusOvertake = calculateOvertakeBonus(driverData);
    const bonusUnderdog = calculateUnderdogBonus(driverData, bottomIds);

    res.json({
      nom: driverId,
      score: basePoints + bonusDuel + bonusOvertake + bonusUnderdog,
      details: {
        position: Number(driverData.position),
        depart: Number(driverData.grid),
        points_base: basePoints,
        bonus_duel: bonusDuel,
        bonus_depassement: bonusOvertake,
        bonus_exploit: bonusUnderdog,
      },
    });
  } catch (error) {
    console.error("Erreur /score/:driverId :", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération du score." });
  }
});

// --- Sauvegarder l'équipe par Round (Correction Typage TEXT ARRAY Supabase) ---
app.post("/save-team", verifyToken, async (req: any, res: any) => {
  const { driverIds, round } = req.body;
  const userId = req.user.id;
  const targetRound = round || "6";

  if (!driverIds || !Array.isArray(driverIds) || driverIds.length !== 5) {
    return res.status(400).json({
      message: "La liste des pilotes doit contenir exactement 5 profils.",
    });
  }

  try {
    const normalizedDriverIds = driverIds.map((id: string) => id.toLowerCase());

    // 🏁 CORRECTION CRITIQUE : Utilisation du cast explicit ::text[] et passage du tableau JS natif
    await db.query(
      `INSERT INTO user_teams (user_id, driver_ids, round, updated_at) 
       VALUES ($1, $2::text[], $3, NOW()) 
       ON CONFLICT (user_id, round) DO UPDATE SET driver_ids = EXCLUDED.driver_ids, updated_at = NOW()`,
      [userId, normalizedDriverIds, targetRound.toString()],
    );
    res.json({
      message: `Équipe sauvegardée sur Supabase pour le Round ${targetRound}`,
    });
  } catch (error) {
    console.error("Erreur /save-team :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la sauvegarde de l'équipe." });
  }
});

// --- Récupérer l'équipe de l'utilisateur par Round ---
app.get("/my-team", verifyToken, async (req: any, res: any) => {
  const userId = req.user.id;
  const round = req.query.round || "6";

  try {
    const result = await db.query(
      "SELECT driver_ids FROM user_teams WHERE user_id = $1 AND round = $2",
      [userId, round],
    );

    if (result.rows.length === 0) {
      return res.json({ driver_ids: [] });
    }

    // Récupération directe du tableau natif de chaînes
    res.json({ driver_ids: result.rows[0].driver_ids || [] });
  } catch (error) {
    console.error("Erreur /my-team :", error);
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});

// --- Récupérer la liste des rounds déjà configurés par l'utilisateur ---
app.get("/my-teams-rounds", verifyToken, async (req: any, res: any) => {
  try {
    // 🏁 CORRECTION CRITIQUE : Cardinality mesure la taille des tableaux natifs (TEXT ARRAY) dans Postgres
    const result = await db.query(
      `
      SELECT round FROM user_teams 
      WHERE user_id = $1 
      AND cardinality(driver_ids) = 5
    `,
      [req.user.id],
    );

    const rounds = result.rows.map((row: any) => row.round);
    res.json(rounds);
  } catch (error) {
    console.error("Erreur /my-teams-rounds :", error);
    res
      .status(500)
      .json({ message: "Erreur lors du calcul des rounds configurés." });
  }
});

// --- Route Admin : Synchro des données ---
app.post("/admin/sync-data", verifyToken, isAdmin, (req: any, res: any) => {
  const round = req.body.round || "1";

  exec(`npm run sync -- --round=${round}`, (error, stdout) => {
    if (error)
      return res.status(500).json({ error: "Échec de la synchronisation" });
    res.json({
      message: `Synchronisation du Round ${round} terminée`,
      logs: stdout,
    });
  });
});

// --- Route Admin : Lister tous les utilisateurs ---
app.get(
  "/admin/users",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await db.query(
        "SELECT id, username, email, role FROM public.users ORDER BY username ASC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Erreur récupération utilisateurs :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// --- Route Admin : Changer le rôle ---
app.patch(
  "/admin/users/:id/role",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    try {
      await db.query("UPDATE public.users SET role = $1 WHERE id = $2", [
        role,
        id,
      ]);
      res.json({ message: "Rôle mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur mise à jour rôle :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// --- Route Admin : Supprimer un utilisateur ---
app.delete(
  "/admin/users/:id",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await db.query("DELETE FROM public.users WHERE id = $1", [id]);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur suppression utilisateur :", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  },
);

// ... existing routes ...

// --- Route Admin : Lister toutes les suggestions ---
app.get(
  "/admin/suggestions",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await db.query(
        "SELECT s.*, u.username FROM public.suggestions s JOIN public.users u ON s.user_id = u.id ORDER BY s.created_at DESC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Erreur récupération suggestions :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// --- Route Admin : Mettre à jour le statut d'une suggestion ---
app.patch(
  "/admin/suggestions/:id",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "validated", "refused"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    try {
      await db.query("UPDATE public.suggestions SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);
      res.json({ message: "Statut mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur mise à jour statut suggestion :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

httpServer.listen(port, () => {
// ... existing code ...
  console.log(`🚀 Serveur ApexGrid lancé sur le port ${port}`);
});
  