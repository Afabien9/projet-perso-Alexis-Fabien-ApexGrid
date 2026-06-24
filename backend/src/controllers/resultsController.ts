// backend/src/controllers/resultsController.ts

import type { Request, Response } from "express";
import * as ScoringEngine from "../services/ScoringEngine.js";
import type { RaceResult } from "../models/RaceResult.js";
import { db } from "../config/ds.js";

// chargement configuration elite fond grille depuis base données
async function getSeasonConfig(round: string): Promise<{ eliteIds: string[]; bottomTeamIds: string[] }> {
  let eliteIds: string[] = [];
  let bottomTeamIds: string[] = [];

  try {
    const configResult = await db.query(
      "SELECT key, value FROM public.season_config WHERE round = $1",
      [round]
    );

    configResult.rows.forEach((row) => {
      if (row.key === "elite_ids") {
        eliteIds = row.value;
      } else if (row.key === "bottom_ids") {
        bottomTeamIds = row.value;
      }
    });
  } catch (dbError) {
    console.error("❌ Erreur de lecture de la table season_config :", dbError);
  }

  return { 
    eliteIds: Array.isArray(eliteIds) ? eliteIds : [], 
    bottomTeamIds: Array.isArray(bottomTeamIds) ? bottomTeamIds : [] 
  };
}

// recuperer resultats course round donne base donnees
export const getResultsByRound = async (req: Request, res: Response) => {
  try {
    const Round = (req.params.Round || req.params.round || "") as string;

    if (!Round) {
      return res.status(400).json({ message: "Le numéro du round est requis." });
    }

    const { eliteIds, bottomTeamIds } = await getSeasonConfig(Round);

    const dbResults = await db.query(
      "SELECT driver_id AS \"driverId\", constructor_id AS \"constructorId\", grid, position, status, is_points AS \"isPoints\" FROM public.race_results WHERE round = $1 ORDER BY position ASC",
      [Round]
    );

    if (dbResults.rows.length === 0) {
      return res.status(404).json({ message: "Les résultats de ce round ne sont pas encore disponibles." });
    }

    const myData: RaceResult[] = dbResults.rows;

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

    return res.status(200).json(allDriver);
  } catch (error) {
    console.error("Erreur getResultsByRound :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des résultats." });
  }
};

// calculer classement general saison pilote utilisateur base donnees
export const getSelectedRanking = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const teamResult = await db.query(
      "SELECT driver_ids FROM public.user_teams WHERE user_id = $1 ORDER BY round DESC LIMIT 1",
      [userId]
    );

    if (!teamResult.rows[0] || !teamResult.rows[0].driver_ids || teamResult.rows[0].driver_ids.length === 0) {
      return res.status(200).json([]);
    }

    const selectedDrivers: string[] = teamResult.rows[0].driver_ids;

    const dbRaceRecords = await db.query(
      "SELECT round, driver_id AS \"driverId\", constructor_id AS \"constructorId\", grid, position, status, is_points AS \"isPoints\" FROM public.race_results"
    );

    if (dbRaceRecords.rows.length === 0) {
      return res.status(200).json([]);
    }

    const allConfigs = await db.query("SELECT round, key, value FROM public.season_config");
    const configMap: Record<string, { eliteIds: string[]; bottomTeamIds: string[] }> = {};

    allConfigs.rows.forEach(row => {
      if (!configMap[row.round]) {
        configMap[row.round] = { eliteIds: [], bottomTeamIds: [] };
      }

      const currentConfig = configMap[row.round]!;
      if (row.key === "elite_ids") currentConfig.eliteIds = row.value;
      if (row.key === "bottom_ids") currentConfig.bottomTeamIds = row.value;
    });

    const raceResultsByRound: Record<string, RaceResult[]> = {};
    dbRaceRecords.rows.forEach((row) => {
      if (!raceResultsByRound[row.round]) {
        raceResultsByRound[row.round] = [];
      }
      (raceResultsByRound[row.round] || []).push(row);
    });

    const cumulativeRanking: Record<
      string,
      { driverId: string; constructorId: string; totalPoints: number; positionsHistory: number[] }
    > = {};

    selectedDrivers.forEach((id) => {
      cumulativeRanking[id.toLowerCase()] = {
        driverId: id,
        constructorId: "non-défini",
        totalPoints: 0,
        positionsHistory: [],
      };
    });

    Object.keys(raceResultsByRound).forEach((round) => {
      const raceResults = raceResultsByRound[round] || [];
      const eliteIds = configMap[round]?.eliteIds || [];
      const bottomTeamIds = configMap[round]?.bottomTeamIds || [];

      selectedDrivers.forEach((driverId) => {
        const driverKey = driverId.toLowerCase();
        const driverData = raceResults.find((r) => r.driverId.toLowerCase() === driverKey);

        if (driverData && cumulativeRanking[driverKey]) {
          const baseScore = ScoringEngine.calculateUserPoints(driverData, eliteIds);
          const bonusDepassement = ScoringEngine.calculateOvertakeBonus(driverData);
          const bonusEquipe = ScoringEngine.calculateTeamMateBonus(driverData, raceResults);
          const malusScore = ScoringEngine.calculateUnderdogBonus(driverData, bottomTeamIds);

          const roundTotal = baseScore + bonusDepassement + bonusEquipe + malusScore;

          cumulativeRanking[driverKey].totalPoints += roundTotal;
          cumulativeRanking[driverKey].constructorId = driverData.constructorId;
          cumulativeRanking[driverKey].positionsHistory.push(Number(driverData.position));
        }
      });
    });

    const sortedRanking = Object.values(cumulativeRanking).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    return res.status(200).json(sortedRanking);
  } catch (error) {
    console.error("Erreur classement sélectionné :", error);
    return res.status(500).json({ message: "Erreur lors du calcul du classement personnalisé." });
  }
};

// recuperer fiche score detaillee utilisateur round donne
export const getUserRoundDetails = async (req: any, res: Response) => {
  try {
    const Round = (req.params.Round || req.params.round || "") as string;
    const userId = req.user?.id;

    if (!Round) {
      return res.status(400).json({ message: "Le numéro du round est requis." });
    }

    const teamResult = await db.query(
      "SELECT driver_ids FROM public.user_teams WHERE user_id = $1 AND round = $2",
      [userId, Round]
    );

    let selectedDrivers: string[] = [];
    if (teamResult.rows[0] && teamResult.rows[0].driver_ids && teamResult.rows[0].driver_ids.length > 0) {
      selectedDrivers = teamResult.rows[0].driver_ids;
    } else {
      selectedDrivers = ["leclerc", "hamilton", "albon", "bearman", "antonelli"];
    }

    const dbResults = await db.query(
      "SELECT driver_id AS \"driverId\", constructor_id AS \"constructorId\", grid, position, status, is_points AS \"isPoints\" FROM public.race_results WHERE round = $1",
      [Round]
    );

    if (dbResults.rows.length === 0) {
      return res.status(404).json({ message: "Données indisponibles pour ce Grand Prix." });
    }

    const raceResults: RaceResult[] = dbResults.rows;
    const { eliteIds, bottomTeamIds } = await getSeasonConfig(Round);

    const driversDetails = selectedDrivers.map((driverId) => {
      const driverData = raceResults.find((r) => r.driverId.toLowerCase() === driverId.toLowerCase());
      if (!driverData) {
        return {
          nom: driverId, position: 0, depart: 0, points_base: 0, bonus_duel: 0, bonus_depassement: 0, bonus_exploit: 0, total: 0
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
        return {
          nom: driverId, position: Number(driverData.position || 0), depart: Number(driverData.grid || 0), points_base: 0, bonus_duel: 0, bonus_depassement: 0, bonus_exploit: 0, total: 0
        };
      }
    }).filter(Boolean);

    const computedTotal = Math.max(0, driversDetails.reduce((sum, d) => sum + d.total, 0));

    return res.status(200).json({ 
      totalScore: computedTotal, 
      driversDetails 
    });

  } catch (error) {
    console.error("Erreur détails round utilisateur :", error);
    return res.status(500).json({ message: "Erreur lors du calcul unifié des scores du round." });
  }
};

// calculer classement automatique utilisateurs round specifique
export const getRoundLeaderboard = async (req: Request, res: Response) => {
  try {
    const Round = (req.params.Round || req.params.round || "") as string;
    if (!Round) return res.status(400).json({ message: "Le numéro du round est requis." });

    const raceResultsQuery = await db.query(
      "SELECT driver_id AS \"driverId\", constructor_id AS \"constructorId\", grid, position, status, is_points AS \"isPoints\" FROM public.race_results WHERE round = $1",
      [Round]
    );

    if (raceResultsQuery.rows.length === 0) return res.status(200).json([]);

    const raceResults: RaceResult[] = raceResultsQuery.rows;
    const { eliteIds, bottomTeamIds } = await getSeasonConfig(Round);

    const userTeamsQuery = await db.query(
      "SELECT u.username, t.driver_ids AS \"driverIds\" FROM public.users u INNER JOIN public.user_teams t ON u.id = t.user_id WHERE t.round = $1",
      [Round]
    );

    const leaderboard = userTeamsQuery.rows.map((row) => {
      const drivers: string[] = row.driverIds || [];
      let totalPoints = 0;

      drivers.forEach((driverId) => {
        const driverData = raceResults.find((r) => r.driverId.toLowerCase() === driverId.toLowerCase());
        if (driverData) {
          totalPoints += ScoringEngine.calculateUserPoints(driverData, eliteIds) +
                         ScoringEngine.calculateOvertakeBonus(driverData) +
                         ScoringEngine.calculateTeamMateBonus(driverData, raceResults) +
                         ScoringEngine.calculateUnderdogBonus(driverData, bottomTeamIds);
        }
      });

      return {
        username: row.username,
        points: Math.max(0, totalPoints),
        driversLineUp: drivers
      };
    });

    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ rank: index + 1, ...user }));

    return res.status(200).json(sortedLeaderboard);
  } catch (error) {
    console.error("Erreur getRoundLeaderboard automatique :", error);
    return res.status(500).json({ message: "Erreur lors du calcul automatique du classement." });
  }
};

// calculer classement automatique cumulatif saison utilisateurs
export const getSeasonLeaderboard = async (req: Request, res: Response) => {
  try {
    const allRaceRecords = await db.query(
      "SELECT round, driver_id AS \"driverId\", constructor_id AS \"constructorId\", grid, position, status, is_points AS \"isPoints\" FROM public.race_results"
    );

    if (allRaceRecords.rows.length === 0) return res.status(200).json([]);

    const raceResultsByRound: Record<string, RaceResult[]> = {};
    allRaceRecords.rows.forEach((row) => {
      if (!raceResultsByRound[row.round]) {
        raceResultsByRound[row.round] = [];
      }
      (raceResultsByRound[row.round] || []).push(row);
    });

    const allConfigs = await db.query("SELECT round, key, value FROM public.season_config");
    const configMap: Record<string, { eliteIds: string[]; bottomTeamIds: string[] }> = {};

    allConfigs.rows.forEach(row => {
      if (!configMap[row.round]) configMap[row.round] = { eliteIds: [], bottomTeamIds: [] };
      const currentConfig = configMap[row.round]!;
      if (row.key === "elite_ids") currentConfig.eliteIds = row.value;
      if (row.key === "bottom_ids") currentConfig.bottomTeamIds = row.value;
    });

    const userTeamsQuery = await db.query(
      "SELECT u.username, t.round, t.driver_ids AS \"driverIds\" FROM public.users u INNER JOIN public.user_teams t ON u.id = t.user_id"
    );

    const userScoresMap: Record<string, number> = {};

    userTeamsQuery.rows.forEach((row) => {
      const round = row.round;
      const drivers: string[] = row.driverIds || [];
      const raceResults = raceResultsByRound[round] || [];
      const currentConfig = configMap[round] || { eliteIds: [], bottomTeamIds: [] };
      const eliteIds = currentConfig.eliteIds;
      const bottomTeamIds = currentConfig.bottomTeamIds;

      let roundPoints = 0;
      drivers.forEach((driverId) => {
        const driverData = raceResults.find((r) => r.driverId.toLowerCase() === driverId.toLowerCase());
        if (driverData) {
          roundPoints += ScoringEngine.calculateUserPoints(driverData, eliteIds) +
                         ScoringEngine.calculateOvertakeBonus(driverData) +
                         ScoringEngine.calculateTeamMateBonus(driverData, raceResults) +
                         ScoringEngine.calculateUnderdogBonus(driverData, bottomTeamIds);
        }
      });

      userScoresMap[row.username] = (userScoresMap[row.username] || 0) + Math.max(0, roundPoints);
    });

    const leaderboard = Object.keys(userScoresMap).map((username) => ({
      username,
      points: userScoresMap[username] || 0,
      driversLineUp: []
    }));

    const sortedLeaderboard = leaderboard
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((user, index) => ({ rank: index + 1, ...user }));

    return res.status(200).json(sortedLeaderboard);
  } catch (error) {
    console.error("Erreur getSeasonLeaderboard automatique :", error);
    return res.status(500).json({ message: "Erreur lors du calcul du classement général." });
  }
};