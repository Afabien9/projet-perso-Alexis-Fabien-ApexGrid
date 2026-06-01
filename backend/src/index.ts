import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import resultsRoutes from "./root/resultsRoutes.js";

// Imports des contrôleurs et middlewares
import { register, login } from "./controllers/authController.js";
import { verifyToken, isAdmin } from "./middleware/authMiddleware.js";
import { db } from "./config/ds.js";

// Imports du moteur de calcul
import { 
  calculateUserPoints, 
  calculateTeamMateBonus, 
  calculateOvertakeBonus,
  calculateUnderdogBonus 
} from "./services/ScoringEngine.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const DATA_DIR = path.join(process.cwd(), "data");

app.use(cors());
app.use(express.json());
app.use("/api/results", resultsRoutes);

// --- Authentification ---
app.post("/register", register);
app.post("/login", login);

/**
 * @route   GET /api/calendar
 * @desc    Récupère le calendrier complet de la saison 2026
 * @access  Public
 */
app.get("/api/calendar", (req: Request, res: Response) => {
  try {
    const calendarPath = path.join(DATA_DIR, "calendar.json");
    const rawData = fs.readFileSync(calendarPath, "utf-8");
    const calendar = JSON.parse(rawData);
    
    res.status(200).json(calendar);
  } catch (error) {
    res.status(500).json({ message: "Impossible de charger le calendrier." });
  }
});

// --- Gestion des Scores de l'Équipe ---
app.get("/team-scores", (req: Request, res: Response) => {
  try {
    const idsString = req.query.ids as string;
    const round = req.query.round as string || "5";
    const ids = idsString ? idsString.split(",") : [];

    const eliteIds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "elite_ids.json"), "utf-8"));
    const bottomIds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "bottom_ids.json"), "utf-8"));
    const raceResults = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `results/round_${round}.json`), "utf-8"));

    const teamDetails = ids.map(driverId => {
      const driverData = raceResults.find((r: any) => r.driverId === driverId);
      if (!driverData) return null;

      const basePoints = calculateUserPoints(driverData, eliteIds);
      const bonusDuel = calculateTeamMateBonus(driverData, raceResults);
      const bonusOvertake = calculateOvertakeBonus(driverData);
      const bonusUnderdog = calculateUnderdogBonus(driverData, bottomIds);

      const scorePilote = basePoints + bonusDuel + bonusOvertake + bonusUnderdog;

      return {
        nom: driverId,
        score: scorePilote,
        details: {
          position: Number(driverData.position),
          depart: Number(driverData.grid),
          points_base: basePoints,
          bonus_duel: bonusDuel,
          bonus_depassement: bonusOvertake,
          bonus_exploit: bonusUnderdog
        }
      };
    }).filter(Boolean);

    const sommeBrute = teamDetails.reduce((sum, p) => sum + (p ? p.score : 0), 0);
    const grandTotal = Math.max(0, sommeBrute);

    res.json({ grandTotal, pilotes: teamDetails });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du calcul local" });
  }
});

// --- Score Individuel par Pilote ---
app.get("/score/:driverId", (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const round = req.query.round as string || "2";
    
    const eliteIds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "elite_ids.json"), "utf-8"));
    const bottomIds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "bottom_ids.json"), "utf-8"));
    const raceResults = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `results/round_${round}.json`), "utf-8"));

    const driverData = raceResults.find((r: any) => r.driverId === driverId);
    if (!driverData) return res.status(404).json({ message: "Pilote non trouvé" });

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
        bonus_exploit: bonusUnderdog
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// --- Sauvegarder l'équipe par Round ---
app.post("/save-team", verifyToken, async (req: any, res: any) => {
  const { driverIds, round } = req.body;
  const userId = req.user.id;
  const targetRound = round || "6";

  try {
    await db.query(
      `INSERT INTO user_teams (user_id, driver_ids, round) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, round) DO UPDATE SET driver_ids = $2, updated_at = NOW()`,
      [userId, driverIds, targetRound]
    );
    res.json({ message: `Équipe sauvegardée sur Supabase pour le Round ${targetRound}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la sauvegarde de l'équipe" });
  }
});

// --- Récupérer l'équipe de l'utilisateur par Round ---
app.get("/my-team", verifyToken, async (req: any, res: any) => {
  const userId = req.user.id;
  const round = req.query.round || "6";

  try {
    const result = await db.query(
      "SELECT driver_ids FROM user_teams WHERE user_id = $1 AND round = $2", 
      [userId, round]
    );
    res.json(result.rows[0] || { driver_ids: [] });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
});

// --- Récupérer la liste des rounds déjà configurés par l'utilisateur ---
app.get("/my-teams-rounds", verifyToken, async (req: any, res: any) => {
  try {
    const result = await db.query(
      "SELECT round FROM user_teams WHERE user_id = $1 AND jsonb_array_length(driver_ids) = 5", 
      [req.user.id]
    );
    const rounds = result.rows.map((row: any) => row.round);
    res.json(rounds);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des rounds configurés." });
  }
});

// --- Route Admin : Synchro des données ---
app.post("/admin/sync-data", verifyToken, isAdmin, (req: any, res: any) => {
  const round = req.body.round || "1";
  
  exec(`npm run sync -- --round=${round}`, (error, stdout) => {
    if (error) return res.status(500).json({ error: "Échec de la synchronisation" });
    res.json({ message: `Synchronisation du Round ${round} terminée`, logs: stdout });
  });
});

app.listen(port, () => {
  console.log(`🚀 Serveur ApexGrid lancé sur le port ${port}`);
});