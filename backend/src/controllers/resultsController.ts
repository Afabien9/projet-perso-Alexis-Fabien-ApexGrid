import type { Request, Response } from "express";
import * as ScoringEngine from "../services/ScoringEngine.js";
import fs, { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { RaceResult } from "../models/RaceResult.js";
import { db } from "../config/ds.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../../data");

const elitePath = path.join(DATA_DIR, "elite_ids.json");
const eliteIds = JSON.parse(readFileSync(elitePath, "utf-8"));

const bottomPath = path.join(DATA_DIR, "bottom_ids.json");
const bottomTeamIds = JSON.parse(readFileSync(bottomPath, "utf-8"));

/**
 * @route   GET /api/results/:Round
 * @desc    Récupère les résultats de course globaux d'un round (Grille complète des 22 pilotes)
 */
export const getResultsByRound = async (req: Request, res: Response) => {
  try {
    const Round = req.params.Round || req.params.round;
    const resultPath = path.join(DATA_DIR, "results", `round_${Round}.json`);
    
    const rawData = readFileSync(resultPath, "utf-8");
    const myData: RaceResult[] = JSON.parse(rawData);

    const allDriver = myData.map((drivers) => {
      const baseScore = ScoringEngine.calculateUserPoints(drivers, eliteIds);
      const bonusDepassement = ScoringEngine.calculateOvertakeBonus(drivers);
      const bonusEquipe = ScoringEngine.calculateTeamMateBonus(drivers, myData);
      const malusScore = ScoringEngine.calculateUnderdogBonus(drivers, bottomTeamIds);

      return {
        ...drivers,
        points: baseScore + bonusDepassement + bonusEquipe + malusScore,
      };
    });

    res.status(200).json(allDriver);
  } catch (error) {
    res.status(404).json({ message: "Résultats indisponibles pour ce round" });
  }
};

/**
 * @route   GET /api/results/user/selected-ranking
 * @desc    Calcule le classement général cumulé de la saison pour les pilotes de l'utilisateur
 */
export const getSelectedRanking = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const teamResult = await db.query(
      "SELECT driver_ids FROM user_teams WHERE user_id = $1",
      [userId]
    );

    if (!teamResult.rows[0] || !teamResult.rows[0].driver_ids || teamResult.rows[0].driver_ids.length === 0) {
      return res.status(200).json([]);
    }

    const selectedDrivers: string[] = teamResult.rows[0].driver_ids;

    const resultsDir = path.join(DATA_DIR, "results");
    if (!fs.existsSync(resultsDir)) {
      return res.status(404).json({ message: "Aucun historique de course local trouvé." });
    }

    const files = fs.readdirSync(resultsDir).filter(
      (file) => file.startsWith("round_") && file.endsWith(".json")
    );

    const cumulativeRanking: Record<
      string,
      { driverId: string; constructorId: string; totalPoints: number; positionsHistory: number[] }
    > = {};

    selectedDrivers.forEach((id) => {
      cumulativeRanking[id] = {
        driverId: id,
        constructorId: "non-défini",
        totalPoints: 0,
        positionsHistory: [],
      };
    });

    files.forEach((file) => {
      const filePath = path.join(resultsDir, file);
      const rawData = fs.readFileSync(filePath, "utf-8");
      const raceResults: RaceResult[] = JSON.parse(rawData);

      selectedDrivers.forEach((driverId) => {
        const driverData = raceResults.find((r) => r.driverId === driverId);
        
        if (driverData) {
          const baseScore = ScoringEngine.calculateUserPoints(driverData, eliteIds);
          const bonusDepassement = ScoringEngine.calculateOvertakeBonus(driverData);
          const bonusEquipe = ScoringEngine.calculateTeamMateBonus(driverData, raceResults);
          const malusScore = ScoringEngine.calculateUnderdogBonus(driverData, bottomTeamIds);

          const roundTotal = baseScore + bonusDepassement + bonusEquipe + malusScore;

          if (cumulativeRanking[driverId]) {
            cumulativeRanking[driverId].totalPoints += roundTotal;
            cumulativeRanking[driverId].constructorId = driverData.constructorId;
            cumulativeRanking[driverId].positionsHistory.push(Number(driverData.position));
          }
        }
      });
    });

    const sortedRanking = Object.values(cumulativeRanking).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    res.status(200).json(sortedRanking);
  } catch (error) {
    console.error("Erreur serveur lors du calcul du classement sélectionné :", error);
    res.status(500).json({ message: "Erreur lors du calcul du classement personnalisé." });
  }
};

/**
 * @route   GET /api/results/user/round-details/:Round
 * @desc    Récupère la fiche de score détaillée course par course en s'alignant sur la BDD
 */
export const getUserRoundDetails = async (req: any, res: Response) => {
  try {
    const Round = req.params.Round || req.params.round;
    const userId = req.user?.id;

    if (!Round) {
      return res.status(400).json({ message: "Le numéro du round est requis." });
    }

    // 1. ANCRAGE DE VÉRITÉ : On va chercher le score officiel calculé et stocké en BDD
    const scoreResult = await db.query(
      "SELECT points FROM public.user_scores WHERE user_id = $1 AND round = $2",
      [userId, Round]
    );

    // Si la ligne de score existe en BDD, on prend cette valeur, sinon 0 par défaut
    const officialTotalScore = scoreResult.rows[0] ? Number(scoreResult.rows[0].points) : 0;

    // 2. Récupération de l'alignement de l'utilisateur pour ce round
    const teamResult = await db.query(
      "SELECT driver_ids FROM user_teams WHERE user_id = $1 AND round = $2",
      [userId, Round]
    );

    let selectedDrivers: string[] = [];
    if (teamResult.rows[0] && teamResult.rows[0].driver_ids && teamResult.rows[0].driver_ids.length > 0) {
      selectedDrivers = teamResult.rows[0].driver_ids;
    } else {
      // Repli d'affichage pour les tests si aucune composition d'équipe n'a été saisie en BDD
      selectedDrivers = ["leclerc", "hamilton", "albon", "bearman", "antonelli"];
    }

    // 3. Récupération des données locales pour fabriquer le détail des cartes pilotes
    const resultPath = path.join(DATA_DIR, "results", `round_${Round}.json`);
    if (!fs.existsSync(resultPath)) {
      return res.status(404).json({ message: "Données indisponibles pour ce Grand Prix." });
    }

    const rawData = readFileSync(resultPath, "utf-8");
    const raceResults: RaceResult[] = JSON.parse(rawData);

    // 4. Calcul unitaire indicatif des cartes pilotes pour l'affichage de la modal
    const driversDetails = selectedDrivers.map((driverId) => {
      const driverData = raceResults.find((r) => r.driverId.toLowerCase() === driverId.toLowerCase());
      if (!driverData) {
        return {
          nom: driverId,
          position: 0,
          depart: 0,
          points_base: 0,
          bonus_duel: 0,
          bonus_depassement: 0,
          bonus_exploit: 0,
          total: 0
        };
      }

      try {
        const basePoints = ScoringEngine.calculateUserPoints(driverData, eliteIds);
        const bonusOvertake = ScoringEngine.calculateOvertakeBonus(driverData);
        const bonusDuel = ScoringEngine.calculateTeamMateBonus(driverData, raceResults);
        const bonusUnderdog = ScoringEngine.calculateUnderdogBonus(driverData, bottomTeamIds);

        return {
          nom: driverId,
          position: Number(driverData.position),
          depart: Number(driverData.grid),
          points_base: basePoints,
          bonus_duel: bonusDuel,
          bonus_depassement: bonusOvertake,
          bonus_exploit: bonusUnderdog,
          total: (basePoints + bonusDuel + bonusOvertake + bonusUnderdog)
        };
      } catch (scoringError) {
        console.error(`❌ Échec du calcul indicatif pour le pilote ${driverId} :`, scoringError);
        return {
          nom: driverId,
          position: Number(driverData.position || 0),
          depart: Number(driverData.grid || 0),
          points_base: 0,
          bonus_duel: 0,
          bonus_depassement: 0,
          bonus_exploit: 0,
          total: 0
        };
      }
    }).filter(Boolean);

    // ⚠️ CRUCIAL : On renvoie officialTotalScore (la BDD). Plus aucun décalage possible avec le leaderboard général !
    return res.status(200).json({ 
      totalScore: officialTotalScore, 
      driversDetails 
    });

  } catch (error) {
    console.error("Erreur détails round utilisateur :", error);
    return res.status(500).json({ message: "Erreur lors du calcul unifié des scores du round." });
  }
};

/**
 * @route   GET /api/results/leaderboard/season
 * @desc    Récupère le classement général cumulé (Saison) de tous les UTILISATEURS depuis la BDD
 */
export const getSeasonLeaderboard = async (req: Request, res: Response) => {
  try {
    const queryText = `
      SELECT 
        u.username,
        COALESCE(SUM(s.points), 0) as "totalPoints"
      FROM public.users u
      LEFT JOIN public.user_scores s ON u.id = s.user_id
      GROUP BY u.id, u.username
      ORDER BY "totalPoints" DESC
    `;
    const result = await db.query(queryText);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      points: Number(row.totalPoints),
      driversLineUp: []
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Erreur SQL getSeasonLeaderboard :", error);
    return res.status(500).json({ message: "Erreur lors du calcul du classement général." });
  }
};

/**
 * @route   GET /api/results/leaderboard/round/:Round
 * @desc    Récupère le classement de tous les UTILISATEURS avec leurs résultats pour un round spécifique
 */
export const getRoundLeaderboard = async (req: Request, res: Response) => {
  try {
    const Round = req.params.Round || req.params.round;

    if (!Round) {
      return res.status(400).json({ message: "Le numéro du round est requis." });
    }

    const queryText = `
      SELECT 
        u.username,
        COALESCE(s.points, 0) as "roundPoints",
        t.driver_ids as "driverIds"
      FROM public.users u
      INNER JOIN public.user_scores s ON u.id = s.user_id AND s.round = $1
      LEFT JOIN public.user_teams t ON u.id = t.user_id AND t.round = $1
      ORDER BY "roundPoints" DESC
    `;
    const result = await db.query(queryText, [Round]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      points: Number(row.roundPoints),
      driversLineUp: row.driverIds || []
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Erreur SQL getRoundLeaderboard :", error);
    return res.status(500).json({ message: "Erreur lors du calcul du classement du round." });
  }
};