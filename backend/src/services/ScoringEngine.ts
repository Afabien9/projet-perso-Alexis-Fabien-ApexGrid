import type { RaceResult } from "../models/RaceResult.js";


export const calculateUserPoints = (result: RaceResult, eliteIds: string[]): number => {
  const pointsTable = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
  let score = pointsTable[Number(result.position) - 1] || 0;

  
  if (eliteIds.includes(result.driverId) && Number(result.position) > 10) {
    score -= 10;
  }
  return score;
};


export const calculateTeamMateBonus = (
  currentDriver: RaceResult,
  allRaceResults: RaceResult[],
): number => {
  const teammate = allRaceResults.find(
    (otherDriver) =>
      otherDriver.constructorId === currentDriver.constructorId &&
      otherDriver.driverId !== currentDriver.driverId,
  );

  if (!teammate) return 0;

  
  if (Number(currentDriver.position) < Number(teammate.position)) {
    return 3;
  }
  return 0;
};


export const calculateOvertakeBonus = (result: RaceResult): number => {
  const positionGained = Number(result.grid) - Number(result.position);
  // Rapporte 1 points par place gagnée
  return positionGained > 0 ? positionGained * 1 : 0;
};


export const calculateUnderdogBonus = (result: RaceResult, bottomTeamIds: string[]): number => {
  // Rapporte 15 points si une écurie de fond de grille finit dans le top 10
  if (bottomTeamIds.includes(result.constructorId) && Number(result.position) <= 10) {
    return 15;
  }
  return 0;
};