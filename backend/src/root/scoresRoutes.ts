import { Router } from "express";
import type { Response } from "express";
import { db } from "../config/ds.js";
import { getSeasonConfig } from "../services/seasonConfigService.js";
import {
  calculateUserPoints,
  calculateTeamMateBonus,
  calculateOvertakeBonus,
  calculateUnderdogBonus,
} from "../services/ScoringEngine.js";

const router = Router();

// Gestion des Scores de l'Équipe
router.get("/team-scores", async (req: any, res: Response) => {
  try {
    const idsString = req.query.ids as string;
    const round = (req.query.round as string) || "5";
    const ids = idsString
      ? idsString.split(",").map((id) => id.toLowerCase())
      : [];

    // Récupération des données de configuration et de grille depuis la BDD
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

    // Calcul des points
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

// Score Individuel
router.get("/score/:driverId", async (req: any, res: Response) => {
  try {
    const driverId = ((req.params.driverId as string) || "").toLowerCase();

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

export default router;
