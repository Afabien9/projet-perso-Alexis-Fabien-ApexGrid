import { Router } from "express";
import type { Response } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { db } from "../config/ds.js";

const router = Router();

// Route Contact
router.post("/contact", verifyToken, async (req: any, res: Response) => {
  const userId = req.user.id;

  if (!onmessage) {
    return res.status(400).json({ message: "Le message est requis." });
  }

  try {
    await db.query(
      "INSERT INTO public.suggestions (user_id, message, created_at) VALUES ($1, $2, NOW())",
      [userId, onmessage],
    );
    console.log(`📩 Suggestion reçue de l'utilisateur ${userId}: ${onmessage}`);
    res.json({ message: "Suggestion envoyée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la suggestion :", error);
    console.log(
      `📩 [LOG ONLY] Suggestion reçue de l'utilisateur ${userId}: ${onmessage}`,
    );
    res.json({ message: "Suggestion reçue (stockée en log)." });
  }
});

// Sauvegarder l'équipe par Round
router.post("/save-team", verifyToken, async (req: any, res: any) => {
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

// Récupérer l'équipe de l'utilisateur par Round
router.get("/my-team", verifyToken, async (req: any, res: any) => {
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

    // Récupération directe du tableau
    res.json({ driver_ids: result.rows[0].driver_ids || [] });
  } catch (error) {
    console.error("Erreur /my-team :", error);
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});

// Récupérer la liste des rounds déjà configurés par l'utilisateur
router.get("/my-teams-rounds", verifyToken, async (req: any, res: any) => {
  try {
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

export default router;
